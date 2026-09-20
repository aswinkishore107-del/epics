import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { prisma } from '../prisma.js';
import { UserRole } from '@prisma/client';

export const verifyPatientAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  let patientId = req.params.patientId || req.body?.patientId || req.query?.patientId as string;

  // Auto-resolve patientId for ELDERLY users if not explicitly passed
  if (!patientId && req.user.role === UserRole.ELDERLY) {
    try {
      const profile = await prisma.elderlyProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (profile) {
        patientId = profile.id;
        if (req.body) req.body.patientId = patientId;
      }
    } catch {
      // Fall through to validation check
    }
  }

  if (!patientId) {
    res.status(400).json({ success: false, message: 'Patient ID is required', code: 'PATIENT_ID_REQUIRED' });
    return;
  }

  // Admins have universal authorized access
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  try {
    // 1. If ELDERLY: verify profile belongs to this user
    if (req.user.role === UserRole.ELDERLY) {
      const elderlyProfile = await prisma.elderlyProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!elderlyProfile || elderlyProfile.id !== patientId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own health data.',
          code: 'FORBIDDEN_PATIENT_ACCESS',
        });
        return;
      }
      return next();
    }

    // 2. If CAREGIVER: verify active PatientRelationship
    if (req.user.role === UserRole.CAREGIVER) {
      const caregiverProfile = await prisma.caregiverProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!caregiverProfile) {
        res.status(403).json({
          success: false,
          message: 'Caregiver profile not found.',
          code: 'CAREGIVER_PROFILE_MISSING',
        });
        return;
      }

      const relationship = await prisma.patientRelationship.findFirst({
        where: {
          patientId,
          caregiverId: caregiverProfile.id,
          status: 'ACTIVE',
        },
      });

      if (!relationship) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You do not have an active authorized relationship with this elderly patient.',
          code: 'FORBIDDEN_UNAUTHORIZED_RELATIONSHIP',
        });
        return;
      }
      return next();
    }

    // 3. If DOCTOR: verify active PatientRelationship
    if (req.user.role === UserRole.DOCTOR) {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: req.user.id },
      });
      if (!doctorProfile) {
        res.status(403).json({
          success: false,
          message: 'Doctor profile not found.',
          code: 'DOCTOR_PROFILE_MISSING',
        });
        return;
      }

      const relationship = await prisma.patientRelationship.findFirst({
        where: {
          patientId,
          doctorId: doctorProfile.id,
          status: 'ACTIVE',
        },
      });

      if (!relationship) {
        res.status(403).json({
          success: false,
          message: 'Access denied: You do not have clinical authorization for this patient.',
          code: 'FORBIDDEN_UNAUTHORIZED_RELATIONSHIP',
        });
        return;
      }
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Access denied: Unsupported role authorization.',
      code: 'FORBIDDEN',
    });
  } catch (error) {
    console.error('Error verifying patient access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error verifying patient authorization boundary',
      code: 'INTERNAL_ERROR',
    });
  }
};
