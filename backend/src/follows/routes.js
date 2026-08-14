import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// POST /api/follows/:userId — follow or unfollow
router.post('/:userId', requireAuth, asyncHandler(async (req, res) => {
  if (req.params.userId === req.user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

  const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user.id, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return res.json({ following: false });
  }
  await prisma.follow.create({ data: { followerId: req.user.id, followingId: target.id } });
  res.json({ following: true });
}));

// GET /api/follows/:userId/followers
router.get('/:userId/followers', asyncHandler(async (req, res) => {
  const followers = await prisma.follow.findMany({
    where: { followingId: req.params.userId },
    include: { follower: { select: { id: true, name: true, avatarUrl: true } } },
  });
  res.json({ followers: followers.map((f) => f.follower) });
}));

// GET /api/follows/:userId/following
router.get('/:userId/following', asyncHandler(async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.params.userId },
    include: { following: { select: { id: true, name: true, avatarUrl: true } } },
  });
  res.json({ following: following.map((f) => f.following) });
}));

export default router;