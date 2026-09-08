"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/notes/patient/:patientId
router.get('/patient/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const notes = await prisma_js_1.prisma.doctorNote.findMany({
            where: { patientId },
            include: {
                doctor: {
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: notes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/notes
const noteSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    diagnosis: zod_1.z.string().min(1),
    treatmentPlan: zod_1.z.string().min(1),
    clinicalNotes: zod_1.z.string().min(1),
    isConfidential: zod_1.z.boolean().default(false),
});
router.post('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const body = noteSchema.parse(req.body);
        const doctorProfile = await prisma_js_1.prisma.doctorProfile.findUnique({
            where: { userId: req.user.id },
        });
        if (!doctorProfile) {
            res.status(403).json({ success: false, message: 'Only authorized doctors can create clinical notes', code: 'FORBIDDEN' });
            return;
        }
        const note = await prisma_js_1.prisma.doctorNote.create({
            data: {
                patientId: body.patientId,
                doctorId: doctorProfile.id,
                diagnosis: body.diagnosis,
                treatmentPlan: body.treatmentPlan,
                clinicalNotes: body.clinicalNotes,
                isConfidential: body.isConfidential,
            },
        });
        res.status(201).json({ success: true, data: note });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
