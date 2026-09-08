import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { z } from 'zod';

const router = Router();

// GET /api/wellness/latest/:patientId
router.get('/latest/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const latest = await prisma.wellnessResponse.findFirst({
      where: { patientId },
      orderBy: { recordedDate: 'desc' },
    });

    res.json({ success: true, data: latest });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/wellness/history/:patientId
router.get('/history/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const records = await prisma.wellnessResponse.findMany({
      where: { patientId },
      orderBy: { recordedDate: 'desc' },
      take: 14,
    });

    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/wellness/submit
const wellnessSchema = z.object({
  patientId: z.string(),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.string().default('GOOD'),
  dietRating: z.string().default('BALANCED'),
  stressLevel: z.string().default('LOW'),
  alcoholIntake: z.string().default('NONE'),
  tobaccoUse: z.string().default('NONE'),
  weightKg: z.number().min(20).max(250),
  heightCm: z.number().min(50).max(250),
  notes: z.string().optional(),
});

router.post('/submit', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = wellnessSchema.parse(req.body);

    // Calculate BMI: weight (kg) / [height (m)]^2
    const heightInMeters = body.heightCm / 100;
    const bmi = parseFloat((body.weightKg / (heightInMeters * heightInMeters)).toFixed(1));

    const record = await prisma.wellnessResponse.create({
      data: {
        patientId: body.patientId,
        sleepHours: body.sleepHours,
        sleepQuality: body.sleepQuality,
        dietRating: body.dietRating,
        stressLevel: body.stressLevel,
        alcoholIntake: body.alcoholIntake,
        tobaccoUse: body.tobaccoUse,
        weightKg: body.weightKg,
        heightCm: body.heightCm,
        bmi,
        notes: body.notes,
        recordedDate: new Date(),
      },
    });

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

export default router;
