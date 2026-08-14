import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// POST /api/bookings — user requests a booking from an artist
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { artistId, serviceType, details, scheduledAt, price } = req.body;
  if (!artistId || !serviceType) return res.status(400).json({ error: 'artistId and serviceType are required' });

  const artist = await prisma.artistProfile.findUnique({ where: { id: artistId } });
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  const booking = await prisma.booking.create({
    data: {
      artistId,
      buyerId: req.user.id,
      serviceType,
      details,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      price: price != null ? price : null,
      status: 'REQUESTED',
    },
  });
  res.status(201).json({ booking });
}));

// GET /api/bookings/me — my bookings (as buyer or artist)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const artistProfile = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  const bookings = await prisma.booking.findMany({
    where: { OR: [{ buyerId: req.user.id }, ...(artistProfile ? [{ artistId: artistProfile.id }] : [])] },
    orderBy: { createdAt: 'desc' },
    include: {
      artist: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      buyer: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  res.json({ bookings });
}));

// PATCH /api/bookings/:id/status — artist confirms/cancels, buyer cancels
router.patch('/:id/status', requireAuth, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const artistProfile = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  const isArtist = artistProfile && artistProfile.id === booking.artistId;
  const isBuyer = booking.buyerId === req.user.id;

  const allowed = {
    CONFIRMED: isArtist,
    REJECTED: isArtist,
    CANCELLED: isBuyer || isArtist,
  };
  if (!allowed[status]) return res.status(403).json({ error: 'Not allowed to set this status' });

  const updated = await prisma.booking.update({ where: { id: booking.id }, data: { status } });
  res.json({ booking: updated });
}));

export default router;