const express = require('express');
const { body, param, query } = require('express-validator');
const { JanazahNotification, Masjid } = require('../models');
const { authenticate, requireVerificationTier, requireMasjidAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/v1/janazah/upcoming
 * @desc    Get upcoming janazah notifications
 * @access  Private (Tier 3+)
 */
router.get('/upcoming',
    authenticate,
    requireVerificationTier(3),
    async (req, res) => {
        try {
            const { Op } = require('sequelize');
            const now = new Date();

            const janazahNotifications = await JanazahNotification.findAll({
                where: {
                    janazahTime: {
                        [Op.gte]: now
                    },
                    status: 'scheduled',
                    publicVisibility: true
                },
                include: [
                    { model: Masjid, as: 'masjid', attributes: ['masjidId', 'name', 'arabicName', 'location'] }
                ],
                order: [['janazah_time', 'ASC']]
            });

            res.json({
                janazahNotifications,
                count: janazahNotifications.length
            });
        } catch (error) {
            console.error('Get upcoming janazah error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get upcoming janazah notifications'
            });
        }
    }
);

/**
 * @route   GET /api/v1/janazah/:id
 * @desc    Get janazah notification details
 * @access  Private (Tier 3+)
 */
router.get('/:id',
    authenticate,
    requireVerificationTier(3),
    [
        param('id').isUUID().withMessage('Invalid janazah ID')
    ],
    validate,
    async (req, res) => {
        try {
            const janazah = await JanazahNotification.findByPk(req.params.id, {
                include: [
                    { model: Masjid, as: 'masjid', attributes: ['masjidId', 'name', 'arabicName', 'location', 'phone'] }
                ]
            });

            if (!janazah) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Janazah notification not found'
                });
            }

            if (!janazah.publicVisibility && !janazah.notifiedUsers.includes(req.userId)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'This janazah notification is private'
                });
            }

            res.json({
                janazah: janazah.toJSON()
            });
        } catch (error) {
            console.error('Get janazah error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get janazah notification'
            });
        }
    }
);

/**
 * @route   POST /api/v1/janazah
 * @desc    Create janazah notification
 * @access  Private (Masjid Admin only)
 */
router.post('/',
    authenticate,
    requireMasjidAdmin,
    [
        body('deceasedName')
            .trim()
            .notEmpty().withMessage('Deceased name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('gender')
            .notEmpty().withMessage('Gender is required')
            .isIn(['male', 'female']).withMessage('Gender must be male or female'),
        body('ageGroup')
            .optional()
            .isIn(['child', 'youth', 'adult', 'elderly']).withMessage('Invalid age group'),
        body('janazahTime')
            .notEmpty().withMessage('Janazah time is required')
            .isISO8601().withMessage('Invalid date format'),
        body('location.latitude')
            .notEmpty().withMessage('Latitude is required')
            .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('location.longitude')
            .notEmpty().withMessage('Longitude is required')
            .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('familyConsent')
            .optional()
            .isBoolean().withMessage('familyConsent must be boolean'),
        body('publicVisibility')
            .optional()
            .isBoolean().withMessage('publicVisibility must be boolean')
    ],
    validate,
    async (req, res) => {
        try {
            const {
                deceasedName,
                gender,
                ageGroup,
                janazahTime,
                location,
                burialLocation,
                burialTime,
                familyContact,
                additionalInfo,
                familyConsent = true,
                publicVisibility = true
            } = req.body;

            const masjid = req.masjid; // Set by requireMasjidAdmin middleware

            // Create janazah notification
            const janazah = await JanazahNotification.create({
                masjidId: masjid.masjidId,
                deceasedName,
                gender,
                ageGroup,
                janazahTime: new Date(janazahTime),
                location: {
                    ...location,
                    masjidId: masjid.masjidId,
                    address: location.address || masjid.location.address
                },
                burialLocation,
                burialTime: burialTime ? new Date(burialTime) : null,
                familyContact,
                additionalInfo,
                familyConsent,
                publicVisibility
            });

            // TODO: Send push notifications to Tier 3+ users
            // This would use Firebase Cloud Messaging
            // For now, we'll just mark notification as sent
            janazah.notificationSentAt = new Date();
            await janazah.save();

            res.status(201).json({
                message: 'Janazah notification created successfully. Inna lillahi wa inna ilayhi raji\'un.',
                janazah: janazah.toJSON()
            });
        } catch (error) {
            console.error('Create janazah error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to create janazah notification'
            });
        }
    }
);

/**
 * @route   POST /api/v1/janazah/:id/rsvp
 * @desc    RSVP to janazah prayer
 * @access  Private (Tier 3+)
 */
router.post('/:id/rsvp',
    authenticate,
    requireVerificationTier(3),
    [
        param('id').isUUID().withMessage('Invalid janazah ID')
    ],
    validate,
    async (req, res) => {
        try {
            const janazah = await JanazahNotification.findByPk(req.params.id);

            if (!janazah) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Janazah notification not found'
                });
            }

            // Check if already RSVP'd
            const alreadyRSVPd = janazah.attendees.some(a => a.userId === req.userId);

            if (alreadyRSVPd) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'You have already RSVP\'d to this janazah'
                });
            }

            // Add RSVP
            janazah.attendees = [
                ...janazah.attendees,
                {
                    userId: req.userId,
                    rsvpAt: new Date()
                }
            ];

            janazah.estimatedAttendance = janazah.attendees.length;
            await janazah.save();

            res.json({
                message: 'RSVP recorded successfully',
                estimatedAttendance: janazah.estimatedAttendance
            });
        } catch (error) {
            console.error('RSVP janazah error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to RSVP to janazah'
            });
        }
    }
);

/**
 * @route   PUT /api/v1/janazah/:id
 * @desc    Update janazah notification
 * @access  Private (Masjid Admin only)
 */
router.put('/:id',
    authenticate,
    requireMasjidAdmin,
    [
        param('id').isUUID().withMessage('Invalid janazah ID')
    ],
    validate,
    async (req, res) => {
        try {
            const janazah = await JanazahNotification.findByPk(req.params.id);

            if (!janazah) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Janazah notification not found'
                });
            }

            // Verify masjid ownership
            if (janazah.masjidId !== req.masjid.masjidId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only update janazah notifications from your masjid'
                });
            }

            const { janazahTime, burialLocation, burialTime, status, additionalInfo } = req.body;

            if (janazahTime) janazah.janazahTime = new Date(janazahTime);
            if (burialLocation) janazah.burialLocation = burialLocation;
            if (burialTime) janazah.burialTime = new Date(burialTime);
            if (status) janazah.status = status;
            if (additionalInfo) janazah.additionalInfo = additionalInfo;

            await janazah.save();

            res.json({
                message: 'Janazah notification updated successfully',
                janazah: janazah.toJSON()
            });
        } catch (error) {
            console.error('Update janazah error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update janazah notification'
            });
        }
    }
);

module.exports = router;
