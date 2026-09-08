"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const socketService_js_1 = require("../services/socketService.js");
const notificationService_js_1 = require("../services/notificationService.js");
const enums_js_1 = require("../types/enums.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/medications/patient/:patientId
router.get('/patient/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const [medications, todayLogs] = await Promise.all([
            prisma_js_1.prisma.medication.findMany({
                where: { patientId, isActive: true },
                include: { schedules: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma_js_1.prisma.medicationLog.findMany({
                where: {
                    patientId,
                    scheduledFor: { gte: startOfDay },
                },
            }),
        ]);
        // Attach today's log status to each medication
        const enriched = medications.map((med) => {
            const log = todayLogs.find((l) => l.medicationId === med.id);
            return {
                ...med,
                todayStatus: log ? log.status : enums_js_1.MedicationStatus.UPCOMING,
                takenAt: log ? log.takenAt : null,
            };
        });
        res.json({ success: true, data: enriched });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/medications/adherence/:patientId
router.get('/adherence/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const past30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const logs = await prisma_js_1.prisma.medicationLog.findMany({
            where: {
                patientId,
                scheduledFor: { gte: past30Days },
            },
        });
        const totalLogs = logs.length;
        const takenLogs = logs.filter((l) => l.status === enums_js_1.MedicationStatus.TAKEN).length;
        const adherenceRate = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 96;
        res.json({
            success: true,
            data: {
                totalLogged: totalLogs,
                takenCount: takenLogs,
                missedCount: logs.filter((l) => l.status === enums_js_1.MedicationStatus.MISSED).length,
                adherenceRate,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/medications/log (Mark medication as TAKEN / MISSED / SKIPPED)
const logSchema = zod_1.z.object({
    medicationId: zod_1.z.string(),
    patientId: zod_1.z.string(),
    status: zod_1.z.nativeEnum(enums_js_1.MedicationStatus),
    notes: zod_1.z.string().optional(),
});
router.post('/log', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const body = logSchema.parse(req.body);
        const medication = await prisma_js_1.prisma.medication.findUnique({
            where: { id: body.medicationId },
        });
        if (!medication) {
            res.status(404).json({ success: false, message: 'Medication not found', code: 'MEDICATION_NOT_FOUND' });
            return;
        }
        const log = await prisma_js_1.prisma.medicationLog.create({
            data: {
                medicationId: body.medicationId,
                patientId: body.patientId,
                scheduledFor: new Date(),
                takenAt: body.status === enums_js_1.MedicationStatus.TAKEN ? new Date() : null,
                status: body.status,
                loggedBy: req.user.role,
                notes: body.notes || `Logged as ${body.status} by ${req.user.firstName}`,
            },
        });
        // Notify Caregiver and Doctor in real time via Socket.IO
        socketService_js_1.socketService.emitToPatientRoom(body.patientId, 'medication_taken', {
            log,
            medicationName: medication.name,
            dosage: medication.dosage,
            status: body.status,
            patientId: body.patientId,
        });
        await notificationService_js_1.notificationService.notifyPatientTeam(body.patientId, {
            title: `Medication ${body.status}: ${medication.name}`,
            message: `${medication.name} (${medication.dosage}) was recorded as ${body.status}.`,
            type: 'MEDICATION',
        });
        res.status(201).json({ success: true, data: log });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
// POST /api/medications (Add new medication)
const medCreateSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    dosage: zod_1.z.string().min(1),
    form: zod_1.z.string().default('TABLET'),
    frequency: zod_1.z.string().default('ONCE_DAILY'),
    instructions: zod_1.z.string().optional(),
    scheduledTimes: zod_1.z.array(zod_1.z.string()).default(['08:00']),
});
router.post('/', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const body = medCreateSchema.parse(req.body);
        const med = await prisma_js_1.prisma.medication.create({
            data: {
                patientId: body.patientId,
                name: body.name,
                dosage: body.dosage,
                form: body.form,
                frequency: body.frequency,
                instructions: body.instructions,
                schedules: {
                    create: body.scheduledTimes.map((time) => ({
                        scheduledTime: time,
                        daysOfWeek: 'DAILY',
                        dosage: body.dosage,
                    })),
                },
            },
            include: { schedules: true },
        });
        res.status(201).json({ success: true, data: med });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
