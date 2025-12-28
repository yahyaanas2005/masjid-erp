const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'user_id'
    },

    // Basic Information
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },

    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },

    phoneVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'phone_verified'
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },

    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified'
    },

    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },

    profilePhoto: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'profile_photo'
    },

    gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: true
    },

    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth'
    },

    // Verification Matrix
    verificationTier: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 4
        },
        field: 'verification_tier',
        comment: '0=Unverified, 1=Neighborhood, 2=Digital+Geo, 3=Engagement, 4=Official ID'
    },

    verificationHistory: {
        type: DataTypes.JSONB,
        defaultValue: [],
        field: 'verification_history',
        comment: 'Array of verification events with tier, verifiedBy, timestamp'
    },

    // Location Data (Encrypted in production)
    homeLocation: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'home_location',
        comment: 'Contains latitude, longitude, address, verifiedAt'
    },

    // Masjid Connections
    primaryMasjidId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'primary_masjid_id',
        references: {
            model: 'masajid',
            key: 'masjid_id'
        }
    },

    childhoodMasjidId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'childhood_masjid_id',
        references: {
            model: 'masajid',
            key: 'masjid_id'
        }
    },

    ancestralMasjidId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'ancestral_masjid_id',
        references: {
            model: 'masajid',
            key: 'masjid_id'
        }
    },

    visitedMasajid: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
        field: 'visited_masajid'
    },

    // Privacy Settings
    locationSharingEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'location_sharing_enabled'
    },

    visibilitySettings: {
        type: DataTypes.JSONB,
        defaultValue: {
            showOnCommunityMap: true,
            shareAttendanceStats: false
        },
        field: 'visibility_settings'
    },

    // Prayer Attendance Stats
    prayerStats: {
        type: DataTypes.JSONB,
        defaultValue: {
            totalCheckIns: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastCheckIn: null
        },
        field: 'prayer_stats'
    },

    // FCM Token for Push Notifications
    fcmToken: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'fcm_token'
    },

    // Account Status
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },

    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at'
    }
}, {
    tableName: 'users',
    indexes: [
        { fields: ['phone'] },
        { fields: ['email'] },
        { fields: ['primary_masjid_id'] },
        { fields: ['verification_tier'] }
    ]
});

// Hash password before saving
User.beforeSave(async (user) => {
    if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

// Instance method to check password
User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (hide sensitive data)
User.prototype.toPublicJSON = function () {
    const user = this.toJSON();
    delete user.password;
    delete user.fcmToken;
    if (!user.visibilitySettings.showOnCommunityMap) {
        delete user.homeLocation;
    }
    return user;
};

module.exports = User;
