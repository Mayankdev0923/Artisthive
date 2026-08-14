import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();

async function getParticipantConversationIds(userId) {
  const rows = await prisma.conversationParticipant.findMany({ where: { userId }, select: { conversationId: true } });
  return rows.map((r) => r.conversationId);
}

// GET /api/conversations — list my conversations
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const ids = await getParticipantConversationIds(req.user.id);
  const conversations = await prisma.conversation.findMany({
    where: { id: { in: ids } },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  res.json({ conversations });
}));

// POST /api/conversations — start or resume a conversation with another user
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId || userId === req.user.id) return res.status(400).json({ error: 'Invalid participant' });

  const other = await prisma.user.findUnique({ where: { id: userId } });
  if (!other) return res.status(404).json({ error: 'User not found' });

  const mine = await getParticipantConversationIds(req.user.id);
  const existing = await prisma.conversation.findFirst({
    where: {
      id: { in: mine },
      participants: { some: { userId } },
    },
    include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });
  if (existing) return res.json({ conversation: existing });

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: req.user.id }, { userId }],
      },
    },
    include: { participants: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } },
  });
  res.status(201).json({ conversation });
}));

// GET /api/conversations/:id/messages?beforeId=&limit= — newest first, fetch older when scrolling up
router.get('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const { beforeId, limit = '20' } = req.query;
  const take = Math.min(parseInt(limit, 10) || 20, 100);

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: req.params.id, userId: req.user.id } },
  });
  if (!participant) return res.status(403).json({ error: 'Not a participant of this conversation' });

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id, ...(beforeId ? { id: { lt: beforeId } } : {}) },
    take: take + 1,
    orderBy: { id: 'desc' },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const hasMore = messages.length > take;
  const items = hasMore ? messages.slice(0, take) : messages;
  res.json({ messages: items.reverse(), hasMore, olderCursor: hasMore ? items[0].id : null });
}));

// POST /api/conversations/:id/messages — send via REST fallback (Socket.IO is primary)
router.post('/:id/messages', requireAuth, asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: req.params.id, userId: req.user.id } },
  });
  if (!participant) return res.status(403).json({ error: 'Not a participant' });

  const message = await prisma.message.create({
    data: { conversationId: req.params.id, senderId: req.user.id, content },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });
  await prisma.conversation.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });
  res.status(201).json({ message });
}));

export default router;