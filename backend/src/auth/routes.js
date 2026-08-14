import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/http.js';

/**
 * POST /api/auth/session
 * Called by the frontend after successful SuperTokens login.
 * Derives identity from the verified SuperTokens session, ensures a local
 * User row exists for it, then returns the user.
 */
export const sessionRouter = asyncHandler(async (req, res) => {
  const payload = req.session.getAccessTokenPayload();
  const stUserId = req.session.getUserId();

  const email = payload?.email || req.body?.email;
  if (!email) return res.status(400).json({ error: 'email is required' });

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: payload?.name || req.body?.name || email.split('@')[0] || 'Artist',
      },
    });
  }
  await prisma.user.update({ where: { id: user.id }, data: { supertokensId: stUserId } });
  res.json({ user });
});