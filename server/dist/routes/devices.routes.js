"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const deviceSimulator_js_1 = require("../services/deviceSimulator.js");
const socketService_js_1 = require("../services/socketService.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/devices/:id
router.get('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const device = await prisma_js_1.prisma.device.findFirst({
            where: { OR: [{ id }, { deviceId: id }] },
        });
        if (!device) {
            res.status(404).json({ success: false, message: 'Device not found', code: 'DEVICE_NOT_FOUND' });
            return;
        }
        res.json({
            success: true,
            data: {
                ...device,
                sensors: [
                    { name: 'MAX30102', metric: 'Pulse Oximeter & Heart Rate', status: 'ACTIVE' },
                    { name: 'TMP117', metric: 'Skin Temperature Sensor', status: 'ACTIVE' },
                    { name: 'MPU6050', metric: '6-Axis IMU Fall & Posture Detection', status: 'ACTIVE' },
                    { name: 'AD8232', metric: 'Single-Lead ECG & ECG-Derived Respiration (EDR)', status: 'ACTIVE' },
                    { name: 'INMP441', metric: 'I2S MEMS Microphone Voice Pickup', status: 'STANDBY' },
                    { name: 'MAX98357A', metric: 'I2S Audio Amplifier & Speaker Output', status: 'READY' },
                    { name: 'SOS_SWITCH', metric: 'Instant Hardware Emergency Interrupt', status: 'ARMED' },
                ],
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/devices/patient/:patientId
router.get('/patient/:patientId', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { patientId } = req.params;
        const device = await prisma_js_1.prisma.device.findFirst({
            where: { patientId },
        });
        res.json({
            success: true,
            data: device || null,
            simulatorState: deviceSimulator_js_1.deviceSimulator.getSimulationStatus(),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/devices/:id/media (Music & Neckband Speaker controls)
const mediaSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    command: zod_1.z.enum(['PLAY', 'PAUSE', 'RESUME', 'NEXT', 'PREVIOUS', 'SET_VOLUME']),
    track: zod_1.z.string().optional(),
    volume: zod_1.z.number().min(0).max(100).optional(),
});
router.post('/:id/media', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const body = mediaSchema.parse(req.body);
        const result = await deviceSimulator_js_1.deviceSimulator.sendMediaCommand(id, body.command, {
            track: body.track,
            volume: body.volume,
        });
        socketService_js_1.socketService.emitToPatientRoom(body.patientId, 'music_command', {
            deviceId: id,
            patientId: body.patientId,
            command: body.command,
            track: body.track,
            volume: body.volume,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'MEDIA_COMMAND_ERROR' });
    }
});
// POST /api/devices/:id/call (Simulated Phone Call Initiation/Controls)
const callSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    action: zod_1.z.enum(['INITIATE', 'ACCEPT', 'DECLINE', 'END']),
    contact: zod_1.z.object({
        name: zod_1.z.string(),
        phone: zod_1.z.string(),
        relationship: zod_1.z.string().optional(),
    }),
});
router.post('/:id/call', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const body = callSchema.parse(req.body);
        const result = await deviceSimulator_js_1.deviceSimulator.sendCallCommand(id, body.action, body.contact);
        socketService_js_1.socketService.emitToPatientRoom(body.patientId, 'call_command', {
            deviceId: id,
            patientId: body.patientId,
            action: body.action,
            contact: body.contact,
        });
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'CALL_COMMAND_ERROR' });
    }
});
// POST /api/devices/simulator/toggle (Start/Stop continuous simulation ticker)
router.post('/simulator/toggle', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { patientId, enable } = req.body;
        if (enable) {
            deviceSimulator_js_1.deviceSimulator.startSimulation(patientId, 8);
        }
        else {
            deviceSimulator_js_1.deviceSimulator.stopSimulation();
        }
        res.json({
            success: true,
            data: deviceSimulator_js_1.deviceSimulator.getSimulationStatus(),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'SIMULATOR_ERROR' });
    }
});
// POST /api/devices/simulator/trigger (Trigger simulation actions)
router.post('/simulator/trigger', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { patientId, action, condition } = req.body;
        let result = null;
        if (action === 'SOS') {
            result = await deviceSimulator_js_1.deviceSimulator.triggerSOS(patientId);
        }
        else if (action === 'FALL') {
            result = await deviceSimulator_js_1.deviceSimulator.triggerFall(patientId);
        }
        else if (action === 'ABNORMAL_VITALS') {
            result = await deviceSimulator_js_1.deviceSimulator.triggerAbnormalVitals(patientId, condition || 'TACHYCARDIA');
        }
        else if (action === 'MISSED_MEDICATION') {
            result = await deviceSimulator_js_1.deviceSimulator.triggerMissedMedication(patientId);
        }
        else if (action === 'INCOMING_CALL') {
            socketService_js_1.socketService.emitToPatientRoom(patientId, 'call_command', {
                deviceId: 'VIORA-NECK-7291',
                patientId,
                action: 'INCOMING',
                contact: {
                    name: 'Priya Kumar (Daughter)',
                    phone: '+91 98765 43210',
                    relationship: 'Daughter',
                },
            });
            result = { triggered: 'INCOMING_CALL' };
        }
        else if (action === 'PHONE_NOTIFICATION') {
            socketService_js_1.socketService.emitToPatientRoom(patientId, 'phone_notification', {
                appName: 'WhatsApp',
                sender: 'Priya',
                message: 'Dad, I will drop by with fresh fruit around 5 PM!',
                timestamp: new Date(),
            });
            result = { triggered: 'PHONE_NOTIFICATION' };
        }
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'SIMULATOR_TRIGGER_ERROR' });
    }
});
exports.default = router;
