import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// GET /api/community/posts
router.get('/posts', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const posts = await prisma.communityPost.findMany({
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

    const formatted = posts.map((p: any) => ({
      ...p,
      hasLiked: p.likes.length > 0,
    }));

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/community/posts
const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().default('WELLNESS_TIPS'),
});

router.post('/posts', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = postSchema.parse(req.body);
    const userId = req.user!.id;

    const post = await prisma.communityPost.create({
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
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

// POST /api/community/posts/:id/like (Toggle like)
router.post('/posts/:id/like', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existingLike = await prisma.communityLike.findUnique({
      where: { postId_userId: { postId: id, userId } },
    });

    if (existingLike) {
      await prisma.communityLike.delete({ where: { id: existingLike.id } });
      await prisma.communityPost.update({
        where: { id },
        data: { likesCount: { decrement: 1 } },
      });
      res.json({ success: true, liked: false });
    } else {
      await prisma.communityLike.create({
        data: { postId: id, userId },
      });
      await prisma.communityPost.update({
        where: { id },
        data: { likesCount: { increment: 1 } },
      });
      res.json({ success: true, liked: true });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, code: 'INTERNAL_ERROR' });
  }
});

// POST /api/community/posts/:id/comment
const commentSchema = z.object({
  content: z.string().min(1),
});

router.post('/posts/:id/comment', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = commentSchema.parse(req.body);
    const userId = req.user!.id;

    const comment = await prisma.communityComment.create({
      data: {
        postId: id,
        authorId: userId,
        content,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
      },
    });

    await prisma.communityPost.update({
      where: { id },
      data: { commentsCount: { increment: 1 } },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message, code: 'VALIDATION_ERROR' });
  }
});

export default router;
