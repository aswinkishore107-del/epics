import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { socketService } from '../services/socketService.js';
import { notificationService, NotificationType } from '../services/notificationService.js';
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
  patientId: z.string().optional(),
  title: z.string().min(1, 'Reminder title is required'),
  description: z.string().optional().nullable(),
  category: z.nativeEnum(ReminderCategory).default(ReminderCategory.GENERAL),
  scheduledTime: z.string(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.string().optional().nullable(),
});

router.post('/', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = reminderSchema.parse(req.body);
    const patientId = (body.patientId || req.body.patientId) as string;

    const scheduledDate = new Date(body.scheduledTime);
    if (isNaN(scheduledDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid scheduledTime format', code: 'INVALID_TIME' });
      return;
    }

    const reminder = await prisma.reminder.create({
      data: {
        patientId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        category: body.category,
        scheduledTime: scheduledDate,
        isRecurring: body.isRecurring ?? false,
        recurrencePattern: body.recurrencePattern || null,
        status: ReminderStatus.PENDING,
      },
    });

    // Real-time broadcast to patient room
    socketService.emitToPatientRoom(patientId, 'reminder_created', {
      reminder,
      patientId,
    });

    // Notify patient team
    try {
      await notificationService.notifyPatientTeam(patientId, {
        title: `Reminder: ${reminder.title}`,
        message: `Scheduled for ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        type: NotificationType.REMINDER,
        link: '/elderly/reminders',
      });
    } catch (nErr) {
      console.warn('Could not dispatch reminder notification:', nErr);
    }

    res.status(201).json({ success: true, data: reminder });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PATCH /api/reminders/:id
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, snoozedUntil, title, category, scheduledTime, description } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status as ReminderStatus;
    if (snoozedUntil !== undefined) updateData.snoozedUntil = snoozedUntil ? new Date(snoozedUntil) : null;
    if (title) updateData.title = title.trim();
    if (category) updateData.category = category as ReminderCategory;
    if (scheduledTime) {
      const parsed = new Date(scheduledTime);
      if (!isNaN(parsed.getTime())) updateData.scheduledTime = parsed;
    }
    if (description !== undefined) updateData.description = description ? description.trim() : null;

    const updated = await prisma.reminder.update({
      where: { id },
      data: updateData,
    });

    socketService.emitToPatientRoom(updated.patientId, 'reminder_updated', {
      reminder: updated,
      patientId: updated.patientId,
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
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) {
      res.status(404).json({ success: false, message: 'Reminder not found' });
      return;
    }

    await prisma.reminder.delete({ where: { id } });

    socketService.emitToPatientRoom(reminder.patientId, 'reminder_deleted', {
      reminderId: id,
      patientId: reminder.patientId,
    });

    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
