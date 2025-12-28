const { User, Masjid, PrayerCheckIn } = require('../models');
const GeolocationService = require('./GeolocationService');

class VerificationMatrixService {
    /**
     * Get user's current verification tier
     * @param {string} userId
     * @returns {Promise<number>} Verification tier (0-4)
     */
    async getUserVerificationTier(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');
        return user.verificationTier;
    }

    /**
     * TIER 1: Neighborhood Verification (Face-to-Face)
     * Local mosque committee or volunteers verify physical residency
     * @param {string} userId - User to verify
     * @param {string} verifierId - Committee member or volunteer doing verification
     * @param {Object} homeLocation - {latitude, longitude, address}
     * @returns {Promise<Object>} Updated user
     */
    async verifyTier1Neighborhood(userId, verifierId, homeLocation) {
        const user = await User.findByPk(userId);
        const verifier = await User.findByPk(verifierId);

        if (!user) throw new Error('User not found');
        if (!verifier) throw new Error('Verifier not found');

        // Verifier must be at least Tier 2 or be a committee member
        if (verifier.verificationTier < 2) {
            throw new Error('Verifier must be at least Tier 2');
        }

        // Optional: Verify neighborhood proximity
        if (verifier.homeLocation && homeLocation) {
            const proximity = GeolocationService.verifyNeighborhoodProximity(
                homeLocation,
                verifier.homeLocation
            );

            if (!proximity.isNeighbor) {
                console.warn(`Verifier is ${proximity.distance}m away from user (>2km)`);
            }
        }

        // Update user verification
        user.verificationTier = Math.max(user.verificationTier, 1);
        user.homeLocation = {
            latitude: homeLocation.latitude,
            longitude: homeLocation.longitude,
            address: homeLocation.address,
            verifiedAt: new Date()
        };

        user.verificationHistory = [
            ...user.verificationHistory,
            {
                tier: 1,
                verifiedBy: verifierId,
                verifiedAt: new Date(),
                verificationType: 'neighborhood_face_to_face'
            }
        ];

        await user.save();
        return user;
    }

