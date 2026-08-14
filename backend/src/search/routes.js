import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// GET /api/search?q=&type=artists|posts|products
router.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const type = req.query.type || 'all';
  if (!q) return res.json({ artists: [], posts: [], products: [] });

  const results = {};
  if (type === 'all' || type === 'artists') {
    results.artists = await prisma.artistProfile.findMany({
      where: { displayName: { contains: q, mode: 'insensitive' } },
      take: 10,
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }
  if (type === 'all' || type === 'posts') {
    results.posts = await prisma.post.findMany({
      where: { content: { contains: q, mode: 'insensitive' } },
      take: 10,
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }
  if (type === 'all' || type === 'products') {
    results.products = await prisma.product.findMany({
      where: { title: { contains: q, mode: 'insensitive' } },
      take: 10,
      include: { artist: { include: { user: { select: { id: true, name: true } } } } },
    });
  }
  res.json(results);
}));

export default router;