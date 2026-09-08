import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { deviceSimulator } from '../services/deviceSimulator.js';
import { socketService } from '../services/socketService.js';
import { notificationService } from '../services/notificationService.js';
import { EmergencyStatus, FallStatus } from '../types/enums.js';
import { z } from 'zod';

const router = Router();

// POST /api/emergency/sos (Path 1: Manual SOS)
router.post('/sos', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId, location } = req.body;
    if (!patientId) {
      res.status(400).json({ success: false, message: 'patientId is required', code: 'PATIENT_ID_REQUIRED' });
      return;
    }

    const emergency = await deviceSimulator.triggerSOS(patientId, location || 'Home Living Room');

    res.status(201).json({ success: true, data: emergency });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/emergency/fall/detect (Path 2: Inertial fall detected by neckband MPU6050)
router.post('/fall/detect', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      res.status(400).json({ success: false, message: 'patientId is required', code: 'PATIENT_ID_REQUIRED' });
      return;
    }

    const fall = await deviceSimulator.triggerFall(patientId);

    res.status(201).json({ success: true, data: fall });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/emergency/fall/cancel (Elderly cancels countdown: "I am okay, false alarm")
router.post('/fall/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fallId, patientId } = req.body;

    const fall = await prisma.fallEvent.update({
      where: { id: fallId },
      data: {
        status: FallStatus.CANCELLED_FALSE_ALARM,
        verified: false,
      },
    });

    socketService.emitToPatientRoom(patientId, 'fall_cancelled', {
      fallId,
      patientId,
      message: 'Fall alert cancelled by elderly user (False alarm).',
    });

    res.json({ success: true, data: fall, message: 'Fall alert cancelled successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/emergency/active/:patientId
router.get('/active/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const activeEmergency = await prisma.emergencyEvent.findFirst({
      where: {
        patientId,
        status: { in: [EmergencyStatus.ACTIVE, EmergencyStatus.ACKNOWLEDGED] },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true } },
            emergencyContacts: { orderBy: { priority: 'asc' } },
          },
        },
      },
    });

    res.json({ success: true, data: activeEmergency });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/emergency/acknowledge/:id
router.post('/acknowledge/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const emergency = await prisma.emergencyEvent.update({
      where: { id },
      data: {
        status: EmergencyStatus.ACKNOWLEDGED,
      },
    });

    socketService.emitToPatientRoom(emergency.patientId, 'emergency_acknowledged', {
      emergency,
      acknowledgedBy: req.user!.firstName,
    });

    res.json({ success: true, data: emergency });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/emergency/resolve/:id
router.post('/resolve/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const emergency = await prisma.emergencyEvent.update({
      where: { id },
      data: {
        status: EmergencyStatus.RESOLVED,
        resolvedByUserId: req.user!.id,
        resolvedAt: new Date(),
        notes: notes || `Resolved by ${req.user!.firstName} (${req.user!.role})`,
      },
    });

    socketService.emitToPatientRoom(emergency.patientId, 'emergency_resolved', {
      emergency,
      resolvedBy: req.user!.firstName,
    });

    res.json({ success: true, data: emergency });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/emergency/history/:patientId
router.get('/history/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const history = await prisma.emergencyEvent.findMany({
      where: { patientId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
