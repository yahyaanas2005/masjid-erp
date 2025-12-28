const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Donation = sequelize.define('Donation', {
    donationId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'donation_id'
    },

    donorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'donor_id',
        references: {
            model: 'users',
            key: 'user_id'
        }
    },

    masjidId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'masjid_id',
        references: {
            model: 'masajid',
            key: 'masjid_id'
        }
    },

    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },

    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD'
    },

    donationType: {
        type: DataTypes.ENUM('sadaqah', 'zakat', 'lillah', 'fidya', 'kaffarah', 'aqiqah', 'general'),
        allowNull: false,
        field: 'donation_type'
    },

    zakatType: {
        type: DataTypes.ENUM('zakat_ul_mal', 'zakat_ul_fitr'),
        allowNull: true,
        field: 'zakat_type'
    },

    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'digital_wallet'),
        allowNull: false,
        field: 'payment_method'
    },

    paymentStatus: {
        type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending',
        field: 'payment_status'
    },

    transactionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'transaction_id'
    },

    receiptNumber: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: true,
        field: 'receipt_number'
    },

    receiptIssued: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'receipt_issued'
    },

    receiptUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'receipt_url'
    },

    allocatedTo: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'allocated_to',
        comment: 'Category where donation is allocated (e.g., Utilities, Imam Salary)'
    },

    isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_recurring'
    },

    recurringFrequency: {
        type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
        allowNull: true,
        field: 'recurring_frequency'
    },

    isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_anonymous'
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    donatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'donated_at'
    },

    processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'processed_at'
    }
}, {
    tableName: 'donations',
    indexes: [
        { fields: ['donor_id'] },
        { fields: ['masjid_id'] },
        { fields: ['donation_type'] },
        { fields: ['payment_status'] },
        { fields: ['donated_at'] },
        { fields: ['receipt_number'] }
    ]
});

module.exports = Donation;
