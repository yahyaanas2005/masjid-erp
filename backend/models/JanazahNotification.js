const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JanazahNotification = sequelize.define('JanazahNotification', {
    janazahId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'janazah_id'
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

    // Deceased Information (with family consent)
    deceasedName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'deceased_name'
    },

    gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: false
    },

    ageGroup: {
        type: DataTypes.ENUM('child', 'youth', 'adult', 'elderly'),
        allowNull: true,
        field: 'age_group'
    },

    // Prayer Details
    janazahTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'janazah_time'
    },

    location: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: 'Contains masjidId, address, latitude, longitude'
    },

    // Burial Information
    burialLocation: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'burial_location'
    },

    burialTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'burial_time'
    },

    // Additional Information
    familyContact: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'family_contact'
    },

    additionalInfo: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'additional_info'
    },

    // Notification
    notifiedUsers: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: [],
        field: 'notified_users'
    },

    notificationSentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'notification_sent_at'
    },

    // RSVP
    attendees: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of {userId, rsvpAt}'
    },

    estimatedAttendance: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'estimated_attendance'
    },

    // Privacy
    familyConsent: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'family_consent'
    },

    publicVisibility: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'public_visibility'
    },

    // Status
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    }
}, {
    tableName: 'janazah_notifications',
    indexes: [
        { fields: ['masjid_id'] },
        { fields: ['janazah_time'] },
        { fields: ['status'] }
    ]
});

module.exports = JanazahNotification;
