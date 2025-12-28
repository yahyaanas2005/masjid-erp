const express = require('express');
const { body, param, query } = require('express-validator');
const { Masjid, User } = require('../models');
const { authenticate, optionalAuth, requireMasjidAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const GeolocationService = require('../services/GeolocationService');

const router = express.Router();

/**
 * @route   GET /api/v1/masajid/nearby
 * @desc    Find nearby masajid using current location
 * @access  Public (optional auth for personalization)
 */
router.get('/nearby',
    optionalAuth,
    [
        query('latitude')
            .notEmpty().withMessage('Latitude is required')
            .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        query('longitude')
            .notEmpty().withMessage('Longitude is required')
            .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        query('radius')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Radius must be between 1-100 km')
    ],
    validate,
    async (req, res) => {
        try {
            const { latitude, longitude, radius = 10 } = req.query;

            // Find masajid from Google Maps
            const googleMasajid = await GeolocationService.findNearbyMasajid(
                parseFloat(latitude),
                parseFloat(longitude),
                parseInt(radius)
            );

            // Find masajid from our database
            const dbMasajid = await Masjid.findAll({
                where: { isActive: true, isVerified: true }
            });

            // Calculate distances and combine results
            const masajidWithDistance = dbMasajid.map(masjid => {
                const distance = GeolocationService.calculateDistance(
                    { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
                    { latitude: masjid.location.latitude, longitude: masjid.location.longitude }
                );

                return {
                    ...masjid.toJSON(),
                    distance: Math.round(distance),
                    distanceKm: (distance / 1000).toFixed(2)
                };
            }).filter(m => m.distance <= radius * 1000);

            // Sort by distance
            masajidWithDistance.sort((a, b) => a.distance - b.distance);

            res.json({
                masajid: masajidWithDistance,
                googleResults: googleMasajid,
                count: masajidWithDistance.length
            });
        } catch (error) {
            console.error('Find nearby masajid error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to find nearby masajid'
            });
        }
    }
);

/**
 * @route   GET /api/v1/masajid/:id
 * @desc    Get masjid details by ID
 * @access  Public
 */
router.get('/:id',
    optionalAuth,
    [
        param('id').isUUID().withMessage('Invalid masjid ID')
    ],
    validate,
    async (req, res) => {
        try {
            const masjid = await Masjid.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'imam', attributes: ['userId', 'name', 'profilePhoto'] }
                ]
            });

            if (!masjid) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Masjid not found'
                });
            }

            // Calculate distance if user location provided
            let distance = null;
            if (req.query.latitude && req.query.longitude) {
                distance = GeolocationService.calculateDistance(
                    { latitude: parseFloat(req.query.latitude), longitude: parseFloat(req.query.longitude) },
                    { latitude: masjid.location.latitude, longitude: masjid.location.longitude }
                );
            }

            res.json({
                masjid: masjid.toJSON(),
                distance: distance ? Math.round(distance) : null
            });
        } catch (error) {
            console.error('Get masjid error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get masjid details'
            });
        }
    }
);

/**
 * @route   POST /api/v1/masajid
 * @desc    Create new masjid (admin only)
 * @access  Private (Tier 3+)
 */
router.post('/',
    authenticate,
    [
        body('name')
            .trim()
            .notEmpty().withMessage('Masjid name is required')
            .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
        body('arabicName')
            .optional()
            .trim(),
        body('location.latitude')
            .notEmpty().withMessage('Latitude is required')
            .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
        body('location.longitude')
            .notEmpty().withMessage('Longitude is required')
            .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
        body('location.address')
            .trim()
            .notEmpty().withMessage('Address is required'),
        body('prayerTimes')
            .notEmpty().withMessage('Prayer times are required')
    ],
    validate,
    async (req, res) => {
        try {
            // Only Tier 3+ users can create masajid
            if (req.user.verificationTier < 3) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Verification Tier 3 required to create masjid'
                });
            }

            const { name, arabicName, description, location, prayerTimes, phone, email, website, facilities, capacity } = req.body;

            const masjid = await Masjid.create({
                name,
                arabicName,
                description,
                location,
                prayerTimes,
                phone,
                email,
                website,
                facilities,
                capacity,
                imamId: req.userId // Creator becomes imam by default
            });

            res.status(201).json({
                message: 'Masjid created successfully',
                masjid: masjid.toJSON()
            });
        } catch (error) {
            console.error('Create masjid error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to create masjid'
            });
        }
    }
);

/**
 * @route   PUT /api/v1/masajid/:id
 * @desc    Update masjid details
 * @access  Private (Masjid Admin only)
 */
router.put('/:id',
    authenticate,
    requireMasjidAdmin,
    [
        param('id').isUUID().withMessage('Invalid masjid ID')
    ],
    validate,
    async (req, res) => {
        try {
            const { name, arabicName, description, prayerTimes, phone, email, website, facilities, capacity } = req.body;
            const masjid = req.masjid; // Set by requireMasjidAdmin middleware

            if (name) masjid.name = name;
            if (arabicName) masjid.arabicName = arabicName;
            if (description) masjid.description = description;
            if (prayerTimes) masjid.prayerTimes = prayerTimes;
            if (phone) masjid.phone = phone;
            if (email) masjid.email = email;
            if (website) masjid.website = website;
            if (facilities) masjid.facilities = { ...masjid.facilities, ...facilities };
            if (capacity) masjid.capacity = capacity;

            await masjid.save();

            res.json({
                message: 'Masjid updated successfully',
                masjid: masjid.toJSON()
            });
        } catch (error) {
            console.error('Update masjid error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update masjid'
            });
        }
    }
);

/**
 * @route   GET /api/v1/masajid/:id/heatmap
 * @desc    Get community heatmap for masjid (anonymized)
 * @access  Private (Masjid Admin only)
 */
router.get('/:id/heatmap',
    authenticate,
    requireMasjidAdmin,
    async (req, res) => {
        try {
            const masjid = req.masjid;

            // Get all users connected to this masjid with location sharing enabled
            const users = await User.findAll({
                where: {
                    primaryMasjidId: masjid.masjidId,
                    locationSharingEnabled: true
                },
                attributes: ['homeLocation']
            });

            // Extract locations
            const locations = users
                .filter(u => u.homeLocation && u.homeLocation.latitude)
                .map(u => ({
                    latitude: u.homeLocation.latitude,
                    longitude: u.homeLocation.longitude
                }));

            // Generate anonymized heatmap
            const heatmap = GeolocationService.generateCommunityHeatmap(locations);

            res.json({
                heatmap,
                totalUsers: locations.length
            });
        } catch (error) {
            console.error('Get heatmap error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to generate heatmap'
            });
        }
    }
);

/**
 * @route   GET /api/v1/masajid/:id/stats
 * @desc    Get masjid statistics
 * @access  Public
 */
router.get('/:id/stats',
    [
        param('id').isUUID().withMessage('Invalid masjid ID')
    ],
    validate,
    async (req, res) => {
        try {
            const masjid = await Masjid.findByPk(req.params.id);

            if (!masjid) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Masjid not found'
                });
            }

            res.json({
                registeredCommunity: masjid.registeredCommunity,
                averageAttendance: masjid.averageAttendance,
                totalDonations: masjid.totalDonations,
                totalExpenses: masjid.totalExpenses,
                currentBalance: masjid.currentBalance
            });
        } catch (error) {
            console.error('Get masjid stats error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get masjid statistics'
            });
        }
    }
);

module.exports = router;
