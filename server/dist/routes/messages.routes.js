"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const socketService_js_1 = require("../services/socketService.js");
const enums_js_1 = require("../types/enums.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/messages/conversations - List conversations the logged-in user belongs to
router.get('/conversations', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await prisma_js_1.prisma.conversation.findMany({
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Verify user is a participant
        const isParticipant = await prisma_js_1.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId: id, userId } },
        });
        if (!isParticipant) {
            res.status(403).json({ success: false, message: 'You are not a participant in this conversation', code: 'FORBIDDEN' });
            return;
        }
        const messages = await prisma_js_1.prisma.message.findMany({
            where: { conversationId: id },
            include: {
                sender: {
                    select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        // Update participant's lastReadAt
        await prisma_js_1.prisma.conversationParticipant.update({
            where: { conversationId_userId: { conversationId: id, userId } },
            data: { lastReadAt: new Date() },
        });
        res.json({ success: true, data: messages });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/messages/conversations/:id/messages (Send message)
const sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    messageType: zod_1.z.nativeEnum(enums_js_1.MessageType).default(enums_js_1.MessageType.TEXT),
});
router.post('/conversations/:id/messages', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const body = sendMessageSchema.parse(req.body);
        // Verify user is a participant
        const participant = await prisma_js_1.prisma.conversationParticipant.findUnique({
            where: { conversationId_userId: { conversationId: id, userId } },
        });
        if (!participant) {
            res.status(403).json({ success: false, message: 'You are not a participant in this conversation', code: 'FORBIDDEN' });
            return;
        }
        const message = await prisma_js_1.prisma.message.create({
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
        await prisma_js_1.prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        });
        // Broadcast in real time to conversation room
        socketService_js_1.socketService.emitToConversation(id, 'new_message', message);
        res.status(201).json({ success: true, data: message });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
