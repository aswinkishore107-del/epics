"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const aiAssistantService_js_1 = require("../services/aiAssistantService.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const chatSchema = zod_1.z.object({
    patientId: zod_1.z.string(),
    message: zod_1.z.string().min(1),
    conversationId: zod_1.z.string().optional(),
});
// POST /api/ai/chat
router.post('/chat', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { patientId, message, conversationId } = chatSchema.parse(req.body);
        const userId = req.user.id;
        // Get or create AI conversation thread
        let aiConv = conversationId
            ? await prisma_js_1.prisma.aiConversation.findUnique({ where: { id: conversationId } })
            : null;
        if (!aiConv) {
            aiConv = await prisma_js_1.prisma.aiConversation.create({
                data: {
                    userId,
                    patientId,
                    title: message.slice(0, 40) + '...',
                },
            });
        }
        // Save user message
        await prisma_js_1.prisma.aiMessage.create({
            data: {
                conversationId: aiConv.id,
                role: 'user',
                content: message,
            },
        });
        // Retrieve previous messages for context
        const recentMessages = await prisma_js_1.prisma.aiMessage.findMany({
            where: { conversationId: aiConv.id },
            orderBy: { createdAt: 'asc' },
            take: 8,
        });
        const result = await aiAssistantService_js_1.aiAssistantService.processChat(userId, patientId, message, recentMessages);
        // Save assistant message
        const assistantMsg = await prisma_js_1.prisma.aiMessage.create({
            data: {
                conversationId: aiConv.id,
                role: 'assistant',
                content: result.reply,
                toolResultJson: { toolsUsed: result.toolsUsed },
            },
        });
        res.json({
            success: true,
            data: {
                conversationId: aiConv.id,
                messageId: assistantMsg.id,
                reply: result.reply,
                toolsUsed: result.toolsUsed,
                disclaimer: 'VIORA AI Assistant provides informational health guidance and does NOT provide medical diagnoses or emergency determinations.',
            },
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'AI_CHAT_ERROR' });
    }
});
exports.default = router;
