"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = require("../prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// GET /api/community/posts
router.get('/posts', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const posts = await prisma_js_1.prisma.communityPost.findMany({
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
                },
                comments: {
                    include: {
                        author: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                likes: {
                    where: { userId },
                    select: { id: true },
                },
            },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        });
        const formatted = posts.map((p) => ({
            ...p,
            hasLiked: p.likes.length > 0,
        }));
        res.json({ success: true, data: formatted });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/community/posts
const postSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    category: zod_1.z.string().default('WELLNESS_TIPS'),
});
router.post('/posts', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const body = postSchema.parse(req.body);
        const userId = req.user.id;
        const post = await prisma_js_1.prisma.communityPost.create({
            data: {
                authorId: userId,
                title: body.title,
                content: body.content,
                category: body.category,
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
            },
        });
        res.status(201).json({ success: true, data: post });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
// POST /api/community/posts/:id/like (Toggle like)
router.post('/posts/:id/like', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const existingLike = await prisma_js_1.prisma.communityLike.findUnique({
            where: { postId_userId: { postId: id, userId } },
        });
        if (existingLike) {
            await prisma_js_1.prisma.communityLike.delete({ where: { id: existingLike.id } });
            await prisma_js_1.prisma.communityPost.update({
                where: { id },
                data: { likesCount: { decrement: 1 } },
            });
            res.json({ success: true, liked: false });
        }
        else {
            await prisma_js_1.prisma.communityLike.create({
                data: { postId: id, userId },
            });
            await prisma_js_1.prisma.communityPost.update({
                where: { id },
                data: { likesCount: { increment: 1 } },
            });
            res.json({ success: true, liked: true });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
    }
});
// POST /api/community/posts/:id/comment
const commentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
});
router.post('/posts/:id/comment', auth_js_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = commentSchema.parse(req.body);
        const userId = req.user.id;
        const comment = await prisma_js_1.prisma.communityComment.create({
            data: {
                postId: id,
                authorId: userId,
                content,
            },
            include: {
                author: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
            },
        });
        await prisma_js_1.prisma.communityPost.update({
            where: { id },
            data: { commentsCount: { increment: 1 } },
        });
        res.status(201).json({ success: true, data: comment });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
    }
});
exports.default = router;
