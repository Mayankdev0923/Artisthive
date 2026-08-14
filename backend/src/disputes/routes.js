import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// POST /api/disputes — open a dispute on an order
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;
  if (!orderId || !reason) return res.status(400).json({ error: 'orderId and reason are required' });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const artistProfile = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  const isArtist = artistProfile && artistProfile.id === order.artistId;
  if (order.buyerId !== req.user.id && !isArtist) return res.status(403).json({ error: 'Forbidden' });

  const dispute = await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: 'DISPUTED' } });
    const d = await tx.dispute.create({ data: { orderId, openedById: req.user.id, reason, status: 'OPEN' } });
    await tx.orderTimeline.create({ data: { orderId, event: 'DISPUTE_OPENED', actorId: req.user.id, note: reason } });
    return d;
  });
  res.status(201).json({ dispute });
}));

export default router;