import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/http.js';

const router = Router();
router.use(requireAdmin);

async function audit(admin, action, entityType, entityId, details) {
  return prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action,
      entityType,
      entityId,
      details,
    },
  });
}

// GET /api/admin/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [pendingArtists, activeOrders, openDisputes, openReports, recentActivity] = await Promise.all([
    prisma.artistProfile.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'WAITING_FOR_ARTIST', 'WAITING_FOR_BUYER'] } } }),
    prisma.report.count({ where: { status: 'OPEN' } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ]);
  res.json({ stats: { pendingArtists, activeOrders, openDisputes, openReports }, recentActivity });
}));

// GET /api/admin/artists — verification queue
router.get('/artists', asyncHandler(async (req, res) => {
  const { status, limit = '20' } = req.query;
  const artists = await prisma.artistProfile.findMany({
    where: status ? { verificationStatus: status } : {},
    take: Math.min(parseInt(limit, 10) || 20, 100),
    orderBy: { appliedAt: 'asc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  res.json({ artists });
}));

// GET /api/admin/artists/:id
router.get('/artists/:id', asyncHandler(async (req, res) => {
  const artist = await prisma.artistProfile.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
  });
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  res.json({ artist });
}));

// POST /api/admin/artists/:id/approve | reject | request-info
router.post('/artists/:id/:action', asyncHandler(async (req, res) => {
  const { action } = req.params;
  const artist = await prisma.artistProfile.findUnique({ where: { id: req.params.id } });
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  const { notes } = req.body;

  let data = {};
  let auditAction;
  if (action === 'approve') {
    data = { verificationStatus: 'VERIFIED', verifiedAt: new Date(), adminNotes: notes };
    auditAction = 'APPROVED_ARTIST';
    await prisma.user.update({ where: { id: artist.userId }, data: { role: 'ARTIST' } });
  } else if (action === 'reject') {
    data = { verificationStatus: 'REJECTED', rejectedAt: new Date(), adminNotes: notes };
    auditAction = 'REJECTED_ARTIST';
  } else if (action === 'request-info') {
    data = { verificationStatus: 'MORE_INFO', adminNotes: notes };
    auditAction = 'REQUESTED_MORE_INFO';
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const updated = await prisma.artistProfile.update({ where: { id: artist.id }, data });
  await audit(req.user, auditAction, 'ArtistProfile', artist.id, notes);
  res.json({ artist: updated });
}));

// GET /api/admin/orders
router.get('/orders', asyncHandler(async (req, res) => {
  const { status, limit = '20' } = req.query;
  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    take: Math.min(parseInt(limit, 10) || 20, 100),
    orderBy: { createdAt: 'desc' },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      artist: { include: { user: { select: { id: true, name: true } } } },
      disputes: true,
      _count: { select: { evidence: true } },
    },
  });
  res.json({ orders });
}));

// GET /api/admin/orders/:id — full order detail with evidence + timeline
router.get('/orders/:id', asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      artist: { include: { user: { select: { id: true, name: true, email: true } } } },
      product: true,
      evidence: { include: { uploader: { select: { id: true, name: true } } } },
      disputes: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
}));

// POST /api/admin/orders/:id/:action — mark-completed | refund | open-dispute
router.post('/orders/:id/:action', asyncHandler(async (req, res) => {
  const { action } = req.params;
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { note } = req.body;

  let data = {};
  let event;
  let auditAction;
  if (action === 'mark-completed') {
    data = { status: 'COMPLETED', completedAt: new Date() };
    event = 'ADMIN_MARKED_COMPLETED';
    auditAction = 'MARKED_ORDER_COMPLETED';
  } else if (action === 'refund') {
    data = { status: 'REFUNDED', paymentStatus: 'PENDING' };
    event = 'ADMIN_REFUNDED_DEMO';
    auditAction = 'REFUNDED_ORDER';
  } else if (action === 'open-dispute') {
    data = { status: 'DISPUTED' };
    event = 'ADMIN_OPENED_DISPUTE';
    auditAction = 'OPENED_DISPUTE';
  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const o = await tx.order.update({ where: { id: order.id }, data });
    await tx.orderTimeline.create({ data: { orderId: order.id, event, actorId: req.user.id, note } });
    return o;
  });
  await audit(req.user, auditAction, 'Order', order.id, note);
  res.json({ order: updated });
}));

// POST /api/admin/evidence/:id/review — mark evidence reviewed
router.post('/evidence/:id/review', asyncHandler(async (req, res) => {
  const evidence = await prisma.evidence.update({
    where: { id: req.params.id },
    data: { reviewed: true, reviewedBy: req.user.id, reviewedAt: new Date() },
  });
  await audit(req.user, 'MARKED_EVIDENCE_REVIEWED', 'Evidence', evidence.id);
  res.json({ evidence });
}));

// GET /api/admin/disputes
router.get('/disputes', asyncHandler(async (req, res) => {
  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      order: { include: { buyer: { select: { id: true, name: true } }, artist: { include: { user: { select: { name: true } } } } } },
      openedBy: { select: { id: true, name: true } },
    },
  });
  res.json({ disputes });
}));

// POST /api/admin/disputes/:id — update status / decision / notes
router.post('/disputes/:id', asyncHandler(async (req, res) => {
  const { status, decision, internalNotes, outcome } = req.body;
  const dispute = await prisma.dispute.update({
    where: { id: req.params.id },
    data: {
      status,
      decision,
      internalNotes,
      outcome,
      ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolvedAt: new Date() } : {}),
    },
  });
  const auditAction = status === 'RESOLVED' ? 'RESOLVED_DISPUTE' : status === 'CLOSED' ? 'CLOSED_DISPUTE' : 'UPDATED_ORDER_STATUS';
  await audit(req.user, auditAction, 'Dispute', dispute.id, internalNotes);
  res.json({ dispute });
}));

// GET /api/admin/reports
router.get('/reports', asyncHandler(async (req, res) => {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: { reporter: { select: { id: true, name: true, email: true } } },
  });
  res.json({ reports });
}));

// POST /api/admin/reports/:id — resolve | dismiss
router.post('/reports/:id/:action', asyncHandler(async (req, res) => {
  const { action } = req.params;
  const { adminNotes } = req.body;
  if (!['resolve', 'dismiss'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  const report = await prisma.report.update({
    where: { id: req.params.id },
    data: { status: action === 'resolve' ? 'RESOLVED' : 'DISMISSED', adminNotes, resolvedAt: new Date() },
  });
  await audit(req.user, action === 'resolve' ? 'RESOLVED_REPORT' : 'DISMISSED_REPORT', 'Report', report.id, adminNotes);
  res.json({ report });
}));

// GET /api/admin/audit-logs
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ logs });
}));

export default router;