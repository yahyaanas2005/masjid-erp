const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');
const models = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Masjid ERP API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes (to be implemented)
app.get('/api/v1', (req, res) => {
    res.json({
        message: 'Masjid Management ERP API v1',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            masajid: '/api/v1/masajid',
            prayers: '/api/v1/prayers',
            donations: '/api/v1/donations',
            needs: '/api/v1/needs',
            janazah: '/api/v1/janazah'
        }
    });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const masjidRoutes = require('./routes/masajid');
const prayerRoutes = require('./routes/prayers');
const donationRoutes = require('./routes/donations');
const needsRoutes = require('./routes/needs');
const janazahRoutes = require('./routes/janazah');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/masajid', masjidRoutes);
app.use('/api/v1/prayers', prayerRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/needs', needsRoutes);
app.use('/api/v1/janazah', janazahRoutes);


// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();

        // Sync database models
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Syncing database models...');
            await sequelize.sync({ alter: true });
            console.log('✅ Database models synced');
        } else if (process.env.NODE_ENV === 'production') {
            // In production, sync without altering (safe mode)
            console.log('🔄 Syncing database models (production)...');
            await sequelize.sync();
            console.log('✅ Database models synced');
        }

        // Start server (only if not in serverless environment)
        if (process.env.VERCEL !== '1') {
            app.listen(PORT, () => {
                console.log(`\n🕌 Masjid ERP Server is running`);
                console.log(`📍 Port: ${PORT}`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
                console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
                console.log(`💚 Health: http://localhost:${PORT}/health\n`);
            });
        } else {
            console.log('🚀 Running in Vercel serverless mode');
        }
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await sequelize.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, closing server...');
    await sequelize.close();
    process.exit(0);
});

startServer();

module.exports = app;
