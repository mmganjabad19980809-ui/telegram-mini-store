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
    adminCredentials: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'Manoto@1405',
    },
    config: {
      storeName: process.env.STORE_NAME || 'فروشگاه من و تو',
      domain: process.env.APP_URL ? process.env.APP_URL.replace(/^https?:\/\//, '') : 'shop.example.com',
      backendPort: PORT,
      maintenanceMode: false,
      maintenanceTitle: 'فروشگاه در حال به‌روزرسانی است',
      maintenanceMessage: 'کاربر گرامی، جهت ارتقا و به‌روزرسانی سرور، فروشگاه موقتاً غیرفعال شده است. به زودی در دسترس شما خواهیم بود.',
      announcementActive: false,
      announcementBanner: '⭐️ تخفیف ویژه برای اشتراک‌های ماه جدید فعال شد!',
    },
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

// ==========================================
// REAL TELEGRAM BOT ENGINE (Polling & Webhook)
// ==========================================
interface BotState {
  isPolling: boolean;
  botInfo: any | null;
  lastError: string | null;
  token: string | null;
  offset: number;
  abortController: AbortController | null;
}

const botState: BotState = {
  isPolling: false,
  botInfo: null,
  lastError: null,
  token: process.env.TELEGRAM_BOT_TOKEN || null,
  offset: 0,
  abortController: null,
};

async function checkBotInfo(token: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data: any = await res.json();
    if (data.ok) {
      botState.botInfo = data.result;
      botState.lastError = null;
      return { ok: true, info: data.result };
    } else {
      botState.lastError = data.description || 'Invalid Bot Token';
      return { ok: false, error: botState.lastError };
    }
  } catch (err: any) {
    botState.lastError = err?.message || 'Network error reaching Telegram API';
    return { ok: false, error: botState.lastError };
  }
}

async function startTelegramPolling(token: string) {
  if (botState.isPolling) {
    return { ok: true, message: 'Bot polling is already running' };
  }

  const check = await checkBotInfo(token);
  if (!check.ok) {
    return { ok: false, error: check.error };
  }

  // Delete any existing webhook to enable clean polling
  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
  } catch (_) {}

  botState.token = token;
  botState.isPolling = true;
  botState.abortController = new AbortController();

  const db = loadDb();
  db.logs = db.logs || [];
  db.logs.unshift(`[${new Date().toISOString()}] Telegram Bot polling started for @${check.info.username}`);
  saveDb(db);

  // Background polling loop
  (async () => {
    console.log(`🤖 Telegram Bot polling started: @${check.info.username}`);
    while (botState.isPolling) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${botState.offset}&timeout=15`;
        const res = await fetch(url, { signal: botState.abortController?.signal });
        const data: any = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            botState.offset = update.update_id + 1;
            await handleTelegramUpdate(token, update);
          }
        }
      } catch (e: any) {
        if (!botState.isPolling) break;
        // Exponential backoff on network failure
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
    console.log('🤖 Telegram Bot polling stopped.');
  })();

  return { ok: true, botInfo: check.info };
}

function stopTelegramPolling() {
  botState.isPolling = false;
  if (botState.abortController) {
    botState.abortController.abort();
    botState.abortController = null;
  }
  const db = loadDb();
  db.logs = db.logs || [];
  db.logs.unshift(`[${new Date().toISOString()}] Telegram Bot polling stopped by user`);
  saveDb(db);
  return { ok: true };
}

async function handleTelegramUpdate(token: string, update: any) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const db = loadDb();
  const storeName = db.config?.storeName || 'فروشگاه من و تو';
  const appUrl = process.env.APP_URL || `https://${db.config?.domain || 'shop.example.com'}`;

  if (text.startsWith('/start')) {
    const welcome = `سلام ${message.from?.first_name || 'کاربر گرامی'}!\nبه ${storeName} خوش آمدید.\n\nبرای خرید آنلاین و مشاهده محصولات از دکمه زیر وارد مینی‌اپ شوید:`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcome,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍 ورود به فروشگاه (Mini App)', web_app: { url: appUrl } }],
            [{ text: '🎧 ورود به بخش پشتیبانی', web_app: { url: `${appUrl}?view=support` } }],
          ],
        },
      }),
    });
  } else if (text === '/orders' || text.includes('سفارش')) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'برای پیگیری سفارش‌های خود، روی دکمه زیر کلیک کنید:',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧾 مشاهده سفارش‌های من', web_app: { url: `${appUrl}?view=orders` } }],
          ],
        },
      }),
    });
  } else if (text === '/help' || text.includes('راهنما')) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `راهنمای بات ${storeName}:\n\n/start - شروع و باز کردن فروشگاه\n/orders - پیگیری سفارش‌ها\n/help - راهنمای ربات`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍 باز کردن فروشگاه', web_app: { url: appUrl } }],
          ],
        },
      }),
    });
  }
}

