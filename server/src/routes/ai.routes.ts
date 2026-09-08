import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { aiAssistantService } from '../services/aiAssistantService.js';
import { z } from 'zod';

const router = Router();

const chatSchema = z.object({
  patientId: z.string(),
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

// POST /api/ai/chat
router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { patientId, message, conversationId } = chatSchema.parse(req.body);
    const userId = req.user!.id;

    // Get or create AI conversation thread
    let aiConv = conversationId
      ? await prisma.aiConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (!aiConv) {
      aiConv = await prisma.aiConversation.create({
        data: {
          userId,
          patientId,
          title: message.slice(0, 40) + '...',
        },
      });
    }

    // Save user message
    await prisma.aiMessage.create({
      data: {
        conversationId: aiConv.id,
        role: 'user',
        content: message,
      },
    });

    // Retrieve previous messages for context
    const recentMessages = await prisma.aiMessage.findMany({
      where: { conversationId: aiConv.id },
      orderBy: { createdAt: 'asc' },
      take: 8,
    });

    const result = await aiAssistantService.processChat(userId, patientId, message, recentMessages);

    // Save assistant message
    const assistantMsg = await prisma.aiMessage.create({
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
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'AI_CHAT_ERROR' });
  }
});

export default router;
