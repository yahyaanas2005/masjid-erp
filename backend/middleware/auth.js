const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token or user not found'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user.userId;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token expired'
            });
        }
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
};

/**
 * Check if user has minimum verification tier
 */
const requireVerificationTier = (minTier) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (req.user.verificationTier < minTier) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Verification Tier ${minTier} required. Current tier: ${req.user.verificationTier}`,
                requiredTier: minTier,
                currentTier: req.user.verificationTier
            });
        }

        next();
    };
};

/**
 * Check if user is admin/committee member of a masjid
 */
const requireMasjidAdmin = async (req, res, next) => {
    try {
        const { Masjid } = require('../models');
        const masjidId = req.params.masjidId || req.body.masjidId;

        if (!masjidId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Masjid ID required'
            });
        }

        const masjid = await Masjid.findByPk(masjidId);

        if (!masjid) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Masjid not found'
            });
        }

        // Check if user is imam or committee member
        const isImam = masjid.imamId === req.userId;
        const isCommitteeMember = masjid.committeeMembers.includes(req.userId);

        if (!isImam && !isCommitteeMember) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Only masjid administrators can perform this action'
            });
        }

        req.masjid = masjid;
        next();
    } catch (error) {
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authorization check failed'
        });
    }
};

/**
 * Optional authentication - attach user if token exists, but don't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (user && user.isActive) {
            req.user = user;
            req.userId = user.userId;
        }

        next();
    } catch (error) {
        // Ignore errors for optional auth
        next();
    }
};

module.exports = {
    authenticate,
    requireVerificationTier,
    requireMasjidAdmin,
    optionalAuth
};
