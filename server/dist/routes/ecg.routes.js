"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const router = (0, express_1.Router)();
// GET /api/ecg/latest/:patientId
router.get('/latest/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const record = await prisma_js_1.prisma.ecgRecord.findFirst({
            where: { patientId },
            orderBy: { timestamp: 'desc' },
        });
        if (!record) {
            res.json({
                success: true,
                data: null,
            });
            return;
        }
        res.json({
            success: true,
            data: {
                ...record,
                attribution: {
                    sensor: 'AD8232 Single-Lead ECG Front End',
                    derivedMetric: 'ECG-Derived Respiration (EDR)',
                    isSimulated: record.isSimulated,
                    demoNotice: record.isSimulated ? 'DEMO SIMULATION: Synthetic ECG waveform generated for platform preview.' : 'Live Biosensor Stream',
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/ecg/history/:patientId
router.get('/history/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const history = await prisma_js_1.prisma.ecgRecord.findMany({
            where: { patientId },
            orderBy: { timestamp: 'desc' },
            take: 10,
            select: {
                id: true,
                patientId: true,
                durationSeconds: true,
                sampleRate: true,
                heartRate: true,
                signalQuality: true,
                status: true,
                isSimulated: true,
                rhythmInterpretation: true,
                timestamp: true,
            },
        });
        res.json({ success: true, data: history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
