import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

// POST /api/reports — report fake artist / fraud / spam / etc.
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;
  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ error: 'targetType, targetId and reason are required' });
  }
  const report = await prisma.report.create({
    data: { reporterId: req.user.id, targetType, targetId, reason, details, status: 'OPEN' },
  });
  res.status(201).json({ report });
}));

export default router;