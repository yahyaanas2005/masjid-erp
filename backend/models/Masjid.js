const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Masjid = sequelize.define('Masjid', {
    masjidId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'masjid_id'
    },

    // Basic Information
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },

    arabicName: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'arabic_name'
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Location
    location: {
        type: DataTypes.JSONB,
        allowNull: false,
        validate: {
            notEmpty: true
        },
        comment: 'Contains latitude, longitude, address, googlePlaceId, neighborhood, city, country'
    },

    // Geo-fence for verification
    verificationRadius: {
        type: DataTypes.INTEGER,
        defaultValue: 500,
        field: 'verification_radius',
        comment: 'Radius in meters for prayer check-in verification'
    },

    // Prayer Times
    prayerTimes: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'prayer_times',
        comment: 'Contains fajr, dhuhr, asr, maghrib, isha, jumuah times'
    },

    // Timezone
    timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'Asia/Karachi'
    },

    // Contact Information
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },

    website: {
        type: DataTypes.STRING(200),
        allowNull: true
    },

    // Administration
    imamId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'imam_id',
        references: {
            model: 'users',
            key: 'user_id'
        }
    },

    committeeMembers: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
        field: 'committee_members'
    },

    volunteers: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
        field: 'volunteers'
    },

    // Facilities
    facilities: {
        type: DataTypes.JSONB,
        defaultValue: {
            wuduArea: true,
            parkingAvailable: false,
            wheelchairAccessible: false,
            womensPrayerArea: true,
            library: false,
            islamicSchool: false
        }
    },

    // Capacity
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum number of people the masjid can accommodate'
    },

    // Statistics
    registeredCommunity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'registered_community'
    },

    averageAttendance: {
        type: DataTypes.JSONB,
        defaultValue: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            jumuah: 0
        },
        field: 'average_attendance'
    },

    // Financial
    totalDonations: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'total_donations'
    },

    totalExpenses: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'total_expenses'
    },

    currentBalance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        field: 'current_balance'
    },

    // Media
    photos: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },

    coverPhoto: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'cover_photo'
    },

    // Status
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },

    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified',
        comment: 'Verified by system admin as legitimate masjid'
    }
}, {
    tableName: 'masajid',
    indexes: [
        { fields: ['name'] },
        { fields: ['is_active'] },
        { fields: ['is_verified'] },
        {
            name: 'location_index',
            fields: ['location'],
            using: 'gin'
        }
    ]
});

module.exports = Masjid;