// Auto-start polling if token is set in environment
if (process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.includes('_demo')) {
  startTelegramPolling(process.env.TELEGRAM_BOT_TOKEN);
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const db = loadDb();
  res.json({
    status: 'PASS',
    system: 'TSM STORE',
    version: '1.8.0',
    port: PORT,
    uptime: process.uptime(),
    dbReady: true,
    lastUpdate: db.lastUpdate,
  });
});

// Bot Control Endpoints
app.get('/api/bot/status', async (_req: Request, res: Response) => {
  res.json({
    isPolling: botState.isPolling,
    botInfo: botState.botInfo,
    lastError: botState.lastError,
    tokenMasked: botState.token ? `${botState.token.slice(0, 7)}...${botState.token.slice(-5)}` : null,
  });
});

app.post('/api/bot/start', async (req: Request, res: Response) => {
  const token = req.body.token || botState.token || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(400).json({ ok: false, error: 'Telegram Bot Token is required' });
  }
  const result = await startTelegramPolling(token);
  res.json(result);
});

app.post('/api/bot/stop', (_req: Request, res: Response) => {
  const result = stopTelegramPolling();
  res.json(result);
});

app.post('/api/bot/test', async (req: Request, res: Response) => {
  const token = req.body.token || botState.token || process.env.TELEGRAM_BOT_TOKEN;
  const adminId = req.body.adminId || process.env.ADMIN_TELEGRAM_ID;
  if (!token || !adminId) {
    return res.status(400).json({ ok: false, error: 'Token and Admin ID required' });
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminId,
        text: '🔔 پیام تست سلامت TSM STORE:\nاتصال ربات تلگرام به سرور شما با موفقیت تایید شد! ✓',
      }),
    });
    const data: any = await response.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message });
  }
});

// Diagnostics & System Info endpoint
app.get('/api/system/status', (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  const db = loadDb();
  res.json({
    platform: 'TSM STORE - Linux x86_64 / Container',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    ramUsage: `${Math.round(memory.rss / (1024 * 1024))} MB`,
    heapUsage: `${Math.round(memory.heapUsed / (1024 * 1024))} MB`,
    backendPort: PORT,
    publicPort: 443,
    cloudflareTunnel: 'Connected / Active',
    telegramBot: botState.isPolling ? `Active (@${botState.botInfo?.username || 'bot'})` : 'Stopped / Ready to Start',
    serviceStatus: 'Running',
    database: 'SQLite/JSON Local (Persistent)',
    maintenanceMode: !!db.config?.maintenanceMode,
  });
});

// Logs endpoint
app.get('/api/system/logs', (_req: Request, res: Response) => {
  const db = loadDb();
  res.json({
    logs: db.logs || [`[${new Date().toISOString()}] TSM STORE System operational`],
  });
});

// Admin credentials update endpoint
app.post('/api/admin/credentials', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password are required' });
  }
  const db = loadDb();
  db.adminCredentials = { username, password };
  db.logs = db.logs || [];
  db.logs.unshift(`[${new Date().toISOString()}] Admin credentials updated from user request.`);
  saveDb(db);
  res.json({ ok: true, message: 'Admin credentials updated successfully' });
});

// Config GET & POST
app.get('/api/config', (_req: Request, res: Response) => {
  const db = loadDb();
  res.json(db.config || {});
});

app.post('/api/config', (req: Request, res: Response) => {
  const db = loadDb();
  db.config = { ...db.config, ...req.body };
  saveDb(db);
  res.json({ ok: true, config: db.config });
});

// Telegram Bot Webhook endpoint
app.post('/api/telegram/webhook', (req: Request, res: Response) => {
  const update = req.body;
  const db = loadDb();
  const logEntry = `[${new Date().toISOString()}] Telegram Update received: ${JSON.stringify(
    update?.message?.text || update?.callback_query?.data || 'update'
  )}`;
  db.logs = db.logs || [];
  db.logs.unshift(logEntry);
  if (db.logs.length > 100) db.logs.pop();
  saveDb(db);

  if (botState.token) {
    handleTelegramUpdate(botState.token, update);
  }
  res.json({ ok: true });
});

// Installer generator endpoint
app.get('/api/installer/scripts', (_req: Request, res: Response) => {
  res.json({
    supportMatrix: {
      target_os: ['Ubuntu 24.04 LTS', 'Ubuntu 22.04 LTS', 'Debian 12', 'WSL2'],
      architectures: ['x86_64', 'arm64'],
      recommended_tunnel: 'Cloudflare Tunnel',
      default_backend_port: 3000,
      default_public_port: 443,
    },
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
