"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const deviceSimulator_js_1 = require("../services/deviceSimulator.js");
const socketService_js_1 = require("../services/socketService.js");
const enums_js_1 = require("../types/enums.js");
const router = (0, express_1.Router)();
// POST /api/emergency/sos (Path 1: Manual SOS)
router.post('/sos', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { patientId, location } = req.body;
        if (!patientId) {
            res.status(400).json({ success: false, message: 'patientId is required', code: 'PATIENT_ID_REQUIRED' });
            return;
        }
        const emergency = await deviceSimulator_js_1.deviceSimulator.triggerSOS(patientId, location || 'Home Living Room');
        res.status(201).json({ success: true, data: emergency });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/emergency/fall/detect (Path 2: Inertial fall detected by neckband MPU6050)
router.post('/fall/detect', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { patientId } = req.body;
        if (!patientId) {
            res.status(400).json({ success: false, message: 'patientId is required', code: 'PATIENT_ID_REQUIRED' });
            return;
        }
        const fall = await deviceSimulator_js_1.deviceSimulator.triggerFall(patientId);
        res.status(201).json({ success: true, data: fall });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/emergency/fall/cancel (Elderly cancels countdown: "I am okay, false alarm")
router.post('/fall/cancel', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { fallId, patientId } = req.body;
        const fall = await prisma_js_1.prisma.fallEvent.update({
            where: { id: fallId },
            data: {
                status: enums_js_1.FallStatus.CANCELLED_FALSE_ALARM,
                verified: false,
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'fall_cancelled', {
            fallId,
            patientId,
            message: 'Fall alert cancelled by elderly user (False alarm).',
        });
        res.json({ success: true, data: fall, message: 'Fall alert cancelled successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/emergency/active/:patientId
router.get('/active/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const activeEmergency = await prisma_js_1.prisma.emergencyEvent.findFirst({
            where: {
                patientId,
                status: { in: [enums_js_1.EmergencyStatus.ACTIVE, enums_js_1.EmergencyStatus.ACKNOWLEDGED] },
            },
            orderBy: { timestamp: 'desc' },
            include: {
                patient: {
                    include: {
                        user: { select: { firstName: true, lastName: true, phone: true } },
                        emergencyContacts: { orderBy: { priority: 'asc' } },
                    },
                },
            },
        });
        res.json({ success: true, data: activeEmergency });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/emergency/acknowledge/:id
router.post('/acknowledge/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const emergency = await prisma_js_1.prisma.emergencyEvent.update({
            where: { id },
            data: {
                status: enums_js_1.EmergencyStatus.ACKNOWLEDGED,
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(emergency.patientId, 'emergency_acknowledged', {
            emergency,
            acknowledgedBy: req.user.firstName,
        });
        res.json({ success: true, data: emergency });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/emergency/resolve/:id
router.post('/resolve/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const emergency = await prisma_js_1.prisma.emergencyEvent.update({
            where: { id },
            data: {
                status: enums_js_1.EmergencyStatus.RESOLVED,
                resolvedByUserId: req.user.id,
                resolvedAt: new Date(),
                notes: notes || `Resolved by ${req.user.firstName} (${req.user.role})`,
            },
        });
        socketService_js_1.socketService.emitToPatientRoom(emergency.patientId, 'emergency_resolved', {
            emergency,
            resolvedBy: req.user.firstName,
        });
        res.json({ success: true, data: emergency });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/emergency/history/:patientId
router.get('/history/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const history = await prisma_js_1.prisma.emergencyEvent.findMany({
            where: { patientId },
            orderBy: { timestamp: 'desc' },
            take: 20,
        });
        res.json({ success: true, data: history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
