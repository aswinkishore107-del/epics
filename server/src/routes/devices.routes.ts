import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { deviceSimulator } from '../services/deviceSimulator.js';
import { socketService } from '../services/socketService.js';
import { z } from 'zod';

const router = Router();

// GET /api/devices/:id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const device = await prisma.device.findFirst({
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/devices/patient/:patientId
router.get('/patient/:patientId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const device = await prisma.device.findFirst({
      where: { patientId },
    });

    res.json({
      success: true,
      data: device || null,
      simulatorState: deviceSimulator.getSimulationStatus(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/devices/:id/media (Music & Neckband Speaker controls)
const mediaSchema = z.object({
  patientId: z.string(),
  command: z.enum(['PLAY', 'PAUSE', 'RESUME', 'NEXT', 'PREVIOUS', 'SET_VOLUME']),
  track: z.string().optional(),
  volume: z.number().min(0).max(100).optional(),
});

router.post('/:id/media', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = mediaSchema.parse(req.body);

    const result = await deviceSimulator.sendMediaCommand(id, body.command, {
      track: body.track,
      volume: body.volume,
    });

    socketService.emitToPatientRoom(body.patientId, 'music_command', {
      deviceId: id,
      patientId: body.patientId,
      command: body.command,
      track: body.track,
      volume: body.volume,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'MEDIA_COMMAND_ERROR' });
  }
});

// POST /api/devices/:id/call (Simulated Phone Call Initiation/Controls)
const callSchema = z.object({
  patientId: z.string(),
  action: z.enum(['INITIATE', 'ACCEPT', 'DECLINE', 'END']),
  contact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string().optional(),
  }),
});

router.post('/:id/call', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = callSchema.parse(req.body);

    const result = await deviceSimulator.sendCallCommand(id, body.action, body.contact);

    socketService.emitToPatientRoom(body.patientId, 'call_command', {
      deviceId: id,
      patientId: body.patientId,
      action: body.action,
      contact: body.contact,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'CALL_COMMAND_ERROR' });
  }
});

// POST /api/devices/simulator/toggle (Start/Stop continuous simulation ticker)
router.post('/simulator/toggle', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId, enable } = req.body;

    if (enable) {
      deviceSimulator.startSimulation(patientId, 8);
    } else {
      deviceSimulator.stopSimulation();
    }

    res.json({
      success: true,
      data: deviceSimulator.getSimulationStatus(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'SIMULATOR_ERROR' });
  }
});

// POST /api/devices/simulator/trigger (Trigger simulation actions)
router.post('/simulator/trigger', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId, action, condition } = req.body;
    let result: any = null;

    if (action === 'SOS') {
      result = await deviceSimulator.triggerSOS(patientId);
    } else if (action === 'FALL') {
      result = await deviceSimulator.triggerFall(patientId);
    } else if (action === 'ABNORMAL_VITALS') {
      result = await deviceSimulator.triggerAbnormalVitals(patientId, condition || 'TACHYCARDIA');
    } else if (action === 'MISSED_MEDICATION') {
      result = await deviceSimulator.triggerMissedMedication(patientId);
    } else if (action === 'INCOMING_CALL') {
      socketService.emitToPatientRoom(patientId, 'call_command', {
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
    } else if (action === 'PHONE_NOTIFICATION') {
      socketService.emitToPatientRoom(patientId, 'phone_notification', {
        appName: 'WhatsApp',
        sender: 'Priya',
        message: 'Dad, I will drop by with fresh fruit around 5 PM!',
        timestamp: new Date(),
      });
      result = { triggered: 'PHONE_NOTIFICATION' };
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'SIMULATOR_TRIGGER_ERROR' });
  }
});

export default router;