    /**
     * TIER 2: Digital Identity & Geo-fencing
     * Requires minimum 5 verified prayer check-ins over 2 weeks
     * @param {string} userId
     * @returns {Promise<Object>} {eligible: boolean, checkInsCount: number, message: string}
     */
    async checkTier2Eligibility(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Must have Tier 1 first
        if (user.verificationTier < 1) {
            return {
                eligible: false,
                checkInsCount: 0,
                message: 'Must complete Tier 1 (Neighborhood Verification) first'
            };
        }

        // Check prayer check-ins in last 2 weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const checkIns = await PrayerCheckIn.count({
            where: {
                userId: userId,
                isVerified: true,
                checkInTime: {
                    [require('sequelize').Op.gte]: twoWeeksAgo
                }
            }
        });

        const requiredCheckIns = 5;
        const eligible = checkIns >= requiredCheckIns;

        return {
            eligible,
            checkInsCount: checkIns,
            requiredCheckIns,
            message: eligible
                ? 'Eligible for Tier 2 verification'
                : `Need ${requiredCheckIns - checkIns} more verified check-ins`
        };
    }

    /**
     * Upgrade user to Tier 2 if eligible
     * @param {string} userId
     * @returns {Promise<Object>} Updated user
     */
    async upgradeTier2(userId) {
        const eligibility = await this.checkTier2Eligibility(userId);

        if (!eligibility.eligible) {
            throw new Error(eligibility.message);
        }

        const user = await User.findByPk(userId);
        user.verificationTier = Math.max(user.verificationTier, 2);
        user.verificationHistory = [
            ...user.verificationHistory,
            {
                tier: 2,
                verifiedBy: 'system',
                verifiedAt: new Date(),
                verificationType: 'digital_geofencing',
                checkInsCount: eligibility.checkInsCount
            }
        ];

        await user.save();
        return user;
    }

    /**
     * TIER 3: Engagement History (Trust through Action)
     * Requires:
     * - Minimum 3 months of active participation
     * - At least 5 donations or mosque needs fulfilled
     * - Regular prayer attendance
     * @param {string} userId
     * @returns {Promise<Object>} {eligible: boolean, details: Object}
     */
    async checkTier3Eligibility(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Must have Tier 2 first
        if (user.verificationTier < 2) {
            return {
                eligible: false,
                message: 'Must complete Tier 2 (Digital & Geo-fencing) first'
            };
        }

        // Check account age (3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const accountAge = user.createdAt;
        const hasMinimumAge = accountAge <= threeMonthsAgo;

        // Check donations/contributions
        const { Donation, MosqueNeed } = require('../models');

        const donationCount = await Donation.count({
            where: { donorId: userId, paymentStatus: 'completed' }
        });

        // Count mosque needs contributions
        const mosqueNeeds = await MosqueNeed.findAll();
        let contributionCount = 0;
        mosqueNeeds.forEach(need => {
            const userContributions = need.contributors.filter(c => c.userId === userId);
            contributionCount += userContributions.length;
        });

        const totalContributions = donationCount + contributionCount;
        const hasMinimumContributions = totalContributions >= 5;

        // Check prayer attendance (at least 30 check-ins in 3 months)
        const checkInsCount = await PrayerCheckIn.count({
            where: {
                userId: userId,
                isVerified: true,
                checkInTime: {
                    [require('sequelize').Op.gte]: threeMonthsAgo
                }
            }
        });
        const hasRegularAttendance = checkInsCount >= 30;

        const eligible = hasMinimumAge && hasMinimumContributions && hasRegularAttendance;

        return {
            eligible,
            details: {
                accountAge: Math.floor((new Date() - accountAge) / (1000 * 60 * 60 * 24)),
                hasMinimumAge,
                totalContributions,
                hasMinimumContributions,
                checkInsCount,
                hasRegularAttendance
            },
            message: eligible
                ? 'Eligible for Tier 3 verification'
                : 'Not yet eligible for Tier 3'
        };
    }

    /**
     * Upgrade user to Tier 3 if eligible
     * @param {string} userId
     * @returns {Promise<Object>} Updated user
     */
    async upgradeTier3(userId) {
        const eligibility = await this.checkTier3Eligibility(userId);

        if (!eligibility.eligible) {
            throw new Error(eligibility.message);
        }

        const user = await User.findByPk(userId);
        user.verificationTier = Math.max(user.verificationTier, 3);
        user.verificationHistory = [
            ...user.verificationHistory,
            {
                tier: 3,
                verifiedBy: 'system',
                verifiedAt: new Date(),
                verificationType: 'engagement_history',
                details: eligibility.details
            }
        ];

        await user.save();
        return user;
    }

    /**
     * TIER 4: Official ID Verification
     * Required for committee members, financial administrators, volunteers handling funds
     * @param {string} userId
     * @param {string} verifierId - Admin who verified the ID
     * @param {Object} idDetails - {idType, idNumber (hashed), verifiedAt}
     * @returns {Promise<Object>} Updated user
     */
    async verifyTier4OfficialID(userId, verifierId, idDetails) {
        const user = await User.findByPk(userId);
        const verifier = await User.findByPk(verifierId);

        if (!user) throw new Error('User not found');
        if (!verifier) throw new Error('Verifier not found');

        // Verifier must be Tier 4 or system admin
        if (verifier.verificationTier < 4) {
            throw new Error('Only Tier 4 users can verify official IDs');
        }

        user.verificationTier = 4;
        user.verificationHistory = [
            ...user.verificationHistory,
            {
                tier: 4,
                verifiedBy: verifierId,
                verifiedAt: new Date(),
                verificationType: 'official_id',
                idType: idDetails.idType
            }
        ];

        await user.save();
        return user;
    }

    /**
     * Auto-check and upgrade users who meet tier requirements
     * This can be run as a cron job
     * @param {string} userId
     * @returns {Promise<Object>} {upgraded: boolean, newTier: number}
     */
    async autoCheckAndUpgrade(userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new Error('User not found');

        const currentTier = user.verificationTier;
        let upgraded = false;

        // Check Tier 2 eligibility
        if (currentTier === 1) {
            const tier2Eligibility = await this.checkTier2Eligibility(userId);
            if (tier2Eligibility.eligible) {
                await this.upgradeTier2(userId);
                upgraded = true;
            }
        }

        // Check Tier 3 eligibility
        if (currentTier === 2 || (currentTier === 1 && upgraded)) {
            const tier3Eligibility = await this.checkTier3Eligibility(userId);
            if (tier3Eligibility.eligible) {
                await this.upgradeTier3(userId);
                upgraded = true;
            }
        }

        const updatedUser = await User.findByPk(userId);
        return {
            upgraded,
            previousTier: currentTier,
            newTier: updatedUser.verificationTier
        };
    }
}

module.exports = new VerificationMatrixService();
