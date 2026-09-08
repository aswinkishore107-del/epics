import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { z } from 'zod';

const router = Router();

// GET /api/notes/patient/:patientId
router.get('/patient/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const notes = await prisma.doctorNote.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: notes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/notes
const noteSchema = z.object({
  patientId: z.string(),
  diagnosis: z.string().min(1),
  treatmentPlan: z.string().min(1),
  clinicalNotes: z.string().min(1),
  isConfidential: z.boolean().default(false),
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = noteSchema.parse(req.body);

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctorProfile) {
      res.status(403).json({ success: false, message: 'Only authorized doctors can create clinical notes', code: 'FORBIDDEN' });
      return;
    }

    const note = await prisma.doctorNote.create({
      data: {
        patientId: body.patientId,
        doctorId: doctorProfile.id,
        diagnosis: body.diagnosis,
        treatmentPlan: body.treatmentPlan,
        clinicalNotes: body.clinicalNotes,
        isConfidential: body.isConfidential,
      },
    });

    res.status(201).json({ success: true, data: note });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

export default router;
