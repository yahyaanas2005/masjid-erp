const { sequelize } = require('../config/database');
const models = require('../models');
require('dotenv').config();

// Initialize database connection script
const initializeDatabase = async () => {
    console.log('🔄 Initializing Masjid ERP Database...\n');

    try {
        // Test connection
        console.log('📡 Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Sync all models (create tables)
        console.log('🔨 Creating database tables...');
        // We use syncing to create tables if they don't exist
        await sequelize.sync({ force: false });
        console.log('✅ All tables created successfully\n');

        // Create default admin user
        console.log('👤 Creating default admin user...');
        const User = models.User;

        const [adminUser, created] = await User.findOrCreate({
            where: { email: 'admin@masjid-erp.com' },
            defaults: {
                name: 'System Administrator',
                phone: '+1234567890',
                email: 'admin@masjid-erp.com',
                password: 'Admin@123', // Will be hashed by the model
                verificationTier: 4,
                isActive: true,
                emailVerified: true,
                phoneVerified: true
            }
        });

        if (created) {
            console.log('✅ Admin user created successfully');
            console.log('   Email: admin@masjid-erp.com');
            console.log('   Password: Admin@123');
            console.log('   ⚠️  IMPORTANT: Change this password after first login!\n');
        } else {
            console.log('ℹ️  Admin user already exists\n');
        }

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Database Initialization Complete!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n📊 Database Tables Created:');
        console.log('   • Users');
        console.log('   • Masajid');
        console.log('   • PrayerCheckIns');
        console.log('   • Donations');
        console.log('   • MosqueNeeds');
        console.log('   • JanazahNotifications');
        console.log('\n🎉 Your Masjid ERP database is ready to use!\n');

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        console.error('\nPlease check:');
        console.error('1. Your DATABASE_URL or database credentials are correct');
        console.error('2. The database server is running and accessible');
        console.error('3. You have the necessary permissions\n');
        process.exit(1);
    }
};

// Run initialization
initializeDatabase();
