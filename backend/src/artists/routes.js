import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// POST /api/artists/apply — submit an artist application
router.post('/apply', requireAuth, asyncHandler(async (req, res) => {
  const { category, displayName, bio, socialProfileUrl, portfolioUrl, workSamples } = req.body;
  if (!category || !displayName) {
    return res.status(400).json({ error: 'category and displayName are required' });
  }

  const existing = await prisma.artistProfile.findUnique({ where: { userId: req.user.id } });
  if (existing) return res.status(409).json({ error: 'Application already exists', artistProfile: existing });

  const code = `AV-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
  const artistProfile = await prisma.artistProfile.create({
    data: {
      userId: req.user.id,
      category,
      displayName,
      bio,
      socialProfileUrl,
      portfolioUrl,
      workSamples: workSamples || [],
      verificationCode: code,
      verificationStatus: 'PENDING',
    },
  });

  res.status(201).json({ artistProfile, verificationCode: code });
}));

// GET /api/artists/me — current user's artist application/profile
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { name: true, email: true } } },
  });
  res.json({ artistProfile: artistProfile || null });
}));

// GET /api/artists/:id — public verified artist profile
router.get('/:id', asyncHandler(async (req, res) => {
  const artistProfile = await prisma.artistProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, bio: true } },
      products: { where: { status: 'ACTIVE' } },
    },
  });
  if (!artistProfile) return res.status(404).json({ error: 'Artist not found' });
  res.json({ artistProfile });
}));

export default router;