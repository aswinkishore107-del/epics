"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/wellness/latest/:patientId
router.get('/latest/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const latest = await prisma_js_1.prisma.wellnessResponse.findFirst({
            where: { patientId },
            orderBy: { recordedDate: 'desc' },
        });
        res.json({ success: true, data: latest });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/wellness/history/:patientId
router.get('/history/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const records = await prisma_js_1.prisma.wellnessResponse.findMany({
            where: { patientId },
            orderBy: { recordedDate: 'desc' },
            take: 14,
        });
        res.json({ success: true, data: records });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/wellness/submit
const wellnessSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    sleepHours: zod_1.z.number().min(0).max(24),
    sleepQuality: zod_1.z.string().default('GOOD'),
    dietRating: zod_1.z.string().default('BALANCED'),
    stressLevel: zod_1.z.string().default('LOW'),
    alcoholIntake: zod_1.z.string().default('NONE'),
    tobaccoUse: zod_1.z.string().default('NONE'),
    weightKg: zod_1.z.number().min(20).max(250),
    heightCm: zod_1.z.number().min(50).max(250),
    notes: zod_1.z.string().optional(),
});
router.post('/submit', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const body = wellnessSchema.parse(req.body);
        // Calculate BMI: weight (kg) / [height (m)]^2
        const heightInMeters = body.heightCm / 100;
        const bmi = parseFloat((body.weightKg / (heightInMeters * heightInMeters)).toFixed(1));
        const record = await prisma_js_1.prisma.wellnessResponse.create({
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
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
