const express = require('express');
const { body, param, query } = require('express-validator');
const { User, Masjid } = require('../models');
const { authenticate, requireVerificationTier } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const VerificationMatrixService = require('../services/VerificationMatrixService');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            include: [
                { model: Masjid, as: 'primaryMasjid' },
                { model: Masjid, as: 'childhoodMasjid' },
                { model: Masjid, as: 'ancestralMasjid' }
            ]
        });

        res.json({
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user profile'
        });
    }
});

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/me',
    [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('email')
            .optional()
            .isEmail().withMessage('Invalid email address'),
        body('gender')
            .optional()
            .isIn(['male', 'female']).withMessage('Gender must be male or female'),
        body('dateOfBirth')
            .optional()
            .isDate().withMessage('Invalid date of birth')
    ],
    validate,
    async (req, res) => {
        try {
            const { name, email, gender, dateOfBirth, profilePhoto } = req.body;
            const user = await User.findByPk(req.userId);

            if (name) user.name = name;
            if (email) user.email = email;
            if (gender) user.gender = gender;
            if (dateOfBirth) user.dateOfBirth = dateOfBirth;
            if (profilePhoto) user.profilePhoto = profilePhoto;

            await user.save();

            res.json({
                message: 'Profile updated successfully',
                user: user.toPublicJSON()
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update profile'
            });
        }
    }
);

/**
 * @route   POST /api/v1/users/location
 * @desc    Update user home location
 * @access  Private
 */
router.post('/location',
    [
        body('latitude')
            .notEmpty().withMessage('Latitude is required')
            .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('longitude')
            .notEmpty().withMessage('Longitude is required')
            .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('address')
            .optional()
            .trim()
    ],
    validate,
    async (req, res) => {
        try {
            const { latitude, longitude, address } = req.body;
            const user = await User.findByPk(req.userId);

            user.homeLocation = {
                latitude,
                longitude,
                address: address || '',
                verifiedAt: new Date()
            };

            await user.save();

            res.json({
                message: 'Location updated successfully',
                location: user.homeLocation
            });
        } catch (error) {
            console.error('Update location error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update location'
            });
        }
    }
);

/**
 * @route   POST /api/v1/users/masjid-connection
 * @desc    Connect to a masjid (primary, childhood, or ancestral)
 * @access  Private
 */
router.post('/masjid-connection',
    [
        body('masjidId')
            .notEmpty().withMessage('Masjid ID is required')
            .isUUID().withMessage('Invalid masjid ID'),
        body('connectionType')
            .notEmpty().withMessage('Connection type is required')
            .isIn(['primary', 'childhood', 'ancestral']).withMessage('Invalid connection type')
    ],
    validate,
    async (req, res) => {
        try {
            const { masjidId, connectionType } = req.body;
            const user = await User.findByPk(req.userId);
            const masjid = await Masjid.findByPk(masjidId);

            if (!masjid) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Masjid not found'
                });
            }

            // Update connection
            if (connectionType === 'primary') {
                user.primaryMasjidId = masjidId;
            } else if (connectionType === 'childhood') {
                user.childhoodMasjidId = masjidId;
            } else if (connectionType === 'ancestral') {
                user.ancestralMasjidId = masjidId;
            }

            // Add to visited masajid if not already there
            if (!user.visitedMasajid.includes(masjidId)) {
                user.visitedMasajid = [...user.visitedMasajid, masjidId];
            }

            await user.save();

            res.json({
                message: `Connected to ${masjid.name} as ${connectionType} masjid`,
                masjid: masjid.toJSON()
            });
        } catch (error) {
            console.error('Connect masjid error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to connect to masjid'
            });
        }
    }
);

/**
 * @route   GET /api/v1/users/verification
 * @desc    Get user verification status and eligibility
 * @access  Private
 */
router.get('/verification', async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);

        // Check eligibility for next tier
        let nextTierEligibility = null;

        if (user.verificationTier === 1) {
            nextTierEligibility = await VerificationMatrixService.checkTier2Eligibility(req.userId);
        } else if (user.verificationTier === 2) {
            nextTierEligibility = await VerificationMatrixService.checkTier3Eligibility(req.userId);
        }

        res.json({
            currentTier: user.verificationTier,
            verificationHistory: user.verificationHistory,
            nextTierEligibility
        });
    } catch (error) {
        console.error('Get verification error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get verification status'
        });
    }
});

/**
 * @route   POST /api/v1/users/upgrade-tier
 * @desc    Attempt to upgrade verification tier (auto-upgrade for Tier 2 & 3)
 * @access  Private
 */
router.post('/upgrade-tier', async (req, res) => {
    try {
        const result = await VerificationMatrixService.autoCheckAndUpgrade(req.userId);

        if (result.upgraded) {
            res.json({
                message: `Congratulations! Upgraded to Tier ${result.newTier}`,
                previousTier: result.previousTier,
                newTier: result.newTier
            });
        } else {
            res.json({
                message: 'Not eligible for upgrade yet',
                currentTier: result.newTier
            });
        }
    } catch (error) {
        console.error('Upgrade tier error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message || 'Failed to upgrade tier'
        });
    }
});

/**
 * @route   PUT /api/v1/users/privacy
 * @desc    Update privacy settings
 * @access  Private
 */
router.put('/privacy',
    [
        body('locationSharingEnabled')
            .optional()
            .isBoolean().withMessage('locationSharingEnabled must be boolean'),
        body('visibilitySettings.showOnCommunityMap')
            .optional()
            .isBoolean().withMessage('showOnCommunityMap must be boolean'),
        body('visibilitySettings.shareAttendanceStats')
            .optional()
            .isBoolean().withMessage('shareAttendanceStats must be boolean')
    ],
    validate,
    async (req, res) => {
        try {
            const { locationSharingEnabled, visibilitySettings } = req.body;
            const user = await User.findByPk(req.userId);

            if (locationSharingEnabled !== undefined) {
                user.locationSharingEnabled = locationSharingEnabled;
            }

            if (visibilitySettings) {
                user.visibilitySettings = {
                    ...user.visibilitySettings,
                    ...visibilitySettings
                };
            }

            await user.save();

            res.json({
                message: 'Privacy settings updated successfully',
                locationSharingEnabled: user.locationSharingEnabled,
                visibilitySettings: user.visibilitySettings
            });
        } catch (error) {
            console.error('Update privacy error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update privacy settings'
            });
        }
    }
);

/**
 * @route   PUT /api/v1/users/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
router.put('/fcm-token',
    [
        body('fcmToken')
            .notEmpty().withMessage('FCM token is required')
    ],
    validate,
    async (req, res) => {
        try {
            const { fcmToken } = req.body;
            const user = await User.findByPk(req.userId);

            user.fcmToken = fcmToken;
            await user.save();

            res.json({
                message: 'FCM token updated successfully'
            });
        } catch (error) {
            console.error('Update FCM token error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update FCM token'
            });
        }
    }
);

module.exports = router;
