const User = require('./User');
const Masjid = require('./Masjid');
const PrayerCheckIn = require('./PrayerCheckIn');
const Donation = require('./Donation');
const MosqueNeed = require('./MosqueNeed');
const JanazahNotification = require('./JanazahNotification');
const OTP = require('./OTP');


// User - Masjid Relationships
User.belongsTo(Masjid, {
    as: 'primaryMasjid',
    foreignKey: 'primary_masjid_id'
});

User.belongsTo(Masjid, {
    as: 'childhoodMasjid',
    foreignKey: 'childhood_masjid_id'
});

User.belongsTo(Masjid, {
    as: 'ancestralMasjid',
    foreignKey: 'ancestral_masjid_id'
});

Masjid.hasMany(User, {
    as: 'communityMembers',
    foreignKey: 'primary_masjid_id'
});

Masjid.belongsTo(User, {
    as: 'imam',
    foreignKey: 'imam_id'
});

// Prayer Check-ins
User.hasMany(PrayerCheckIn, {
    as: 'prayerCheckIns',
    foreignKey: 'user_id'
});

PrayerCheckIn.belongsTo(User, {
    as: 'user',
    foreignKey: 'user_id'
});

Masjid.hasMany(PrayerCheckIn, {
    as: 'checkIns',
    foreignKey: 'masjid_id'
});

PrayerCheckIn.belongsTo(Masjid, {
    as: 'masjid',
    foreignKey: 'masjid_id'
});

// Donations
User.hasMany(Donation, {
    as: 'donations',
    foreignKey: 'donor_id'
});

Donation.belongsTo(User, {
    as: 'donor',
    foreignKey: 'donor_id'
});

Masjid.hasMany(Donation, {
    as: 'donations',
    foreignKey: 'masjid_id'
});

Donation.belongsTo(Masjid, {
    as: 'masjid',
    foreignKey: 'masjid_id'
});

// Mosque Needs
Masjid.hasMany(MosqueNeed, {
    as: 'needs',
    foreignKey: 'masjid_id'
});

MosqueNeed.belongsTo(Masjid, {
    as: 'masjid',
    foreignKey: 'masjid_id'
});

MosqueNeed.belongsTo(User, {
    as: 'fulfiller',
    foreignKey: 'fulfilled_by'
});

// Janazah Notifications
Masjid.hasMany(JanazahNotification, {
    as: 'janazahNotifications',
    foreignKey: 'masjid_id'
});

JanazahNotification.belongsTo(Masjid, {
    as: 'masjid',
    foreignKey: 'masjid_id'
});

module.exports = {
    User,
    Masjid,
    PrayerCheckIn,
    Donation,
    MosqueNeed,
    JanazahNotification,
    OTP
};

