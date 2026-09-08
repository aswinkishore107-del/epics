import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { z } from 'zod';

const router = Router();

// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    res.json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/appointments
const apptSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  title: z.string().min(1),
  appointmentDate: z.string(),
  location: z.string().default('VIORA Telehealth Video'),
  notes: z.string().optional(),
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = apptSchema.parse(req.body);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        title: body.title,
        appointmentDate: new Date(body.appointmentDate),
        location: body.location,
        notes: body.notes,
      },
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

export default router;
