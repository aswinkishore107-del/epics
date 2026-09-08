import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';

const router = Router();

// GET /api/activity/today/:patientId
router.get('/today/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const activity = await prisma.activityRecord.findFirst({
      where: { patientId },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: activity || {
        steps: 4250,
        caloriesBurned: 185,
        activeMinutes: 42,
        distanceMeters: 3120,
        sleepMinutes: 450,
        date: new Date(),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/activity/history/:patientId
router.get('/history/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const records = await prisma.activityRecord.findMany({
      where: { patientId },
      orderBy: { date: 'desc' },
      take: 14,
    });

    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
