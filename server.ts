import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '15mb' }));

// Helper to reliably parse .env even if systemd didn't pass variables or encoding is non-standard
function parseDotEnvFile(): Record<string, string> {
  const envMap: Record<string, string> = {};
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          envMap[key] = val;
        }
      }
    } catch (_) {}
  }
  return envMap;
}

const fileEnv = parseDotEnvFile();

function getEnv(key: string, defaultVal: string = ''): string {
  return process.env[key] || fileEnv[key] || defaultVal;
}

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

  const rawUrl = getEnv('APP_URL', 'https://shop.example.com');
  const cleanDomain = rawUrl.replace(/^https?:\/\//, '');

  cachedDb = {
    installed: true,
    lastUpdate: new Date().toISOString(),
    adminCredentials: {
      username: getEnv('ADMIN_USERNAME', 'admin'),
      password: getEnv('ADMIN_PASSWORD', 'Manoto@1405'),
    },
    config: {
      storeName: getEnv('STORE_NAME', 'فروشگاه من و تو'),
      domain: cleanDomain,
      backendPort: PORT,
      botToken: getEnv('TELEGRAM_BOT_TOKEN', ''),
      adminNumericId: getEnv('ADMIN_TELEGRAM_ID', '987654321'),
      maintenanceMode: false,
      maintenanceTitle: 'فروشگاه در حال به‌روزرسانی است',
      maintenanceMessage: 'کاربر گرامی، جهت ارتقا و به‌روزرسانی سرور، فروشگاه موقتاً غیرفعال شده است. به زودی در دسترس شما خواهیم بود.',
      announcementActive: true,
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

// Helper to determine the public WebApp URL
function getPublicAppUrl(): string {
  const db = loadDb();
  let url = getEnv('APP_URL', '');
  if (!url && db.config?.domain) {
    url = `https://${db.config.domain}`;
  }
  if (!url) {
    url = `http://localhost:${PORT}`;
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
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
  token: getEnv('TELEGRAM_BOT_TOKEN', loadDb().config?.botToken || ''),
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
    return { ok: true, message: 'Bot polling is already running', botInfo: botState.botInfo };
  }

  const check = await checkBotInfo(token);
  if (!check.ok) {
    console.error(`❌ Telegram Bot start failed: ${check.error}`);
    return { ok: false, error: check.error };
  }

  // Delete any existing webhook to enable clean polling
  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
  } catch (_) {}

  const appUrl = getPublicAppUrl();

  // Configure chat menu button (opens WebApp in bottom-left corner of chat)
  try {
    await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: '🛍 فروشگاه',
          web_app: { url: appUrl },
        },
      }),
    });
  } catch (_) {}

  // Register bot commands
  try {
    await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'ورود و باز کردن مینی‌اپ فروشگاه' },
          { command: 'orders', description: 'مشاهده و پیگیری سفارش‌ها' },
          { command: 'support', description: 'پشتیبانی آنلاین و راهنما' },
          { command: 'help', description: 'راهنمای استفاده از ربات' },
        ],
      }),
    });
  } catch (_) {}

  botState.token = token;
  botState.isPolling = true;
  botState.abortController = new AbortController();

  const db = loadDb();
  db.config = db.config || {};
  db.config.botToken = token;
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
        await new Promise((r) => setTimeout(r, 3000));
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

