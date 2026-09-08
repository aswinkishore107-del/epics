"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const enums_js_1 = require("../types/enums.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/patients - Return authorized patients list based on role
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        if (user.role === enums_js_1.UserRole.ELDERLY) {
            const profile = await prisma_js_1.prisma.elderlyProfile.findUnique({
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
        if (user.role === enums_js_1.UserRole.CAREGIVER) {
            const caregiver = await prisma_js_1.prisma.caregiverProfile.findUnique({
                where: { userId: user.id },
            });
            if (!caregiver) {
                res.json({ success: true, data: [] });
                return;
            }
            const relationships = await prisma_js_1.prisma.patientRelationship.findMany({
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
            const patients = relationships.map((r) => r.patient);
            res.json({ success: true, data: patients });
            return;
        }
        if (user.role === enums_js_1.UserRole.DOCTOR) {
            const doctor = await prisma_js_1.prisma.doctorProfile.findUnique({
                where: { userId: user.id },
            });
            if (!doctor) {
                res.json({ success: true, data: [] });
                return;
            }
            const relationships = await prisma_js_1.prisma.patientRelationship.findMany({
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
            const patients = relationships.map((r) => r.patient);
            res.json({ success: true, data: patients });
            return;
        }
        // Admin has access to all patients
        const allPatients = await prisma_js_1.prisma.elderlyProfile.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
                devices: true,
                healthReadings: { take: 1, orderBy: { timestamp: 'desc' } },
            },
        });
        res.json({ success: true, data: allPatients });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/patients/:patientId - Full patient details (guarded by relationship check)
router.get('/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await prisma_js_1.prisma.elderlyProfile.findUnique({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// Emergency Contacts
const contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    relationship: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(5),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    priority: zod_1.z.number().int().min(1).max(5).default(1),
    isPrimary: zod_1.z.boolean().default(false),
});
// GET /api/patients/:patientId/emergency-contacts
router.get('/:patientId/emergency-contacts', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const contacts = await prisma_js_1.prisma.emergencyContact.findMany({
            where: { patientId: req.params.patientId, isActive: true },
            orderBy: { priority: 'asc' },
        });
        res.json({ success: true, data: contacts });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/patients/:patientId/emergency-contacts
router.post('/:patientId/emergency-contacts', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const body = contactSchema.parse(req.body);
        const contact = await prisma_js_1.prisma.emergencyContact.create({
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
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
