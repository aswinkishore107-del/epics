import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { socketService } from '../services/socketService.js';
import { MessageType } from '../types/enums.js';
import { z } from 'zod';

const router = Router();

// GET /api/messages/conversations - List conversations the logged-in user belongs to
router.get('/conversations', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify user is a participant
    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });

    if (!isParticipant) {
      res.status(403).json({ success: false, message: 'You are not a participant in this conversation', code: 'FORBIDDEN' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Update participant's lastReadAt
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId } },
      data: { lastReadAt: new Date() },
    });

    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/messages/conversations/:id/messages (Send message)
const sendMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.nativeEnum(MessageType).default(MessageType.TEXT),
});

router.post('/conversations/:id/messages', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const body = sendMessageSchema.parse(req.body);

    // Verify user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });

    if (!participant) {
      res.status(403).json({ success: false, message: 'You are not a participant in this conversation', code: 'FORBIDDEN' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content: body.content,
        messageType: body.messageType,
        deliveredAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Broadcast in real time to conversation room
    socketService.emitToConversation(id, 'new_message', message);

    res.status(201).json({ success: true, data: message });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

export default router;
