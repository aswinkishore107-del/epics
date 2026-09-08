import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { MetricType, RuleOperator, SeverityLevel } from '../types/enums.js';
import { z } from 'zod';

const router = Router();

// GET /api/safety-rules
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rules = await prisma.safetyRule.findMany({
      orderBy: { metric: 'asc' },
    });

    res.json({
      success: true,
      data: rules,
      disclaimer: 'Demo safety threshold — not a medical diagnosis. Configurable for platform simulation and early warning demonstrations.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/safety-rules
const ruleSchema = z.object({
  metric: z.nativeEnum(MetricType),
  operator: z.nativeEnum(RuleOperator),
  threshold: z.number(),
  severity: z.nativeEnum(SeverityLevel).default(SeverityLevel.WARNING),
  enabled: z.boolean().default(true),
  description: z.string().min(1),
});

router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = ruleSchema.parse(req.body);

    const rule = await prisma.safetyRule.create({
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
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

// PATCH /api/safety-rules/:id
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { threshold, severity, enabled, description } = req.body;

    const updated = await prisma.safetyRule.update({
      where: { id },
      data: {
        threshold: threshold !== undefined ? Number(threshold) : undefined,
        severity: severity as SeverityLevel | undefined,
        enabled: enabled !== undefined ? Boolean(enabled) : undefined,
        description: description || undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

export default router;
