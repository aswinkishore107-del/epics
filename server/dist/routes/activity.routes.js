"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const router = (0, express_1.Router)();
// GET /api/activity/today/:patientId
router.get('/today/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const activity = await prisma_js_1.prisma.activityRecord.findFirst({
            where: { patientId },
            orderBy: { date: 'desc' },
        });
        res.json({
            success: true,
            data: activity || {
                steps: 4250,
                caloriesBurned: 185,
                activeMinutes: 42,
                distanceMeters: 3120,
                sleepMinutes: 450,
                date: new Date(),
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/activity/history/:patientId
router.get('/history/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const records = await prisma_js_1.prisma.activityRecord.findMany({
            where: { patientId },
            orderBy: { date: 'desc' },
            take: 14,
        });
        res.json({ success: true, data: records });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
