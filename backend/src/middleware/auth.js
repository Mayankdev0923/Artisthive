import { verifySession } from '../auth/supertokens.js';
import { prisma } from '../config/prisma.js';

/**
 * Require a valid SuperTokens session.
 * Attaches req.session (userId) and the local DB user as req.user.
 */
export function requireAuth(req, res, next) {
  return verifySession()(req, res, async (err) => {
    if (err) return next(err);
    const stUserId = req.session.getUserId();
    const user = await prisma.user.findUnique({ where: { supertokensId: stUserId } });
    if (!user) return res.status(401).json({ error: 'Local user not found. Complete profile setup first.' });
    req.stUserId = stUserId;
    req.user = user;
    next();
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export const requireAdmin = requireRole('ADMIN');