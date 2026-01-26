import express from 'express';
import cors from 'cors';
import setupMiddleware from './middleware/setup';
import routes from './routes';

const app = express();

// Basic Middleware
app.use(cors());
app.use(express.json());

// Custom Middleware (Logging, Tenant Resolution)
setupMiddleware(app);

// Routes
app.use('/api/v1', routes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Masjid ERP Backend', timestamp: new Date() });
});

export default app;
