import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { verifyPatientAccess } from '../middleware/patientAccess.js';
import { UserRole } from '../types/enums.js';
import { z } from 'zod';

const router = Router();

// GET /api/patients - Return authorized patients list based on role
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;

    if (user.role === UserRole.ELDERLY) {
      const profile = await prisma.elderlyProfile.findUnique({
        where: { userId: user.id },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
          devices: true,
          healthReadings: { take: 1, orderBy: { timestamp: 'desc' } },
        },
      });
      res.json({ success: true, data: profile ? [profile] : [] });
      return;
    }

    if (user.role === UserRole.CAREGIVER) {
      const caregiver = await prisma.caregiverProfile.findUnique({
        where: { userId: user.id },
      });
      if (!caregiver) {
        res.json({ success: true, data: [] });
        return;
      }

      const relationships = await prisma.patientRelationship.findMany({
        where: { caregiverId: caregiver.id, status: 'ACTIVE' },
        include: {
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
              devices: true,
              healthReadings: { take: 1, orderBy: { timestamp: 'desc' } },
              emergencyEvents: { where: { status: 'ACTIVE' } },
            },
          },
        },
      });

      const patients = relationships.map((r: any) => r.patient);
      res.json({ success: true, data: patients });
      return;
    }

    if (user.role === UserRole.DOCTOR) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!doctor) {
        res.json({ success: true, data: [] });
        return;
      }

      const relationships = await prisma.patientRelationship.findMany({
        where: { doctorId: doctor.id, status: 'ACTIVE' },
        include: {
          patient: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
              devices: true,
              healthReadings: { take: 1, orderBy: { timestamp: 'desc' } },
              emergencyEvents: { where: { status: 'ACTIVE' } },
            },
          },
        },
      });

      const patients = relationships.map((r: any) => r.patient);
      res.json({ success: true, data: patients });
      return;
    }

    // Admin has access to all patients
    const allPatients = await prisma.elderlyProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        devices: true,
        healthReadings: { take: 1, orderBy: { timestamp: 'desc' } },
      },
    });

    res.json({ success: true, data: allPatients });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/patients/:patientId - Full patient details (guarded by relationship check)
router.get('/:patientId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.elderlyProfile.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        devices: true,
        emergencyContacts: { orderBy: { priority: 'asc' } },
        relationships: {
          where: { status: 'ACTIVE' },
          include: {
            caregiver: { include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } } },
            doctor: { include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } } },
          },
        },
        healthReadings: { take: 1, orderBy: { timestamp: 'desc' } },
      },
    });

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found', code: 'PATIENT_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// Emergency Contacts
const contactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().optional().or(z.literal('')),
  priority: z.number().int().min(1).max(5).default(1),
  isPrimary: z.boolean().default(false),
});

// GET /api/patients/:patientId/emergency-contacts
router.get('/:patientId/emergency-contacts', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { patientId: req.params.patientId, isActive: true },
      orderBy: { priority: 'asc' },
    });
    res.json({ success: true, data: contacts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/patients/:patientId/emergency-contacts
router.post('/:patientId/emergency-contacts', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = contactSchema.parse(req.body);
    const contact = await prisma.emergencyContact.create({
      data: {
        patientId: req.params.patientId,
        name: body.name,
        relationship: body.relationship,
        phone: body.phone,
        email: body.email || null,
        priority: body.priority,
        isPrimary: body.isPrimary,
      },
    });
    res.status(201).json({ success: true, data: contact });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

// DELETE /api/patients/:patientId/emergency-contacts/:contactId
router.delete('/:patientId/emergency-contacts/:contactId', authenticateToken, verifyPatientAccess, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { contactId, patientId } = req.params;

    const contact = await prisma.emergencyContact.findFirst({
      where: { id: contactId, patientId },
    });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Emergency contact not found' });
      return;
    }

    await prisma.emergencyContact.delete({ where: { id: contactId } });

    res.json({ success: true, message: 'Emergency contact deleted from database.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
