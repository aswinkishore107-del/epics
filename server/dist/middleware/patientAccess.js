"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPatientAccess = void 0;
const prisma_js_1 = require("../prisma.js");
const client_1 = require("@prisma/client");
const verifyPatientAccess = async (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
    }
    const patientId = req.params.patientId || req.body.patientId || req.query.patientId;
    if (!patientId) {
        res.status(400).json({ success: false, message: 'Patient ID is required', code: 'PATIENT_ID_REQUIRED' });
        return;
    }
    // Admins have universal authorized access
    if (req.user.role === client_1.UserRole.ADMIN) {
        return next();
    }
    try {
        // 1. If ELDERLY: verify profile belongs to this user
        if (req.user.role === client_1.UserRole.ELDERLY) {
            const elderlyProfile = await prisma_js_1.prisma.elderlyProfile.findUnique({
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
        if (req.user.role === client_1.UserRole.CAREGIVER) {
            const caregiverProfile = await prisma_js_1.prisma.caregiverProfile.findUnique({
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
            const relationship = await prisma_js_1.prisma.patientRelationship.findFirst({
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
        if (req.user.role === client_1.UserRole.DOCTOR) {
            const doctorProfile = await prisma_js_1.prisma.doctorProfile.findUnique({
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
            const relationship = await prisma_js_1.prisma.patientRelationship.findFirst({
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
    }
    catch (error) {
        console.error('Error verifying patient access:', error);
        res.status(500).json({
            success: false,
            message: 'Internal error verifying patient authorization boundary',
            code: 'INTERNAL_ERROR',
        });
    }
};
exports.verifyPatientAccess = verifyPatientAccess;
