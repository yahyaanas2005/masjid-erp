import express from 'express';
import cors from 'cors';
import setupMiddleware from './middleware/setup';
import authRoutes from './routes/authRoutes';
import donationRoutes from './routes/donationRoutes';
import settingsRoutes from './routes/settingsRoutes';
import prayerRoutes from './routes/prayerRoutes';
import noticeRoutes from './routes/noticeRoutes';
import janazahRoutes from './routes/janazahRoutes';

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json());

// Custom Middleware (Logging, Tenant Resolution)
setupMiddleware(app);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/prayers', prayerRoutes);
app.use('/api/v1/notices', noticeRoutes);
app.use('/api/v1/janazah', janazahRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Masjid ERP Backend', timestamp: new Date() });
});

export default app;
