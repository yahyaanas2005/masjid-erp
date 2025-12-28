const { Sequelize } = require('sequelize');
require('dotenv').config();

// Initialize database connection script
const initializeDatabase = async () => {
    console.log('🔄 Initializing Masjid ERP Database...\n');

    // Create Sequelize instance
    const sequelize = process.env.DATABASE_URL
        ? new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            },
            logging: console.log
        })
        : new Sequelize({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'masjid_erp',
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD,
            dialect: 'postgres',
            logging: console.log
        });

    try {
        // Test connection
        console.log('📡 Testing database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Import models
        console.log('📦 Loading database models...');
        const models = require('../models');
        console.log('✅ Models loaded\n');

        // Sync all models (create tables)
        console.log('🔨 Creating database tables...');
        await sequelize.sync({ force: false, alter: true });
        console.log('✅ All tables created successfully\n');

        // Create default admin user
        console.log('👤 Creating default admin user...');
        const User = models.User;

        const [adminUser, created] = await User.findOrCreate({
            where: { email: 'admin@masjid-erp.com' },
            defaults: {
                fullName: 'System Administrator',
                phone: '+1234567890',
                email: 'admin@masjid-erp.com',
                password: 'Admin@123', // Will be hashed by the model
                verificationTier: 4,
                role: 'admin',
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
        console.log('   • VerificationHistory');
        console.log('   • UserMasjidConnections');
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
