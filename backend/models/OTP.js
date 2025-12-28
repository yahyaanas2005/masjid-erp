const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OTP = sequelize.define('OTP', {
    otpId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'otp_id'
    },

    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },

    otpHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'otp_hash'
    },

    purpose: {
        type: DataTypes.ENUM('registration', 'login', 'phone_verification', 'password_reset'),
        allowNull: false,
        defaultValue: 'login'
    },

    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_used'
    },

    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at'
    }
}, {
    tableName: 'otps',
    indexes: [
        { fields: ['phone'] },
        { fields: ['expires_at'] },
        { fields: ['is_used'] }
    ]
});

module.exports = OTP;
