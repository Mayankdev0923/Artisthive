import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../utils/http.js';

/**
 * POST /api/auth/webhook/session
 * Called by the frontend after successful SuperTokens login.
 * Ensures a local User row exists for the SuperTokens user, then returns it.
 */
export const sessionRouter = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0] || 'Artist',
      },
    });
  }
  await prisma.user.update({ where: { id: user.id }, data: { supertokensId: req.stUserId || undefined } });
  res.json({ user });
});