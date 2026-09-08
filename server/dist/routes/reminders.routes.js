"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const socketService_js_1 = require("../services/socketService.js");
const enums_js_1 = require("../types/enums.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/reminders/patient/:patientId
router.get('/patient/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const reminders = await prisma_js_1.prisma.reminder.findMany({
            where: { patientId },
            orderBy: { scheduledTime: 'asc' },
        });
        res.json({ success: true, data: reminders });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/reminders
const reminderSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    category: zod_1.z.nativeEnum(enums_js_1.ReminderCategory).default(enums_js_1.ReminderCategory.GENERAL),
    scheduledTime: zod_1.z.string(),
});
router.post('/', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const body = reminderSchema.parse(req.body);
        const reminder = await prisma_js_1.prisma.reminder.create({
            data: {
                patientId: body.patientId,
                title: body.title,
                description: body.description,
                category: body.category,
                scheduledTime: new Date(body.scheduledTime),
                status: enums_js_1.ReminderStatus.PENDING,
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(body.patientId, 'reminder_created', {
            reminder,
            patientId: body.patientId,
        });
        res.status(201).json({ success: true, data: reminder });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
// PATCH /api/reminders/:id
router.patch('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, snoozedUntil } = req.body;
        const updated = await prisma_js_1.prisma.reminder.update({
            where: { id },
            data: {
                status: status,
                snoozedUntil: snoozedUntil ? new Date(snoozedUntil) : undefined,
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// DELETE /api/reminders/:id
router.delete('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_js_1.prisma.reminder.delete({ where: { id } });
        res.json({ success: true, message: 'Reminder deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
