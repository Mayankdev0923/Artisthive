import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

function timeline(orderId, event, actorId, note) {
  return prisma.orderTimeline.create({ data: { orderId, event, actorId, note } });
}

// POST /api/orders — buyer creates a protected deal (product or custom)
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { artistId, productId, title, amount } = req.body;
  if (!artistId || !title || amount == null) {
    return res.status(400).json({ error: 'artistId, title and amount are required' });
  }

  const artist = await prisma.artistProfile.findUnique({ where: { id: artistId } });
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        buyerId: req.user.id,
        artistId,
        productId,
        title,
        amount,
        paymentStatus: 'PENDING',
        status: 'PENDING_PAYMENT',
      },
    });
    await tx.orderTimeline.create({
      data: { orderId: created.id, event: 'ORDER_CREATED', actorId: req.user.id },
    });
    return created;
  });
  res.status(201).json({ order });
}));

// GET /api/orders/me — my orders (buyer or artist)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const artistProfile = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerId: req.user.id }, ...(artistProfile ? [{ artistId: artistProfile.id }] : [])] },
    orderBy: { createdAt: 'desc' },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      artist: { include: { user: { select: { id: true, name: true } } } },
      evidence: true,
      disputes: true,
    },
  });
  res.json({ orders });
}));

// GET /api/orders/:id — with timeline + evidence
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true, email: true } },
      artist: { include: { user: { select: { id: true, name: true, email: true } } } },
      evidence: { include: { uploader: { select: { id: true, name: true } } } },
      disputes: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const artistProfile = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  const isArtist = artistProfile && artistProfile.id === order.artistId;
  if (order.buyerId !== req.user.id && !isArtist && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ order });
}));

// POST /api/orders/:id/demo-pay — simulate payment confirmation
router.post('/:id/demo-pay', requireAuth, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Only the buyer can pay' });
  if (order.status !== 'PENDING_PAYMENT') return res.status(400).json({ error: 'Order is not pending payment' });

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'DEMO_CONFIRMED', status: 'IN_PROGRESS' },
    });
    await tx.orderTimeline.create({
      data: { orderId: order.id, event: 'PAYMENT_DEMO_CONFIRMED', actorId: req.user.id, note: 'Simulated payment — no real money moved' },
    });
    return o;
  });
  res.json({ order: updated });
}));

// POST /api/orders/:id/evidence — upload evidence (buyer/artist)
router.post('/:id/evidence', requireAuth, asyncHandler(async (req, res) => {
  const { phase, mediaUrls, description } = req.body;
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const artistProfile = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  const isArtist = artistProfile && artistProfile.id === order.artistId;
  if (order.buyerId !== req.user.id && !isArtist) return res.status(403).json({ error: 'Forbidden' });
  if (!mediaUrls?.length) return res.status(400).json({ error: 'mediaUrls is required' });

  const evidence = await prisma.evidence.create({
    data: { orderId: order.id, uploaderId: req.user.id, phase, mediaUrls, description },
  });
  res.status(201).json({ evidence });
}));

export default router;