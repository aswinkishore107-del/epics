"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const patientAccess_js_1 = require("../middleware/patientAccess.js");
const router = (0, express_1.Router)();
// GET /api/respiration/latest/:patientId
router.get('/latest/:patientId', auth_js_1.authenticateToken, patientAccess_js_1.verifyPatientAccess, async (req, res) => {
    try {
        const { patientId } = req.params;
        const reading = await prisma_js_1.prisma.respiratoryReading.findFirst({
            where: { patientId },
            orderBy: { timestamp: 'desc' },
        });
        res.json({
            success: true,
            data: {
                rate: reading?.rate || 16,
                depth: reading?.depth || 'NORMAL',
                measurementSource: 'ECG_DERIVED_RESPIRATION',
                sensorDescription: 'ECG-Derived Respiration (EDR) extracted from AD8232 amplitude modulation algorithm',
                timestamp: reading?.timestamp || new Date(),
                isSimulated: reading?.isSimulated ?? true,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