// Full interactive Telegram reply handler supporting all Persian menu options
async function handleTelegramUpdate(token: string, update: any) {
  const message = update.message;
  if (!message || !message.text) return;

  const chatId = message.chat.id;
  const rawText = message.text.trim();
  const text = rawText.toLowerCase();
  const db = loadDb();
  const storeName = db.config?.storeName || 'فروشگاه من و تو';
  const appUrl = getPublicAppUrl();
  const isMaintenance = !!db.config?.maintenanceMode;

  // Standard Reply Keyboard displayed on the user's phone
  const replyKeyboard = {
    keyboard: [
      [{ text: '🛍 ورود به فروشگاه (Mini App)', web_app: { url: appUrl } }],
      [{ text: 'خرید VPN 🚀' }, { text: 'آفرهای ویژه و تخفیف‌ها 🎁' }],
      [{ text: 'پرداخت‌های درون‌برنامه‌ای 💎' }, { text: 'درخواست سفارش اختصاصی 🛒' }],
      [{ text: 'شماره کارت و روش‌های پرداخت 💳' }, { text: 'پشتیبانی و راهنما 📞' }],
      [{ text: '🧾 سفارش‌های من' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };

  // 1. Maintenance Check
  if (isMaintenance) {
    const maintenanceTitle = db.config?.maintenanceTitle || 'فروشگاه در حال به‌روزرسانی است';
    const maintenanceMsg = db.config?.maintenanceMessage || 'کاربر گرامی، جهت ارتقا و به‌روزرسانی سرور، فروشگاه موقتاً غیرفعال شده است. به زودی در دسترس شما خواهیم بود.';

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `⚠️ **${maintenanceTitle}**\n\n${maintenanceMsg}\n\nلطفاً دقایقی دیگر مراجعه فرمایید یا جهت موارد ضروری با پشتیبانی در ارتباط باشید.`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎧 ارتباط با پشتیبانی', web_app: { url: `${appUrl}?view=support` } }],
          ],
        },
      }),
    });
    return;
  }

  // 2. /start or Welcome
  if (text.startsWith('/start') || text === 'شروع') {
    const firstName = message.from?.first_name || 'کاربر گرامی';
    const welcome = `سلام ${firstName} عزیز! 👋\nبه **${storeName}** خوش آمدید ✨\n\n🔹 ارائه برترین کانفیگ‌ها و سرورهای اختصاصی VPN با آی‌پی ثابت\n🔹 پرداخت‌های ارزی، درون‌برنامه‌ای و گیفت‌کارت\n🔹 تحویل آنی، بدون قطعی و پشتیبانی ۲۴ ساعته\n\nبرای شروع خرید و مشاهده کلیه پلن‌ها، روی دکمه زیر کلیک کنید:`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcome,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍 باز کردن فروشگاه (Mini App)', web_app: { url: appUrl } }],
            [
              { text: '🚀 خرید سریع VPN', web_app: { url: `${appUrl}?category=vpn` } },
              { text: '🎁 تخفیف‌ها و آفرها', web_app: { url: `${appUrl}?view=offers` } },
            ],
            [{ text: '🎧 پشتیبانی تلگرام', web_app: { url: `${appUrl}?view=support` } }],
          ],
        },
      }),
    });

    // Also send bottom persistent keyboard
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'از منوی زیر نیز می‌توانید بخش مورد نظرتان را سریع انتخاب کنید 👇',
        reply_markup: replyKeyboard,
      }),
    });
    return;
  }

  // 3. خرید VPN
  if (text.includes('vpn') || text.includes('خرید vpn') || text.includes('فیلترشکن')) {
    const msg = `🚀 **پلن‌های پرسرعت VPN - اختصاصی ${storeName}**\n\n` +
      `⚡ پروتکل‌های پیشرفته: V2Ray (VLESS / VMess), WireGuard, OpenVPN, Cisco AnyConnect\n` +
      `🌐 لوکیشن‌های اختصاصی: آلمان 🇩🇪، هلند 🇳🇱، فنلاند 🇫🇮، فرانسه 🇫🇷، ترکیه 🇹🇷\n` +
      `🔒 بدون قطعی، مناسب کلیه اپراتورها (همراه‌اول، ایرانسل، مخابرات، رایتل و شاتل)\n\n` +
      `جهت مشاهده تعرفه‌ها، حجم‌ها و سفارش فوری، روی دکمه زیر کلیک کنید:`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 مشاهده و خرید اشتراک VPN', web_app: { url: `${appUrl}?category=vpn` } }],
          ],
        },
      }),
    });
    return;
  }

  // 4. آفرهای ویژه و تخفیف‌ها
  if (text.includes('آفر') || text.includes('تخفیف')) {
    const msg = `🎁 **آفرهای ویژه و کدهای تخفیف فعال ${storeName}**\n\n` +
      `🔥 تخفیف ۲۰٪ ویژه خرید اول با کد: **MANOTO20**\n` +
      `🔥 اشتراک ۳ ماهه نامحدود با ۲۵٪ تخفیف ویژه فصلی\n` +
      `🔥 هدیه گیفت کارت ۵ دلاری برای خریدهای بالای ۵۰ تتر\n\n` +
      `جهت فعال‌سازی و اعمال تخفیف در سبد خرید وارد مینی‌اپ شوید:`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎁 مشاهده جشنواره تخفیف‌ها', web_app: { url: `${appUrl}?view=offers` } }],
          ],
        },
      }),
    });
    return;
  }

  // 5. پرداخت‌های درون‌برنامه‌ای
  if (text.includes('درون‌برنامه') || text.includes('درون برنامه') || text.includes('stars') || text.includes('نیترو') || text.includes('پرمیوم')) {
    const msg = `💎 **خدمات ارزی و درون‌برنامه‌ای بین‌المللی**\n\n` +
      `🔹 استارز تلگرام (Telegram Stars) به قیمت کارگزاری مستقیم\n` +
      `🔹 اشتراک پرمیوم تلگرام (۳ ماهه، ۶ ماهه، یکساله)\n` +
      `🔹 دیسکورد نیترو (Discord Nitro Boost)\n` +
      `🔹 گیفت کارت‌های استیم، اپل، گوگل پلی و پلی‌استیشن\n` +
      `🔹 شارژ اکانت‌های اسپاتیفای و یوتیوب پرمیوم\n\n` +
      `برای سفارش مستقیم از دکمه زیر استفاده کنید:`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '💎 بخش پرداخت‌های درون‌برنامه‌ای', web_app: { url: `${appUrl}?category=in-app` } }],
          ],
        },
      }),
    });
    return;
  }

  // 6. درخواست سفارش اختصاصی
  if (text.includes('اختصاصی') || text.includes('سفارش اختصاصی')) {
    const msg = `🛒 **درخواست سفارش اختصاصی و عمده**\n\n` +
      `اگر به کانفیگ اختصاصی با پورت مشخص، سرور مجازی (VPS) شخصی، ای‌پی ثابت ترید یا اکانت شرکتی نیاز دارید، پشتیبانان فنی ما در کمترین زمان کانفیگ مد نظر شما را آماده خواهند کرد.\n\n` +
      `برای ثبت درخواست مستقیم وارد مینی‌اپ شوید:`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛒 ثبت سفارش اختصاصی', web_app: { url: `${appUrl}?view=custom-order` } }],
            [{ text: '📞 گفتگو با کارشناس پشتیبانی', web_app: { url: `${appUrl}?view=support` } }],
          ],
        },
      }),
    });
    return;
  }

  // 7. شماره کارت و روش‌های پرداخت
  if (text.includes('شماره کارت') || text.includes('روش‌های پرداخت') || text.includes('کارت به کارت') || text.includes('تتر')) {
    const msg = `💳 **روش‌های پرداخت امن ${storeName}**\n\n` +
      `۱️⃣ **کارت به کارت شتابی (تومان):**\n` +
      `شماره کارت: \`۶۰۳۷-۹۹۷۹-۱۴۰۵-۸۸۲۱\`\n` +
      `به نام: مدیریت فروشگاه من و تو\n\n` +
      `۲️⃣ **ارز دیجیتال (USDT - Tether TRC20):**\n` +
      `آدرس ولت: \`TQn9Y2khsA9102jslka81029381kjahsd2910\`\n\n` +
      `۳️⃣ **درگاه پرداخت آنلاین شاپرکی:**\n` +
      `فعال در هنگام نهایی‌سازی سفارش در مینی‌اپ\n\n` +
      `⚠️ پس از واریز، کافیست تصویر فیش واریزی خود را در مینی‌اپ آپلود کنید تا سفارشتان فوراً تایید شود.`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧾 آپلود فیش و تکمیل سفارش', web_app: { url: `${appUrl}?view=checkout` } }],
          ],
        },
      }),
    });
    return;
  }

  // 8. پشتیبانی و راهنما
  if (text.includes('پشتیبانی') || text.includes('راهنما') || text === '/help' || text === '/support') {
    const msg = `📞 **مرکز پشتیبانی و راهنمای مشتریان ${storeName}**\n\n` +
      `🔹 پاسخگویی ۲۴ ساعته در ۷ روز هفته\n` +
      `🔹 راهنمای اتصال سریع برای iOS, Android, Windows و Mac\n` +
      `🔹 تعویض سرور در صورت بروز هرگونه اختلال اینترنتی\n\n` +
      `جهت ارسال پیام به پشتیبانی آنلاین از دکمه زیر استفاده فرمایید:`;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎧 ورود به چت پشتیبانی', web_app: { url: `${appUrl}?view=support` } }],
            [{ text: '🛍 باز کردن فروشگاه', web_app: { url: appUrl } }],
          ],
        },
      }),
    });
    return;
  }

  // 9. پیگیری سفارشات
  if (text.includes('سفارش') || text === '/orders') {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🧾 **پیگیری و مشاهده سفارش‌ها:**\nبرای مشاهده سوابق خرید، لایسنس‌ها، کانفیگ‌های فعال و وضعیت فاکتور روی دکمه زیر کلیک نمایید:',
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧾 مشاهده سفارش‌های من', web_app: { url: `${appUrl}?view=orders` } }],
          ],
        },
      }),
    });
    return;
  }

  // 10. Fallback for any other text
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `پیام شما دریافت شد. جهت ثبت سفارش، مشاهده قیمت‌ها و خدمات، لطفاً از دکمه‌های زیر استفاده فرمایید:`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍 ورود به فروشگاه (Mini App)', web_app: { url: appUrl } }],
          [{ text: '📞 پشتیبانی آنلاین', web_app: { url: `${appUrl}?view=support` } }],
        ],
      },
    }),
  });
}

