import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// POST /api/posts/:id/appreciate — toggle applause
router.post('/:id/appreciate', requireAuth, asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const existing = await prisma.appreciation.findUnique({
    where: { userId_postId: { userId: req.user.id, postId: post.id } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.appreciation.delete({ where: { id: existing.id } }),
      prisma.post.update({ where: { id: post.id }, data: { applauseCount: { decrement: 1 } } }),
    ]);
    return res.json({ appreciated: false, applauseCount: Math.max(0, post.applauseCount - 1) });
  }

  await prisma.$transaction([
    prisma.appreciation.create({ data: { userId: req.user.id, postId: post.id } }),
    prisma.post.update({ where: { id: post.id }, data: { applauseCount: { increment: 1 } } }),
  ]);
  res.json({ appreciated: true, applauseCount: post.applauseCount + 1 });
}));

// GET /api/posts/:id/appreciations?limit=
router.get('/:id/appreciations', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const appreciations = await prisma.appreciation.findMany({
    where: { postId: req.params.id },
    take: limit,
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  res.json({ appreciations });
}));

export default router;