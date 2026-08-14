import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// GET /api/posts?cursor=&limit=&authorId= — paginated feed
router.get('/', asyncHandler(async (req, res) => {
  const { cursor, limit = '10', authorId } = req.query;
  const take = Math.min(parseInt(limit, 10) || 10, 50);

  const posts = await prisma.post.findMany({
    where: authorId ? { authorId } : {},
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { appreciations: true } },
    },
  });

  const hasMore = posts.length > take;
  const items = hasMore ? posts.slice(0, take) : posts;
  res.json({ posts: items, nextCursor: hasMore ? items[items.length - 1].id : null });
}));

// GET /api/posts/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { appreciations: true } },
    },
  });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ post });
}));

// POST /api/posts
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { type, content, mediaUrls } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  const post = await prisma.post.create({
    data: { authorId: req.user.id, type, content, mediaUrls: mediaUrls || [] },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
  res.status(201).json({ post });
}));

// DELETE /api/posts/:id — author only
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await prisma.post.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

export default router;