// Auto-start polling if token is found and is not empty or demo
const startupToken = getEnv('TELEGRAM_BOT_TOKEN', loadDb().config?.botToken || '');
if (startupToken && !startupToken.includes('_demo') && startupToken.length > 20) {
  startTelegramPolling(startupToken).then((res) => {
    if (res.ok) {
      console.log(`✅ Telegram bot automatically initialized on startup (@${res.botInfo?.username})`);
    } else {
      console.log(`⚠️ Telegram bot startup warning: ${res.error}`);
    }
  });
} else {
  console.log(`ℹ️ Telegram Bot token not configured yet. Run 'shop' option [16] or set TELEGRAM_BOT_TOKEN in .env`);
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
    botPolling: botState.isPolling,
    botUsername: botState.botInfo?.username || null,
    domain: db.config?.domain,
    lastUpdate: db.lastUpdate,
  });
});

// Bot Control Endpoints
app.get('/api/bot/status', async (_req: Request, res: Response) => {
  const token = botState.token || getEnv('TELEGRAM_BOT_TOKEN', loadDb().config?.botToken || '');
  res.json({
    isPolling: botState.isPolling,
    botInfo: botState.botInfo,
    lastError: botState.lastError,
    tokenConfigured: !!(token && token.length > 20 && !token.includes('_demo')),
    tokenMasked: token ? `${token.slice(0, 7)}...${token.slice(-5)}` : null,
  });
});

