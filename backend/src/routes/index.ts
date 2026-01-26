import { Router } from 'express';
import * as janazahController from '../controllers/janazahController';

import * as prayerController from '../controllers/prayerController';
import * as noticeController from '../controllers/noticeController';

const router = Router();

router.get('/auth', (req, res) => res.json({ message: 'Auth route values' }));

// Prayer Times
router.post('/prayers', prayerController.updateTimes);
router.get('/prayers', prayerController.getTimes);

// Notices
router.post('/notices', noticeController.create);
router.get('/notices', noticeController.list);

// Janazah Routes
router.post('/janazah', janazahController.createAlert);  // In real app, add auth middleware
router.get('/janazah', janazahController.getAlerts);

router.get('/donations', (req, res) => res.json({ message: 'Donations route' }));

export default router;
