import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';

const router = Router();

// GET /api/respiration/latest/:patientId
router.get('/latest/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const reading = await prisma.respiratoryReading.findFirst({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      success: true,
      data: {
        rate: reading?.rate || 16,
        depth: reading?.depth || 'NORMAL',
        measurementSource: 'ECG_DERIVED_RESPIRATION',
        sensorDescription: 'ECG-Derived Respiration (EDR) extracted from AD8232 amplitude modulation algorithm',
        timestamp: reading?.timestamp || new Date(),
        isSimulated: reading?.isSimulated ?? true,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
