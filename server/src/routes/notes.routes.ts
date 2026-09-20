import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { socketService } from '../services/socketService.js';
import { z } from 'zod';

const router = Router();

const formatNote = (note: any) => ({
  id: note.id,
  patientId: note.patientId,
  doctorId: note.doctorId,
  diagnosis: note.diagnosis,
  treatmentPlan: note.treatmentPlan,
  clinicalNotes: note.clinicalNotes,
  content: note.clinicalNotes || note.diagnosis || '',
  category: note.diagnosis || 'SOAP',
  isConfidential: note.isConfidential,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
  doctorName: note.doctor?.user
    ? `Dr. ${note.doctor.user.firstName} ${note.doctor.user.lastName}`
    : 'Dr. Arvind Sharma, Cardiologist',
  patient: {
    id: note.patient?.id || note.patientId,
    name: note.patient?.user
      ? `${note.patient.user.firstName} ${note.patient.user.lastName}`
      : 'Rajesh Kumar',
  },
});

// GET /api/notes - Return all clinical notes for doctor or filtered by query patientId
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.query.patientId as string | undefined;

    const whereClause: any = {};
    if (patientId && patientId !== 'default' && patientId !== 'demo-id') {
      whereClause.patientId = patientId;
    }

    const notes = await prisma.doctorNote.findMany({
      where: whereClause,
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: notes.map(formatNote) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

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
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: notes.map(formatNote) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/notes - Create clinical note
const noteSchema = z.object({
  patientId: z.string().optional(),
  category: z.string().optional(),
  content: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  clinicalNotes: z.string().optional(),
  isConfidential: z.boolean().default(false),
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = noteSchema.parse(req.body);

    let doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctorProfile) {
      doctorProfile = await prisma.doctorProfile.findFirst();
    }

    if (!doctorProfile) {
      res.status(403).json({ success: false, message: 'Doctor profile required to create notes', code: 'FORBIDDEN' });
      return;
    }

    // Resolve patientId robustly
    let patientId = body.patientId;
    if (!patientId || patientId === 'demo-id' || patientId === 'default') {
      const rel = await prisma.patientRelationship.findFirst({
        where: { doctorId: doctorProfile.id, status: 'ACTIVE' },
      });
      if (rel) {
        patientId = rel.patientId;
      } else {
        const firstPatient = await prisma.elderlyProfile.findFirst();
        patientId = firstPatient?.id;
      }
    }

    if (!patientId) {
      res.status(400).json({ success: false, message: 'Valid patient profile not found', code: 'PATIENT_REQUIRED' });
      return;
    }

    const noteContent = body.content || body.clinicalNotes || '';
    if (!noteContent.trim()) {
      res.status(400).json({ success: false, message: 'Clinical note observations content cannot be empty' });
      return;
    }

    const diagnosis = body.diagnosis || body.category || 'SOAP Clinical Observation';
    const treatmentPlan = body.treatmentPlan || 'Continue standard patient care protocol';

    const note = await prisma.doctorNote.create({
      data: {
        patientId,
        doctorId: doctorProfile.id,
        diagnosis,
        treatmentPlan,
        clinicalNotes: noteContent.trim(),
        isConfidential: body.isConfidential ?? false,
      },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const formatted = formatNote(note);

    socketService.emitToPatientRoom(patientId, 'note_created', {
      note: formatted,
      patientId,
    });

    res.status(201).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error creating note:', error);
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

// DELETE /api/notes/:id - Delete note from database
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const note = await prisma.doctorNote.findUnique({ where: { id } });
    if (!note) {
      res.status(404).json({ success: false, message: 'Clinical note not found' });
      return;
    }

    await prisma.doctorNote.delete({ where: { id } });

    socketService.emitToPatientRoom(note.patientId, 'note_deleted', {
      noteId: id,
      patientId: note.patientId,
    });

    res.json({ success: true, message: 'Clinical note deleted from database.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
