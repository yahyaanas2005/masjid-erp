const express = require('express');
const { body, param, query } = require('express-validator');
const { MosqueNeed, Masjid } = require('../models');
const { authenticate, requireVerificationTier, requireMasjidAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/v1/needs
 * @desc    Get all mosque needs (with filters)
 * @access  Public (with optional auth)
 */
router.get('/',
    [
        query('masjidId')
            .optional()
            .isUUID().withMessage('Invalid masjid ID'),
        query('status')
            .optional()
            .isIn(['open', 'in_progress', 'fulfilled', 'cancelled']).withMessage('Invalid status'),
        query('category')
            .optional()
            .isIn(['infrastructure', 'utilities', 'supplies', 'technology', 'maintenance', 'other'])
            .withMessage('Invalid category')
    ],
    validate,
    async (req, res) => {
        try {
            const { masjidId, status, category } = req.query;

            const where = {};
            if (masjidId) where.masjidId = masjidId;
            if (status) where.status = status;
            if (category) where.category = category;

            const needs = await MosqueNeed.findAll({
                where,
                include: [
                    { model: Masjid, as: 'masjid', attributes: ['masjidId', 'name', 'arabicName'] }
                ],
                order: [
                    ['priority', 'DESC'],
                    ['created_at', 'DESC']
                ]
            });

            res.json({
                needs,
                count: needs.length
            });
        } catch (error) {
            console.error('Get mosque needs error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get mosque needs'
            });
        }
    }
);

/**
 * @route   GET /api/v1/needs/:id
 * @desc    Get mosque need details
 * @access  Public
 */
router.get('/:id',
    [
        param('id').isUUID().withMessage('Invalid need ID')
    ],
    validate,
    async (req, res) => {
        try {
            const need = await MosqueNeed.findByPk(req.params.id, {
                include: [
                    { model: Masjid, as: 'masjid', attributes: ['masjidId', 'name', 'arabicName', 'location'] }
                ]
            });

            if (!need) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Mosque need not found'
                });
            }

            res.json({
                need: need.toJSON()
            });
        } catch (error) {
            console.error('Get mosque need error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to get mosque need'
            });
        }
    }
);

/**
 * @route   POST /api/v1/needs
 * @desc    Create new mosque need
 * @access  Private (Masjid Admin only)
 */
router.post('/',
    authenticate,
    requireMasjidAdmin,
    [
        body('title')
            .trim()
            .notEmpty().withMessage('Title is required')
            .isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
        body('description')
            .trim()
            .notEmpty().withMessage('Description is required'),
        body('category')
            .notEmpty().withMessage('Category is required')
            .isIn(['infrastructure', 'utilities', 'supplies', 'technology', 'maintenance', 'other'])
            .withMessage('Invalid category'),
        body('totalCost')
            .notEmpty().withMessage('Total cost is required')
            .isFloat({ min: 0 }).withMessage('Total cost must be non-negative'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
    ],
    validate,
    async (req, res) => {
        try {
            const {
                title,
                description,
                category,
                totalCost,
                currency = 'USD',
                requiresDelivery = false,
                deliveryAddress,
                deadline,
                priority = 'medium',
                images = []
            } = req.body;

            const masjid = req.masjid; // Set by requireMasjidAdmin middleware

            const need = await MosqueNeed.create({
                masjidId: masjid.masjidId,
                title,
                description,
                category,
                totalCost,
                currency,
                requiresDelivery,
                deliveryAddress: requiresDelivery ? deliveryAddress : null,
                deadline,
                priority,
                images
            });

            res.status(201).json({
                message: 'Mosque need created successfully',
                need: need.toJSON()
            });
        } catch (error) {
            console.error('Create mosque need error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to create mosque need'
            });
        }
    }
);

/**
 * @route   POST /api/v1/needs/:id/contribute
 * @desc    Contribute to a mosque need
 * @access  Private (Tier 2+)
 */
router.post('/:id/contribute',
    authenticate,
    requireVerificationTier(2),
    [
        param('id').isUUID().withMessage('Invalid need ID'),
        body('amount')
            .notEmpty().withMessage('Amount is required')
            .isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01'),
        body('message')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Message must be max 500 characters')
    ],
    validate,
    async (req, res) => {
        try {
            const { amount, message = '' } = req.body;
            const need = await MosqueNeed.findByPk(req.params.id);

            if (!need) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Mosque need not found'
                });
            }

            if (need.status === 'fulfilled' || need.status === 'cancelled') {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Cannot contribute to ${need.status} need`
                });
            }

            // Add contribution
            const contribution = {
                userId: req.userId,
                amount: parseFloat(amount),
                contributedAt: new Date(),
                message
            };

            need.contributors = [...need.contributors, contribution];
            need.amountRaised = parseFloat(need.amountRaised) + parseFloat(amount);

            // Check if fully funded
            if (need.amountRaised >= need.totalCost) {
                need.status = 'fulfilled';
                need.fulfilledAt = new Date();
            } else if (need.amountRaised > 0 && need.status === 'open') {
                need.status = 'in_progress';
            }

            await need.save();

            res.json({
                message: 'Contribution recorded successfully. May Allah reward you!',
                need: need.toJSON(),
                contribution
            });
        } catch (error) {
            console.error('Contribute to need error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to contribute to mosque need'
            });
        }
    }
);

/**
 * @route   PUT /api/v1/needs/:id
 * @desc    Update mosque need
 * @access  Private (Masjid Admin only)
 */
router.put('/:id',
    authenticate,
    requireMasjidAdmin,
    [
        param('id').isUUID().withMessage('Invalid need ID')
    ],
    validate,
    async (req, res) => {
        try {
            const need = await MosqueNeed.findByPk(req.params.id);

            if (!need) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Mosque need not found'
                });
            }

            // Verify masjid ownership
            if (need.masjidId !== req.masjid.masjidId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only update needs from your masjid'
                });
            }

            const { title, description, status, priority, proofOfPurchase } = req.body;

            if (title) need.title = title;
            if (description) need.description = description;
            if (status) need.status = status;
            if (priority) need.priority = priority;
            if (proofOfPurchase) need.proofOfPurchase = proofOfPurchase;

            if (status === 'fulfilled' && !need.fulfilledAt) {
                need.fulfilledAt = new Date();
                need.fulfilledBy = req.userId;
            }

            await need.save();

            res.json({
                message: 'Mosque need updated successfully',
                need: need.toJSON()
            });
        } catch (error) {
            console.error('Update mosque need error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to update mosque need'
            });
        }
    }
);

/**
 * @route   DELETE /api/v1/needs/:id
 * @desc    Cancel/delete mosque need
 * @access  Private (Masjid Admin only)
 */
router.delete('/:id',
    authenticate,
    requireMasjidAdmin,
    [
        param('id').isUUID().withMessage('Invalid need ID')
    ],
    validate,
    async (req, res) => {
        try {
            const need = await MosqueNeed.findByPk(req.params.id);

            if (!need) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Mosque need not found'
                });
            }

            // Verify masjid ownership
            if (need.masjidId !== req.masjid.masjidId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can only delete needs from your masjid'
                });
            }

            // If there are contributions, mark as cancelled instead of deleting
            if (need.contributors.length > 0) {
                need.status = 'cancelled';
                await need.save();
                return res.json({
                    message: 'Mosque need cancelled (has contributions)',
                    need: need.toJSON()
                });
            }

            await need.destroy();

            res.json({
                message: 'Mosque need deleted successfully'
            });
        } catch (error) {
            console.error('Delete mosque need error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to delete mosque need'
            });
        }
    }
);

module.exports = router;
