import { Router } from 'express';
import * as janazahController from '../controllers/janazahController';

const router = Router();

router.get('/auth', (req, res) => res.json({ message: 'Auth route values' }));
router.get('/prayers', (req, res) => res.json({ message: 'Prayers route' }));

// Janazah Routes
router.post('/janazah', janazahController.createAlert);  // In real app, add auth middleware
router.get('/janazah', janazahController.getAlerts);

router.get('/donations', (req, res) => res.json({ message: 'Donations route' }));

export default router;
