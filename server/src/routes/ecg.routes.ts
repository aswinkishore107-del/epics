import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';

const router = Router();

// GET /api/ecg/latest/:patientId
router.get('/latest/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const record = await prisma.ecgRecord.findFirst({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
    });

    if (!record) {
      res.json({
        success: true,
        data: null,
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...record,
        attribution: {
          sensor: 'AD8232 Single-Lead ECG Front End',
          derivedMetric: 'ECG-Derived Respiration (EDR)',
          isSimulated: record.isSimulated,
          demoNotice: record.isSimulated ? 'DEMO SIMULATION: Synthetic ECG waveform generated for platform preview.' : 'Live Biosensor Stream',
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/ecg/history/:patientId
router.get('/history/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const history = await prisma.ecgRecord.findMany({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        patientId: true,
        durationSeconds: true,
        sampleRate: true,
        heartRate: true,
        signalQuality: true,
        status: true,
        isSimulated: true,
        rhythmInterpretation: true,
        timestamp: true,
      },
    });

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
