require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
const { ensureAdmin } = require('./ensureAdmin');
const { initWebSocket } = require('./websocket');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Behind nginx / Cloudflare Flexible (X-Forwarded-* from proxy)
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

async function start() {
  await connectDB();
  await ensureAdmin();
  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`Digital Wall server running on http://localhost:${PORT}`);
    console.log(`  Submit : http://localhost:${PORT}/`);
    console.log(`  Display: http://localhost:${PORT}/display.html`);
    console.log(`  Admin  : http://localhost:${PORT}/admin.html`);
    console.log(`  WS     : ws://localhost:${PORT}/ws`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
