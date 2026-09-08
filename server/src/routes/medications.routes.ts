import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { socketService } from '../services/socketService.js';
import { notificationService } from '../services/notificationService.js';
import { MedicationStatus } from '../types/enums.js';
import { z } from 'zod';

const router = Router();

// GET /api/medications/patient/:patientId
router.get('/patient/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [medications, todayLogs] = await Promise.all([
      prisma.medication.findMany({
        where: { patientId, isActive: true },
        include: { schedules: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medicationLog.findMany({
        where: {
          patientId,
          scheduledFor: { gte: startOfDay },
        },
      }),
    ]);

    // Attach today's log status to each medication
    const enriched = medications.map((med: any) => {
      const log = todayLogs.find((l: any) => l.medicationId === med.id);
      return {
        ...med,
        todayStatus: log ? log.status : MedicationStatus.UPCOMING,
        takenAt: log ? log.takenAt : null,
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/medications/adherence/:patientId
router.get('/adherence/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const past30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const logs = await prisma.medicationLog.findMany({
      where: {
        patientId,
        scheduledFor: { gte: past30Days },
      },
    });

    const totalLogs = logs.length;
    const takenLogs = logs.filter((l: any) => l.status === MedicationStatus.TAKEN).length;
    const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 96;

    res.json({
      success: true,
      data: {
        totalLogged: totalLogs,
        takenCount: takenLogs,
        missedCount: logs.filter((l: any) => l.status === MedicationStatus.MISSED).length,
        adherenceRate,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/medications/log (Mark medication as TAKEN / MISSED / SKIPPED)
const logSchema = z.object({
  medicationId: z.string(),
  patientId: z.string(),
  status: z.nativeEnum(MedicationStatus),
  notes: z.string().optional(),
});

router.post('/log', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = logSchema.parse(req.body);

    const medication = await prisma.medication.findUnique({
      where: { id: body.medicationId },
    });

    if (!medication) {
      res.status(404).json({ success: false, message: 'Medication not found', code: 'MEDICATION_NOT_FOUND' });
      return;
    }

    const log = await prisma.medicationLog.create({
      data: {
        medicationId: body.medicationId,
        patientId: body.patientId,
        scheduledFor: new Date(),
        takenAt: body.status === MedicationStatus.TAKEN ? new Date() : null,
        status: body.status,
        loggedBy: req.user!.role,
        notes: body.notes || `Logged as ${body.status} by ${req.user!.firstName}`,
      },
    });

    // Notify Caregiver and Doctor in real time via Socket.IO
    socketService.emitToPatientRoom(body.patientId as string, 'medication_taken', {
      log,
      medicationName: medication.name,
      dosage: medication.dosage,
      status: body.status,
      patientId: body.patientId,
    });

    await notificationService.notifyPatientTeam(body.patientId as string, {
      title: `Medication ${body.status}: ${medication.name}`,
      message: `${medication.name} (${medication.dosage}) was recorded as ${body.status}.`,
      type: 'MEDICATION',
    });

    res.status(201).json({ success: true, data: log });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/medications (Add new medication)
const medCreateSchema = z.object({
  patientId: z.string(),
  name: z.string().min(1),
  dosage: z.string().min(1),
  form: z.string().default('TABLET'),
  frequency: z.string().default('ONCE_DAILY'),
  instructions: z.string().optional(),
  scheduledTimes: z.array(z.string()).default(['08:00']),
});

router.post('/', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = medCreateSchema.parse(req.body);

    const med = await prisma.medication.create({
      data: {
        patientId: body.patientId,
        name: body.name,
        dosage: body.dosage,
        form: body.form,
        frequency: body.frequency,
        instructions: body.instructions,
        schedules: {
          create: body.scheduledTimes.map((time) => ({
            scheduledTime: time,
            daysOfWeek: 'DAILY',
            dosage: body.dosage,
          })),
        },
      },
      include: { schedules: true },
    });

    res.status(201).json({ success: true, data: med });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

export default router;
