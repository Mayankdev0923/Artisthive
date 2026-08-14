import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { middleware as stMiddleware, errorHandler as stErrorHandler } from 'supertokens-node/framework/express';
import { config } from './config/index.js';
import { prisma } from './config/prisma.js';
import { notFound, errorHandler } from './utils/http.js';
import { sessionRouter } from './auth/routes.js';
import usersRouter from './users/routes.js';
import artistsRouter from './artists/routes.js';
import postsRouter from './posts/routes.js';
import appreciationsRouter from './posts/appreciations.js';
import followsRouter from './follows/routes.js';
import searchRouter from './search/routes.js';
import productsRouter from './products/routes.js';
import bookingsRouter from './bookings/routes.js';
import ordersRouter from './orders/routes.js';
import disputesRouter from './disputes/routes.js';
import reportsRouter from './reports/routes.js';
import notificationsRouter from './notifications/routes.js';
import chatRouter from './chat/routes.js';
import adminRouter from './admin/routes.js';
import { setupChat } from './chat/socket.js';
import { verifySession } from './auth/supertokens.js';
import supertokens from 'supertokens-node';

import './auth/supertokens.js';

const app = express();

app.use(
  cors({
    origin: config.corsOrigins,
    allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
    credentials: true,
  })
);

app.use(express.json());

app.use(stMiddleware());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Media static serving (local disk storage)
import path from 'path';
import fs from 'fs';
const mediaDir = path.resolve(config.media.dir);
fs.mkdirSync(mediaDir, { recursive: true });
app.use('/media', express.static(mediaDir));

// Local user provisioning after SuperTokens login
app.post('/api/auth/session', verifySession(), async (req, res, next) => {
  try {
    req.stUserId = req.session.getUserId();
    await sessionRouter(req, res, next);
  } catch (err) {
    next(err);
  }
});

app.use('/api/users', usersRouter);
app.use('/api/artists', artistsRouter);
app.use('/api/posts', postsRouter);
app.use('/api/posts', appreciationsRouter);
app.use('/api/follows', followsRouter);
app.use('/api/search', searchRouter);
app.use('/api/products', productsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/disputes', disputesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/conversations', chatRouter);
app.use('/api/admin', adminRouter);

app.use(stErrorHandler());
app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
  },
});
setupChat(io);

async function start() {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Failed to connect to DB:', err.message);
  }

  server.listen(config.port, () => {
    console.log(`API listening on http://localhost:${config.port}`);
  });
}

start();