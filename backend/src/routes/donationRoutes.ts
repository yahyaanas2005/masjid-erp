import { Router } from 'express';
import { getDonations, createDonation } from '../controllers/donationsController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getDonations);
router.post('/', protect, createDonation);

export default router;
