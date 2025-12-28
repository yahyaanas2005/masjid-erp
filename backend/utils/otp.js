const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate OTP hash for storage
 * @param {string} otp - OTP to hash
 * @returns {string} Hashed OTP
 */
const hashOTP = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Verify OTP against hash
 * @param {string} otp - OTP to verify
 * @param {string} hash - Stored hash
 * @returns {boolean} True if OTP matches
 */
const verifyOTP = (otp, hash) => {
    const otpHash = hashOTP(otp);
    return otpHash === hash;
};

/**
 * Check if OTP is expired
 * @param {Date} createdAt - OTP creation time
 * @param {number} expiryMinutes - Expiry time in minutes (default: 10)
 * @returns {boolean} True if expired
 */
const isOTPExpired = (createdAt, expiryMinutes = 10) => {
    const now = new Date();
    const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60000);
    return now > expiryTime;
};

module.exports = {
    generateOTP,
    hashOTP,
    verifyOTP,
    isOTPExpired
};
