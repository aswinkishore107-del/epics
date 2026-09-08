"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeckbandVoiceProvider = exports.BrowserVoiceProvider = void 0;
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const aiAssistantService_js_1 = require("../services/aiAssistantService.js");
const socketService_js_1 = require("../services/socketService.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
class BrowserVoiceProvider {
    mode = 'BROWSER_MODE';
    async processVoiceInput(audioPayload) {
        // In Browser Mode, browser SpeechRecognition provides transcription directly
        return audioPayload?.transcript || '';
    }
}
exports.BrowserVoiceProvider = BrowserVoiceProvider;
class NeckbandVoiceProvider {
    mode = 'NECKBAND_MODE';
    async processVoiceInput(audioPayload) {
        // Future ESP32 INMP441 raw audio buffer processing via Whisper / OpenAI Audio API
        return 'Simulated neckband microphone transcription';
    }
}
exports.NeckbandVoiceProvider = NeckbandVoiceProvider;
const browserVoice = new BrowserVoiceProvider();
const neckbandVoice = new NeckbandVoiceProvider();
// POST /api/voice/chat
const voiceChatSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    transcript: zod_1.z.string().min(1),
    source: zod_1.z.enum(['BROWSER', 'NECKBAND']).default('BROWSER'),
});
router.post('/chat', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { patientId, transcript, source } = voiceChatSchema.parse(req.body);
        const userId = req.user.id;
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'voice_started', {
            source,
            transcript,
            timestamp: new Date(),
        });
        const aiResult = await aiAssistantService_js_1.aiAssistantService.processChat(userId, patientId, transcript);
        socketService_js_1.socketService.emitToPatientRoom(patientId, 'voice_response', {
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
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VOICE_ERROR' });
    }
});
exports.default = router;
