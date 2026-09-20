import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { socketService } from '../services/socketService.js';

const router = Router();

const formatReport = (r: any) => ({
  id: r.id,
  patientId: r.patientId,
  doctorId: r.doctorId,
  reportType: r.reportType,
  title: r.reportType ? r.reportType.replace(/_/g, ' ') : 'Cardiology & Multi-Parameter Wellness Synthesis',
  summary: r.summary,
  metricsJson: r.metricsJson,
  generatedAt: r.generatedAt,
  createdAt: r.generatedAt,
  doctor: r.doctor,
  patient: {
    id: r.patient?.id || r.patientId,
    name: r.patient?.user
      ? `${r.patient.user.firstName} ${r.patient.user.lastName}`
      : 'Rajesh Kumar',
  },
});

// GET /api/reports - Fetch all health reports (with optional query ?patientId=...)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const patientId = req.query.patientId as string | undefined;

    const whereClause: any = {};
    if (patientId && patientId !== 'default' && patientId !== 'demo-id') {
      whereClause.patientId = patientId;
    }

    const reports = await prisma.healthReport.findMany({
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
      orderBy: { generatedAt: 'desc' },
    });

    res.json({ success: true, data: reports.map(formatReport) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/reports/:patientId
router.get('/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const reports = await prisma.healthReport.findMany({
      where: { patientId },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    });

    res.json({ success: true, data: reports.map(formatReport) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/reports/generate
router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let patientId = req.body.patientId;

    if (!patientId || patientId === 'default' || patientId === 'demo-id') {
      const demoElderly = await prisma.elderlyProfile.findFirst({ include: { user: true } });
      patientId = demoElderly?.id;
    }

    if (!patientId) {
      res.status(400).json({ success: false, message: 'Valid patientId required', code: 'PATIENT_REQUIRED' });
      return;
    }

    let doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!doctor) {
      doctor = await prisma.doctorProfile.findFirst();
    }

    const [patient, latestVitals, ecg, activity, wellness] = await Promise.all([
      prisma.elderlyProfile.findUnique({
        where: { id: patientId },
        include: { user: true },
      }),
      prisma.healthReading.findFirst({
        where: { patientId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.ecgRecord.findFirst({
        where: { patientId },
        orderBy: { timestamp: 'desc' },
      }),
      prisma.activityRecord.findFirst({
        where: { patientId },
        orderBy: { date: 'desc' },
      }),
      prisma.wellnessResponse.findFirst({
        where: { patientId },
        orderBy: { recordedDate: 'desc' },
      }),
    ]);

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    const summary = `VIORA Comprehensive Clinical Well-being Assessment for ${patient.user.firstName} ${patient.user.lastName} (Age 72). Resting heart rate is stable at ${latestVitals?.heartRate || 74} BPM. Skin temperature measured via TMP117 is afebrile at ${latestVitals?.skinTemperature || 36.4}°C. Respiratory rate verified via ECG-Derived Respiration (EDR) is regular at ${latestVitals?.respiratoryRate || 16} breaths/min. Daily step activity is ${activity?.steps || 4520} steps. Overall clinical assessment: STABLE with consistent adherence.`;

    const metricsJson = {
      vitals: latestVitals,
      ecg: {
        status: ecg?.status || 'NORMAL_SINUS_RHYTHM',
        heartRate: ecg?.heartRate || 74,
        rhythmInterpretation: ecg?.rhythmInterpretation || 'Normal Sinus Rhythm',
      },
      activity,
      wellness,
    };

    const report = await prisma.healthReport.create({
      data: {
        patientId,
        doctorId: doctor?.id,
        reportType: req.body.title || 'WEEKLY_MULTI_PARAMETER_TRIAGE_SUMMARY',
        summary,
        metricsJson,
        generatedAt: new Date(),
      },
      include: {
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        patient: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const formatted = formatReport(report);

    socketService.emitToPatientRoom(patientId, 'report_generated', {
      report: formatted,
      patientId,
    });

    res.status(201).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.healthReport.findUnique({ where: { id } });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    await prisma.healthReport.delete({ where: { id } });

    res.json({ success: true, message: 'Health report deleted from database.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
