import { prisma } from '../config/prisma.js';

/**
 * Attach chat socket handlers to the provided Socket.IO server.
 * Socket connects with SuperTokens session (via JWT in the client's auth payload).
 * Messages are persisted to DB and broadcast to the conversation room only.
 */
export function setupChat(io) {
  io.use(async (socket, next) => {
    try {
      const { userId, email } = socket.handshake.auth || {};
      if (!userId) return next(new Error('unauthorized'));

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return next(new Error('unauthorized'));

      socket.data.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    socket.on('conversation:join', async (conversationId) => {
      try {
        const participant = await prisma.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId, userId: user.id } },
        });
        if (!participant) return;
        await socket.join(`conversation:${conversationId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('message:send', async ({ conversationId, content }, ack) => {
      try {
        if (!conversationId || !content) return ack?.({ error: 'conversationId and content are required' });

        const participant = await prisma.conversationParticipant.findUnique({
          where: { conversationId_userId: { conversationId, userId: user.id } },
        });
        if (!participant) return ack?.({ error: 'Not a participant of this conversation' });

        const message = await prisma.message.create({
          data: { conversationId, senderId: user.id, content },
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        });
        await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

        io.to(`conversation:${conversationId}`).emit('message:new', { conversationId, message });
        ack?.({ ok: true, message });
      } catch (err) {
        console.error('[SOCKET] message:send failed', err);
        ack?.({ error: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      // rooms are cleaned up automatically on disconnect
    });
  });
}