const express = require('express');
const { body, param, query } = require('express-validator');
const { PrayerCheckIn, User, Masjid } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const GeolocationService = require('../services/GeolocationService');
const VerificationMatrixService = require('../services/VerificationMatrixService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/prayers/checkin
 * @desc    Check in for prayer with geolocation verification
 * @access  Private
 */
router.post('/checkin',
    [
        body('masjidId')
            .notEmpty().withMessage('Masjid ID is required')
            .isUUID().withMessage('Invalid masjid ID'),
        body('prayerName')
            .notEmpty().withMessage('Prayer name is required')
            .isIn(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah']).withMessage('Invalid prayer name'),
        body('latitude')
            .notEmpty().withMessage('Latitude is required')
            .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('longitude')
            .notEmpty().withMessage('Longitude is required')
            .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('checkInMethod')
            .optional()
            .isIn(['auto', 'manual']).withMessage('Invalid check-in method')
    ],
    validate,
    async (req, res) => {
        try {
            const { masjidId, prayerName, latitude, longitude, checkInMethod = 'manual' } = req.body;

            // Get masjid
            const masjid = await Masjid.findByPk(masjidId);
            if (!masjid) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Masjid not found'
                });
            }

            // Verify user is within geo-fence
            const userLocation = { latitude, longitude };
            const masjidLocation = {
                latitude: masjid.location.latitude,
                longitude: masjid.location.longitude
            };

            const verification = GeolocationService.verifyUserInMasjidRadius(
                userLocation,
                masjidLocation,
                masjid.verificationRadius
            );

            // Create check-in
            const checkIn = await PrayerCheckIn.create({
                userId: req.userId,
                masjidId,
                prayerName,
                userLocation,
                distanceFromMasjid: verification.distance,
                isVerified: verification.isWithinRadius,
                checkInMethod
            });

            // Update user prayer stats
            const user = await User.findByPk(req.userId);
            const stats = user.prayerStats;

            stats.totalCheckIns += 1;
            stats.lastCheckIn = new Date();

            // Update streak
            const lastCheckIn = stats.lastCheckIn ? new Date(stats.lastCheckIn) : null;
            if (lastCheckIn) {
                const daysSinceLastCheckIn = Math.floor((new Date() - lastCheckIn) / (1000 * 60 * 60 * 24));
                if (daysSinceLastCheckIn === 1) {
                    stats.currentStreak += 1;
                    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
                } else if (daysSinceLastCheckIn > 1) {
                    stats.currentStreak = 1;
                }
            } else {
                stats.currentStreak = 1;
                stats.longestStreak = 1;
            }

            user.prayerStats = stats;
            await user.save();

            // Check if user can be upgraded to Tier 2
            if (user.verificationTier === 1 && verification.isWithinRadius) {
                const upgradeResult = await VerificationMatrixService.autoCheckAndUpgrade(req.userId);
                if (upgradeResult.upgraded) {
                    return res.json({
                        message: 'Prayer check-in successful! 🎉 Congratulations on reaching Tier 2!',
                        checkIn: checkIn.toJSON(),
                        verification,
                        tierUpgrade: {
                            previousTier: upgradeResult.previousTier,
                            newTier: upgradeResult.newTier
                        }
                    });
                }
            }

            res.json({
                message: verification.isWithinRadius
                    ? 'Prayer check-in successful!'
                    : `Check-in recorded, but you are ${verification.distance}m from the masjid (outside ${masjid.verificationRadius}m radius)`,
                checkIn: checkIn.toJSON(),
                verification,
                prayerStats: stats
            });
        } catch (error) {
            console.error('Prayer check-in error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to check in for prayer'
            });
        }
    }
);

/**
 * @route   GET /api/v1/prayers/my-history
 * @desc    Get user's prayer check-in history
 * @access  Private
 */
router.get('/my-history',
    [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
        query('offset')
            .optional()
            .isInt({ min: 0 }).withMessage('Offset must be non-negative')
    ],
    validate,
    async (req, res) => {
        try {
            const { limit = 20, offset = 0 } = req.query;

            const checkIns = await PrayerCheckIn.findAll({
                where: { userId: req.userId },
                include: [
                    { model: Masjid, as: 'masjid', attributes: ['masjidId', 'name', 'arabicName'] }
                ],
                order: [['check_in_time', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const total = await PrayerCheckIn.count({
                where: { userId: req.userId }
            });

            const user = await User.findByPk(req.userId);

            res.json({
                checkIns,
                prayerStats: user.prayerStats,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: total > parseInt(offset) + parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get prayer history error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get prayer history'
            });
        }
    }
);

/**
 * @route   GET /api/v1/prayers/stats
 * @desc    Get detailed prayer statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);

        // Get check-ins by prayer
        const { Op } = require('sequelize');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const checkInsByPrayer = await PrayerCheckIn.findAll({
            where: {
                userId: req.userId,
                checkInTime: {
                    [Op.gte]: thirtyDaysAgo
                }
            },
            attributes: [
                'prayerName',
                [require('sequelize').fn('COUNT', require('sequelize').col('check_in_id')), 'count']
            ],
            group: ['prayer_name']
        });

        // Get most visited masajid
        const mostVisitedMasajid = await PrayerCheckIn.findAll({
            where: { userId: req.userId },
            attributes: [
                'masjidId',
                [require('sequelize').fn('COUNT', require('sequelize').col('check_in_id')), 'count']
            ],
            include: [
                { model: Masjid, as: 'masjid', attributes: ['masjidId', 'name', 'arabicName'] }
            ],
            group: ['masjid_id', 'masjid.masjid_id', 'masjid.name', 'masjid.arabic_name'],
            order: [[require('sequelize').fn('COUNT', require('sequelize').col('check_in_id')), 'DESC']],
            limit: 5
        });

        res.json({
            overallStats: user.prayerStats,
            last30Days: {
                byPrayer: checkInsByPrayer,
                mostVisitedMasajid
            }
        });
    } catch (error) {
        console.error('Get prayer stats error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get prayer statistics'
        });
    }
}
);

module.exports = router;
