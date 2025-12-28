const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MosqueNeed = sequelize.define('MosqueNeed', {
    needId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'need_id'
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

    title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    category: {
        type: DataTypes.ENUM('infrastructure', 'utilities', 'supplies', 'technology', 'maintenance', 'other'),
        allowNull: false
    },

    status: {
        type: DataTypes.ENUM('open', 'in_progress', 'fulfilled', 'cancelled'),
        defaultValue: 'open'
    },

    totalCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'total_cost',
        validate: {
            min: 0
        }
    },

    amountRaised: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        field: 'amount_raised'
    },

    currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD'
    },

    contributors: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of {userId, amount, contributedAt, message}'
    },

    requiresDelivery: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'requires_delivery'
    },

    deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'delivery_address'
    },

    fulfilledBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'fulfilled_by',
        references: {
            model: 'users',
            key: 'user_id'
        }
    },

    fulfilledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'fulfilled_at'
    },

    proofOfPurchase: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'proof_of_purchase',
        comment: 'URL to receipt or photo'
    },

    deadline: {
        type: DataTypes.DATE,
        allowNull: true
    },

    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },

    images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    }
}, {
    tableName: 'mosque_needs',
    indexes: [
        { fields: ['masjid_id'] },
        { fields: ['status'] },
        { fields: ['category'] },
        { fields: ['priority'] }
    ]
});

module.exports = MosqueNeed;