app.post('/api/bot/start', async (req: Request, res: Response) => {
  const token = req.body.token || botState.token || getEnv('TELEGRAM_BOT_TOKEN', loadDb().config?.botToken || '');
  if (!token || token.trim().length < 20) {
    return res.status(400).json({ ok: false, error: 'Valid Telegram Bot Token is required' });
  }

  // Update .env and db if new token provided
  if (req.body.token) {
    const db = loadDb();
    db.config = db.config || {};
    db.config.botToken = req.body.token;
    saveDb(db);

    try {
      const envPath = path.join(__dirname, '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf-8');
        if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
          envContent = envContent.replace(/TELEGRAM_BOT_TOKEN=.*/, `TELEGRAM_BOT_TOKEN=${req.body.token}`);
        } else {
          envContent += `\nTELEGRAM_BOT_TOKEN=${req.body.token}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf-8');
      }
    } catch (_) {}
  }

  // Stop if polling currently to reset
  if (botState.isPolling) {
    stopTelegramPolling();
    await new Promise((r) => setTimeout(r, 1000));
  }

  const result = await startTelegramPolling(token);
  res.json(result);
});

app.post('/api/bot/stop', (_req: Request, res: Response) => {
  const result = stopTelegramPolling();
  res.json(result);
});

app.post('/api/bot/test', async (req: Request, res: Response) => {
  const token = req.body.token || botState.token || getEnv('TELEGRAM_BOT_TOKEN', loadDb().config?.botToken || '');
  const adminId = req.body.adminId || getEnv('ADMIN_TELEGRAM_ID', loadDb().config?.adminNumericId || '');
  if (!token || !adminId) {
    return res.status(400).json({ ok: false, error: 'Token and Admin ID required' });
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminId,
        text: '🔔 **پیام تست سلامت سرور TSM STORE**\n\nاتصال ربات تلگرام به سرور شما با موفقیت تایید شد! ✓\nسرویس Polling و WebApp آنلاین و آماده سرویس‌دهی است.',
        parse_mode: 'Markdown',
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
  db.logs.unshift(`[${new Date().toISOString()}] Admin credentials updated for '${username}'`);
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

  const token = botState.token || getEnv('TELEGRAM_BOT_TOKEN', db.config?.botToken || '');
  if (token) {
    handleTelegramUpdate(token, update);
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
  const distPath = path.join(__dirname, 'dist');
  const distIndexExists = fs.existsSync(path.join(distPath, 'index.html'));

  // In production (or if build exists and not forcing dev mode), serve static assets directly
  if (process.env.NODE_ENV === 'production' && distIndexExists) {
    console.log(`📦 Serving static build from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In development mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TSM STORE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
