"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/notifications
router.get('/', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma_js_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma_js_1.prisma.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/notifications/read-all
router.post('/read-all', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma_js_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
exports.default = router;
