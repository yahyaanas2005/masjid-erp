const express = require('express');
const { body } = require('express-validator');
const { User } = require('../models');
const OTP = require('../models/OTP');
const { validate } = require('../middleware/validation');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { generateOTP, hashOTP, verifyOTP, isOTPExpired } = require('../utils/otp');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp',
    [
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Invalid phone number'),
        body('purpose')
            .optional()
            .isIn(['registration', 'login', 'phone_verification', 'password_reset'])
            .withMessage('Invalid purpose')
    ],
    validate,
    async (req, res) => {
        try {
            const { phone, purpose = 'login' } = req.body;

            // Check if user exists for login/verification
            const userExists = await User.findOne({ where: { phone } });

            if (purpose === 'login' && !userExists) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'User not found. Please register first.'
                });
            }

            if (purpose === 'registration' && userExists) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Phone number already registered'
                });
            }

            // Generate OTP
            const otp = generateOTP();
            const otpHash = hashOTP(otp);

            // Set expiry (10 minutes)
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            // Save OTP to database
            await OTP.create({
                phone,
                otpHash,
                purpose,
                expiresAt
            });

            // TODO: Send OTP via SMS (Twilio integration)
            // For development, return OTP in response
            if (process.env.NODE_ENV === 'development') {
                console.log(`📱 OTP for ${phone}: ${otp}`);
                return res.json({
                    message: 'OTP sent successfully',
                    otp: otp, // Only in development!
                    expiresAt
                });
            }

            // In production, don't return OTP
            res.json({
                message: 'OTP sent successfully',
                expiresAt
            });
        } catch (error) {
            console.error('Send OTP error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to send OTP'
            });
        }
    }
);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user with OTP verification
 * @access  Public
 */
router.post('/register',
    [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Invalid phone number'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('otp')
            .notEmpty().withMessage('OTP is required')
            .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
        body('email')
            .optional()
            .isEmail().withMessage('Invalid email address')
    ],
    validate,
    async (req, res) => {
        try {
            const { name, phone, password, otp, email } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { phone } });
            if (existingUser) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Phone number already registered'
                });
            }

            // Verify OTP
            const otpRecord = await OTP.findOne({
                where: {
                    phone,
                    purpose: 'registration',
                    isUsed: false
                },
                order: [['created_at', 'DESC']]
            });

            if (!otpRecord) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid or expired OTP'
                });
            }

            if (isOTPExpired(otpRecord.createdAt)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'OTP has expired'
                });
            }

            if (!verifyOTP(otp, otpRecord.otpHash)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid OTP'
                });
            }

            // Mark OTP as used
            otpRecord.isUsed = true;
            await otpRecord.save();

            // Create user
            const user = await User.create({
                name,
                phone,
                password,
                email,
                phoneVerified: true
            });

            // Generate tokens
            const accessToken = generateAccessToken({ userId: user.userId });
            const refreshToken = generateRefreshToken({ userId: user.userId });

            res.status(201).json({
                message: 'Registration successful',
                user: user.toPublicJSON(),
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Registration failed'
            });
        }
    }
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with phone and OTP
 * @access  Public
 */
router.post('/login',
    [
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Invalid phone number'),
        body('otp')
            .notEmpty().withMessage('OTP is required')
            .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    ],
    validate,
    async (req, res) => {
        try {
            const { phone, otp } = req.body;

            // Find user
            const user = await User.findOne({ where: { phone } });
            if (!user) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'User not found'
                });
            }

            if (!user.isActive) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Account is deactivated'
                });
            }

            // Verify OTP
            const otpRecord = await OTP.findOne({
                where: {
                    phone,
                    purpose: 'login',
                    isUsed: false
                },
                order: [['created_at', 'DESC']]
            });

            if (!otpRecord) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid or expired OTP'
                });
            }

            if (isOTPExpired(otpRecord.createdAt)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'OTP has expired'
                });
            }

            if (!verifyOTP(otp, otpRecord.otpHash)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid OTP'
                });
            }

            // Mark OTP as used
            otpRecord.isUsed = true;
            await otpRecord.save();

            // Update last login
            user.lastLoginAt = new Date();
            await user.save();

            // Generate tokens
            const accessToken = generateAccessToken({ userId: user.userId });
            const refreshToken = generateRefreshToken({ userId: user.userId });

            res.json({
                message: 'Login successful',
                user: user.toPublicJSON(),
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Login failed'
            });
        }
    }
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP without logging in (for phone verification)
 * @access  Public
 */
router.post('/verify-otp',
    [
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required'),
        body('otp')
            .notEmpty().withMessage('OTP is required')
            .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    ],
    validate,
    async (req, res) => {
        try {
            const { phone, otp } = req.body;

            const otpRecord = await OTP.findOne({
                where: {
                    phone,
                    isUsed: false
                },
                order: [['created_at', 'DESC']]
            });

            if (!otpRecord) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid or expired OTP',
                    verified: false
                });
            }

            if (isOTPExpired(otpRecord.createdAt)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'OTP has expired',
                    verified: false
                });
            }

            if (!verifyOTP(otp, otpRecord.otpHash)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Invalid OTP',
                    verified: false
                });
            }

            res.json({
                message: 'OTP verified successfully',
                verified: true
            });
        } catch (error) {
            console.error('Verify OTP error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Verification failed'
            });
        }
    }
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
    [
        body('refreshToken')
            .notEmpty().withMessage('Refresh token is required')
    ],
    validate,
    async (req, res) => {
        try {
            const { refreshToken } = req.body;
            const { verifyToken } = require('../utils/jwt');

            // Verify refresh token
            const decoded = verifyToken(refreshToken);

            // Get user
            const user = await User.findByPk(decoded.userId);
            if (!user || !user.isActive) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid refresh token'
                });
            }

            // Generate new access token
            const accessToken = generateAccessToken({ userId: user.userId });

            res.json({
                message: 'Token refreshed successfully',
                accessToken
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired refresh token'
            });
        }
    }
);

module.exports = router;
