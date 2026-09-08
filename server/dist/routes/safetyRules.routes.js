"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const enums_js_1 = require("../types/enums.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/safety-rules
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const rules = await prisma_js_1.prisma.safetyRule.findMany({
            orderBy: { metric: 'asc' },
        });
        res.json({
            success: true,
            data: rules,
            disclaimer: 'Demo safety threshold — not a medical diagnosis. Configurable for platform simulation and early warning demonstrations.',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/safety-rules
const ruleSchema = zod_1.z.object({
    metric: zod_1.z.nativeEnum(enums_js_1.MetricType),
    operator: zod_1.z.nativeEnum(enums_js_1.RuleOperator),
    threshold: zod_1.z.number(),
    severity: zod_1.z.nativeEnum(enums_js_1.SeverityLevel).default(enums_js_1.SeverityLevel.WARNING),
    enabled: zod_1.z.boolean().default(true),
    description: zod_1.z.string().min(1),
});
router.post('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const body = ruleSchema.parse(req.body);
        const rule = await prisma_js_1.prisma.safetyRule.create({
            data: {
                metric: body.metric,
                operator: body.operator,
                threshold: body.threshold,
                severity: body.severity,
                enabled: body.enabled,
                description: body.description,
                isDemoThreshold: true,
            },
        });
        res.status(201).json({
            success: true,
            data: rule,
            disclaimer: 'Demo safety threshold — not a medical diagnosis.',
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
// PATCH /api/safety-rules/:id
router.patch('/:id', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { threshold, severity, enabled, description } = req.body;
        const updated = await prisma_js_1.prisma.safetyRule.update({
            where: { id },
            data: {
                threshold: threshold !== undefined ? Number(threshold) : undefined,
                severity: severity,
                enabled: enabled !== undefined ? Boolean(enabled) : undefined,
                description: description || undefined,
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
