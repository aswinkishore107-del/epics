"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const appointments = await prisma_js_1.prisma.appointment.findMany({
            where: { patientId },
            include: {
                doctor: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                    },
                },
            },
            orderBy: { appointmentDate: 'asc' },
        });
        res.json({ success: true, data: appointments });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/appointments
const apptSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    doctorId: zod_1.z.string(),
    title: zod_1.z.string().min(1),
    appointmentDate: zod_1.z.string(),
    location: zod_1.z.string().default('VIORA Telehealth Video'),
    notes: zod_1.z.string().optional(),
});
router.post('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const body = apptSchema.parse(req.body);
        const appointment = await prisma_js_1.prisma.appointment.create({
            data: {
                patientId: body.patientId,
                doctorId: body.doctorId,
                title: body.title,
                appointmentDate: new Date(body.appointmentDate),
                location: body.location,
                notes: body.notes,
            },
        });
        res.status(201).json({ success: true, data: appointment });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
