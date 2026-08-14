import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// GET /api/products?artistId=&status=ACTIVE&cursor=&limit=
router.get('/', asyncHandler(async (req, res) => {
  const { artistId, status = 'ACTIVE', cursor, limit = '12' } = req.query;
  const take = Math.min(parseInt(limit, 10) || 12, 50);

  const products = await prisma.product.findMany({
    where: {
      ...(artistId ? { artistId } : {}),
      ...(status ? { status } : {}),
    },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: { artist: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });

  const hasMore = products.length > take;
  const items = hasMore ? products.slice(0, take) : products;
  res.json({ products: items, nextCursor: hasMore ? items[items.length - 1].id : null });
}));

// GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { artist: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
}));

// POST /api/products — verified artist only
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const artistProfile = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  if (!artistProfile || artistProfile.verificationStatus !== 'VERIFIED') {
    return res.status(403).json({ error: 'Only verified artists can list products' });
  }
  const { title, description, type, price, images } = req.body;
  if (!title || price == null) return res.status(400).json({ error: 'title and price are required' });

  const product = await prisma.product.create({
    data: { artistId: artistProfile.id, title, description, type, price, images: images || [] },
  });
  res.status(201).json({ product });
}));

export default router;