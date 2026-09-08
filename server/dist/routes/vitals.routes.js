"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const safetyRuleEngine_js_1 = require("../services/safetyRuleEngine.js");
const socketService_js_1 = require("../services/socketService.js");
const enums_js_1 = require("../types/enums.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/vitals/current/:patientId
router.get('/current/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const [latestReading, device] = await Promise.all([
            prisma_js_1.prisma.healthReading.findFirst({
                where: { patientId },
                orderBy: { timestamp: 'desc' },
            }),
            prisma_js_1.prisma.device.findFirst({
                where: { patientId },
            }),
        ]);
        if (!latestReading) {
            res.json({
                success: true,
                data: {
                    heartRate: 78,
                    spo2: 97,
                    skinTemperature: 36.5,
                    respiratoryRate: 16,
                    status: 'STABLE',
                    measurementSource: 'ECG_DERIVED_RESPIRATION',
                    sensorAttribution: {
                        skinTemperature: 'Measured using TMP117',
                        respiratoryRate: 'ECG-Derived Respiration (EDR) via AD8232',
                    },
                    device: device || null,
                },
            });
            return;
        }
        res.json({
            success: true,
            data: {
                ...latestReading,
                sensorAttribution: {
                    skinTemperature: 'Measured using TMP117',
                    respiratoryRate: 'ECG-Derived Respiration (EDR) via AD8232',
                },
                device: device || null,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/vitals/history/:patientId?timeRange=24h|7d|30d|90d
router.get('/history/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const timeRange = req.query.timeRange || '24h';
        let hours = 24;
        if (timeRange === '7d')
            hours = 24 * 7;
        else if (timeRange === '30d')
            hours = 24 * 30;
        else if (timeRange === '90d')
            hours = 24 * 90;
        const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);
        const readings = await prisma_js_1.prisma.healthReading.findMany({
            where: {
                patientId,
                timestamp: { gte: sinceDate },
            },
            orderBy: { timestamp: 'asc' },
        });
        // Format timestamp for clean Recharts display
        const formatted = readings.map((r) => ({
            id: r.id,
            timestamp: r.timestamp.toISOString(),
            timeLabel: timeRange === '24h'
                ? r.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : r.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
            heartRate: r.heartRate,
            spo2: r.spo2,
            skinTemperature: r.skinTemperature, // Strictly labeled Skin Temperature (TMP117)
            respiratoryRate: r.respiratoryRate, // ECG-Derived Respiration (EDR)
            systolicBP: r.systolicBP,
            diastolicBP: r.diastolicBP,
            status: r.status,
            isSimulated: r.isSimulated,
        }));
        res.json({
            success: true,
            data: formatted,
            meta: {
                timeRange,
                pointsCount: formatted.length,
                notes: {
                    temperatureLabel: 'Skin Temperature (TMP117)',
                    respirationLabel: 'Respiratory Rate — ECG-Derived Respiration (EDR)',
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/vitals/reading
const readingSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    heartRate: zod_1.z.number(),
    spo2: zod_1.z.number(),
    skinTemperature: zod_1.z.number(),
    respiratoryRate: zod_1.z.number(),
    systolicBP: zod_1.z.number().optional(),
    diastolicBP: zod_1.z.number().optional(),
    isSimulated: zod_1.z.boolean().default(true),
    source: zod_1.z.string().default('MANUAL_OR_DEVICE'),
});
router.post('/reading', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const body = readingSchema.parse(req.body);
        const reading = await prisma_js_1.prisma.healthReading.create({
            data: {
                patientId: body.patientId,
                heartRate: body.heartRate,
                spo2: body.spo2,
                skinTemperature: body.skinTemperature, // Measured strictly using TMP117
                respiratoryRate: body.respiratoryRate, // ECG-Derived Respiration (EDR)
                systolicBP: body.systolicBP,
                diastolicBP: body.diastolicBP,
                status: enums_js_1.HealthStatus.STABLE,
                measurementSource: enums_js_1.MeasurementSource.ECG_DERIVED_RESPIRATION,
                isSimulated: body.isSimulated,
                source: body.source,
                timestamp: new Date(),
            },
        });
        // Run deterministic Safety Rule Engine
        const ruleAlerts = await safetyRuleEngine_js_1.safetyRuleEngine.evaluateReading(reading);
        socketService_js_1.socketService.emitToPatientRoom(body.patientId, 'vital_updated', {
            reading,
            patientId: body.patientId,
        });
        res.status(201).json({
            success: true,
            data: reading,
            safetyEvaluation: ruleAlerts,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
