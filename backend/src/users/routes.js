import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// GET /api/users/:id — public profile
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { artistProfile: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { supertokensId: _st, ...safe } = user;
  res.json({ user: safe });
}));

// PATCH /api/users/me — update own profile
router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const { name, bio, avatarUrl, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, bio, avatarUrl, phone },
  });
  res.json({ user });
}));

export default router;