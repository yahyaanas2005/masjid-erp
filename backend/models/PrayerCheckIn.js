const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrayerCheckIn = sequelize.define('PrayerCheckIn', {
    checkInId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'check_in_id'
    },

    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
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

    prayerName: {
        type: DataTypes.ENUM('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah'),
        allowNull: false,
        field: 'prayer_name'
    },

    checkInTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'check_in_time'
    },

    // Location verification
    userLocation: {
        type: DataTypes.JSONB,
        allowNull: false,
        field: 'user_location',
        comment: 'User latitude and longitude at check-in'
    },

    distanceFromMasjid: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'distance_from_masjid',
        comment: 'Distance in meters from masjid'
    },

    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_verified',
        comment: 'Whether check-in was within geo-fence'
    },

    checkInMethod: {
        type: DataTypes.ENUM('auto', 'manual'),
        defaultValue: 'manual',
        field: 'check_in_method'
    }
}, {
    tableName: 'prayer_check_ins',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['masjid_id'] },
        { fields: ['prayer_name'] },
        { fields: ['check_in_time'] },
        { fields: ['user_id', 'check_in_time'] }
    ]
});

module.exports = PrayerCheckIn;
