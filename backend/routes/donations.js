const express = require('express');
const { body, param, query } = require('express-validator');
const { Donation, Masjid, User } = require('../models');
const { authenticate, requireVerificationTier, requireMasjidAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/donations
 * @desc    Make a donation
 * @access  Private (Tier 2+)
 */
router.post('/',
    requireVerificationTier(2),
    [
        body('masjidId')
            .notEmpty().withMessage('Masjid ID is required')
            .isUUID().withMessage('Invalid masjid ID'),
        body('amount')
            .notEmpty().withMessage('Amount is required')
            .isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
        body('currency')
            .optional()
            .isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
        body('donationType')
            .notEmpty().withMessage('Donation type is required')
            .isIn(['sadaqah', 'zakat', 'lillah', 'fidya', 'kaffarah', 'aqiqah', 'general'])
            .withMessage('Invalid donation type'),
        body('zakatType')
            .optional()
            .isIn(['zakat_ul_mal', 'zakat_ul_fitr']).withMessage('Invalid zakat type'),
        body('paymentMethod')
            .notEmpty().withMessage('Payment method is required')
            .isIn(['cash', 'card', 'bank_transfer', 'digital_wallet']).withMessage('Invalid payment method'),
        body('allocatedTo')
            .optional()
            .trim(),
        body('isRecurring')
            .optional()
            .isBoolean().withMessage('isRecurring must be boolean'),
        body('isAnonymous')
            .optional()
            .isBoolean().withMessage('isAnonymous must be boolean')
    ],
    validate,
    async (req, res) => {
        try {
            const {
                masjidId,
                amount,
                currency = 'USD',
                donationType,
                zakatType,
                paymentMethod,
                allocatedTo,
                isRecurring = false,
                recurringFrequency,
                isAnonymous = false,
                notes
            } = req.body;

            // Verify masjid exists
            const masjid = await Masjid.findByPk(masjidId);
            if (!masjid) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Masjid not found'
                });
            }

            // Create donation
            const donation = await Donation.create({
                donorId: req.userId,
                masjidId,
                amount,
                currency,
                donationType,
                zakatType,
                paymentMethod,
                paymentStatus: paymentMethod === 'cash' ? 'completed' : 'pending',
                allocatedTo,
                isRecurring,
                recurringFrequency,
                isAnonymous,
                notes
            });

            // Generate receipt number
            const receiptNumber = `RCP-${masjid.name.substring(0, 3).toUpperCase()}-${Date.now()}`;
            donation.receiptNumber = receiptNumber;

            // If payment is completed, update masjid balance
            if (donation.paymentStatus === 'completed') {
                donation.processedAt = new Date();
                donation.receiptIssued = true;

                masjid.totalDonations = parseFloat(masjid.totalDonations) + parseFloat(amount);
                masjid.currentBalance = parseFloat(masjid.currentBalance) + parseFloat(amount);
                await masjid.save();
            }

            await donation.save();

            res.status(201).json({
                message: 'Donation recorded successfully. May Allah accept your charity!',
                donation: donation.toJSON()
            });
        } catch (error) {
            console.error('Create donation error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to process donation'
            });
        }
    }
);

/**
 * @route   GET /api/v1/donations/my-donations
 * @desc    Get user's donation history
 * @access  Private
 */
router.get('/my-donations',
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

            const donations = await Donation.findAll({
                where: { donorId: req.userId },
                include: [
                    { model: Masjid, as: 'masjid', attributes: ['masjidId', 'name', 'arabicName'] }
                ],
                order: [['donated_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const total = await Donation.count({
                where: { donorId: req.userId }
            });

            // Calculate total donated
            const totalDonated = await Donation.sum('amount', {
                where: { donorId: req.userId, paymentStatus: 'completed' }
            });

            res.json({
                donations,
                totalDonated: totalDonated || 0,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: total > parseInt(offset) + parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Get donations error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get donation history'
            });
        }
    }
);

/**
 * @route   GET /api/v1/donations/masjid/:masjidId
 * @desc    Get masjid's donation history (public transparency)
 * @access  Public (with optional auth)
 */
router.get('/masjid/:masjidId',
    [
        param('masjidId').isUUID().withMessage('Invalid masjid ID'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
    ],
    validate,
    async (req, res) => {
        try {
            const { masjidId } = req.params;
            const { limit = 20 } = req.query;

            const donations = await Donation.findAll({
                where: {
                    masjidId,
                    paymentStatus: 'completed'
                },
                attributes: ['donationId', 'amount', 'currency', 'donationType', 'allocatedTo', 'donatedAt', 'isAnonymous'],
                order: [['donated_at', 'DESC']],
                limit: parseInt(limit)
            });

            // Hide donor info for anonymous donations
            const publicDonations = donations.map(d => {
                const donation = d.toJSON();
                if (donation.isAnonymous) {
                    donation.donorName = 'Anonymous';
                }
                return donation;
            });

            // Get donation statistics
            const { Op } = require('sequelize');
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);

            const monthlyTotal = await Donation.sum('amount', {
                where: {
                    masjidId,
                    paymentStatus: 'completed',
                    donatedAt: {
                        [Op.gte]: thisMonth
                    }
                }
            });

            const totalDonations = await Donation.sum('amount', {
                where: {
                    masjidId,
                    paymentStatus: 'completed'
                }
            });

            res.json({
                donations: publicDonations,
                statistics: {
                    monthlyTotal: monthlyTotal || 0,
                    totalDonations: totalDonations || 0
                }
            });
        } catch (error) {
            console.error('Get masjid donations error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get masjid donations'
            });
        }
    }
);

/**
 * @route   GET /api/v1/donations/masjid/:masjidId/transparency
 * @desc    Get masjid transparency dashboard
 * @access  Public
 */
router.get('/masjid/:masjidId/transparency',
    [
        param('masjidId').isUUID().withMessage('Invalid masjid ID')
    ],
    validate,
    async (req, res) => {
        try {
            const { masjidId } = req.params;

            const masjid = await Masjid.findByPk(masjidId);
            if (!masjid) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Masjid not found'
                });
            }

            // Get donation breakdown by type
            const donationsByType = await Donation.findAll({
                where: {
                    masjidId,
                    paymentStatus: 'completed'
                },
                attributes: [
                    'donationType',
                    [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
                    [require('sequelize').fn('COUNT', require('sequelize').col('donation_id')), 'count']
                ],
                group: ['donation_type']
            });

            // Get monthly trend (last 6 months)
            const { Op } = require('sequelize');
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const monthlyTrend = await Donation.findAll({
                where: {
                    masjidId,
                    paymentStatus: 'completed',
                    donatedAt: {
                        [Op.gte]: sixMonthsAgo
                    }
                },
                attributes: [
                    [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('donated_at')), 'month'],
                    [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total']
                ],
                group: [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('donated_at'))],
                order: [[require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('donated_at')), 'ASC']]
            });

            res.json({
                financial: {
                    totalDonations: masjid.totalDonations,
                    totalExpenses: masjid.totalExpenses,
                    currentBalance: masjid.currentBalance
                },
                donationsByType,
                monthlyTrend,
                community: {
                    registeredMembers: masjid.registeredCommunity
                }
            });
        } catch (error) {
            console.error('Get transparency dashboard error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get transparency dashboard'
            });
        }
    }
);

module.exports = router;
