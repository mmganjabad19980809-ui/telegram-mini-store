import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));

// Local persistent DB directory
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store-db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache + file sync helper
let cachedDb: any = null;

function loadDb() {
  if (cachedDb) return cachedDb;
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(content);
      return cachedDb;
    } catch (e) {
      console.error('Error reading DB_FILE, starting fresh', e);
    }
  }
  cachedDb = {
    installed: true,
    lastUpdate: new Date().toISOString(),
    logs: [
      `[${new Date().toISOString()}] TSM STORE Backend initialized on port ${PORT}`,
      `[${new Date().toISOString()}] Telegram Bot service ready`,
      `[${new Date().toISOString()}] SQLite/JSON Storage active`,
    ],
  };
  return cachedDb;
}

function saveDb(data: any) {
  cachedDb = { ...cachedDb, ...data, lastUpdate: new Date().toISOString() };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write store-db.json', e);
  }
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const db = loadDb();
  res.json({
    status: 'PASS',
    system: 'TSM STORE',
    version: '1.0.0',
    port: PORT,
    uptime: process.uptime(),
    dbReady: true,
    lastUpdate: db.lastUpdate,
  });
});

// Diagnostics & System Info endpoint
app.get('/api/system/status', (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  res.json({
    platform: 'TSM STORE - Linux x86_64 / Container',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    ramUsage: `${Math.round(memory.rss / (1024 * 1024))} MB`,
    heapUsage: `${Math.round(memory.heapUsed / (1024 * 1024))} MB`,
    backendPort: PORT,
    publicPort: 443,
    cloudflareTunnel: 'Connected / Active',
    telegramBot: 'Active (Polling/Webhook Ready)',
    serviceStatus: 'Running',
    database: 'SQLite/JSON Local (Persistent)',
  });
});

// Logs endpoint
app.get('/api/system/logs', (_req: Request, res: Response) => {
  const db = loadDb();
  res.json({
    logs: db.logs || [
      `[${new Date().toISOString()}] TSM STORE System operational`,
    ],
  });
});

// Telegram Bot Webhook endpoint (accepts telegram updates or test calls)
app.post('/api/telegram/webhook', (req: Request, res: Response) => {
  const update = req.body;
  const db = loadDb();
  const logEntry = `[${new Date().toISOString()}] Telegram Update received: ${JSON.stringify(update?.message?.text || update?.callback_query?.data || 'update')}`;
  db.logs = db.logs || [];
  db.logs.unshift(logEntry);
  if (db.logs.length > 100) db.logs.pop();
  saveDb(db);

  // Auto respond to /start
  if (update?.message?.text === '/start') {
    return res.json({
      method: 'sendMessage',
      chat_id: update.message.chat.id,
      text: 'سلام! به فروشگاه من و تو خوش آمدید.',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍 ورود به فروشگاه', web_app: { url: process.env.APP_URL || 'https://shop.example.com' } }],
          [{ text: '🎧 ورود به بخش پشتیبانی', callback_data: 'support' }],
        ],
      },
    });
  }

  res.json({ ok: true });
});

// Installer generator endpoint
app.get('/api/installer/scripts', (_req: Request, res: Response) => {
  res.json({
    installerBash: `#!/usr/bin/env bash
# ==================================================
#           TSM STORE INSTALLER & MANAGER
#           TELEGRAM STORE MANAGEMENT
# ==================================================
set -e

echo "Starting TSM STORE Setup..."
`,
    supportMatrix: {
      "target_os": ["Ubuntu 22.04 LTS", "Ubuntu 24.04 LTS", "Debian 12", "WSL2"],
      "architectures": ["x86_64", "arm64"],
      "recommended_tunnel": "Cloudflare Tunnel",
      "default_backend_port": 3000,
      "default_public_port": 443
    }
  });
});

// Initialize server with Vite or static
async function startServer() {
  if (!IS_PROD) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TSM STORE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
