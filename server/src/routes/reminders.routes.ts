import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { socketService } from '../services/socketService.js';
import { ReminderCategory, ReminderStatus } from '../types/enums.js';
import { z } from 'zod';

const router = Router();

// GET /api/reminders/patient/:patientId
router.get('/patient/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const reminders = await prisma.reminder.findMany({
      where: { patientId },
      orderBy: { scheduledTime: 'asc' },
    });

    res.json({ success: true, data: reminders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/reminders
const reminderSchema = z.object({
  patientId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.nativeEnum(ReminderCategory).default(ReminderCategory.GENERAL),
  scheduledTime: z.string(),
});

router.post('/', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = reminderSchema.parse(req.body);

    const reminder = await prisma.reminder.create({
      data: {
        patientId: body.patientId,
        title: body.title,
        description: body.description,
        category: body.category,
        scheduledTime: new Date(body.scheduledTime as string),
        status: ReminderStatus.PENDING,
      },
    });

    socketService.emitToPatientRoom(body.patientId as string, 'reminder_created', {
      reminder,
      patientId: body.patientId,
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PATCH /api/reminders/:id
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, snoozedUntil } = req.body;

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: status as ReminderStatus,
        snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.reminder.delete({ where: { id } });
    res.json({ success: true, message: 'Reminder deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
