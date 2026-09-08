import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { aiAssistantService } from '../services/aiAssistantService.js';
import { socketService } from '../services/socketService.js';
import { z } from 'zod';

const router = Router();

export interface VoiceProvider {
  mode: 'BROWSER_MODE' | 'NECKBAND_MODE';
  processVoiceInput(audioPayload: any): Promise<string>;
}

export class BrowserVoiceProvider implements VoiceProvider {
  mode: 'BROWSER_MODE' = 'BROWSER_MODE';
  async processVoiceInput(audioPayload: any): Promise<string> {
    // In Browser Mode, browser SpeechRecognition provides transcription directly
    return audioPayload?.transcript || '';
  }
}

export class NeckbandVoiceProvider implements VoiceProvider {
  mode: 'NECKBAND_MODE' = 'NECKBAND_MODE';
  async processVoiceInput(audioPayload: any): Promise<string> {
    // Future ESP32 INMP441 raw audio buffer processing via Whisper / OpenAI Audio API
    return 'Simulated neckband microphone transcription';
  }
}

const browserVoice = new BrowserVoiceProvider();
const neckbandVoice = new NeckbandVoiceProvider();

// POST /api/voice/chat
const voiceChatSchema = z.object({
  patientId: z.string(),
  transcript: z.string().min(1),
  source: z.enum(['BROWSER', 'NECKBAND']).default('BROWSER'),
});

router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId, transcript, source } = voiceChatSchema.parse(req.body);
    const userId = req.user!.id;

    socketService.emitToPatientRoom(patientId, 'voice_started', {
      source,
      transcript,
      timestamp: new Date(),
    });

    const aiResult = await aiAssistantService.processChat(userId, patientId, transcript);

    socketService.emitToPatientRoom(patientId, 'voice_response', {
      reply: aiResult.reply,
      toolsUsed: aiResult.toolsUsed,
      source,
    });

    res.json({
      success: true,
      data: {
        transcript,
        reply: aiResult.reply,
        toolsUsed: aiResult.toolsUsed,
        provider: source === 'BROWSER' ? browserVoice.mode : neckbandVoice.mode,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VOICE_ERROR' });
  }
});

export default router;
