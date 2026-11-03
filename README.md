# 🛍 پلتفرم فروشگاهی تلگرام TSM STORE (نسخه من و تو v18)

> **TSM STORE (Telegram Store Management)** — پلتفرم جامع و یکپارچه ساخت فروشگاه آنلاین، ربات تلگرام، مینی‌اپ اختصاصی (Telegram Mini App)، پنل مدیریت پیشرفته، فرم‌ساز پویا و نصاب خودکار سرور لینوکس.

![TSM STORE](https://img.shields.io/badge/Node.js-v22%20LTS-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-v19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue?style=for-the-badge&logo=typescript)
![Telegram](https://img.shields.io/badge/Telegram-Mini%20App%20%26%20Bot-blue?style=for-the-badge&logo=telegram)
![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04%20%7C%2024.04-orange?style=for-the-badge&logo=ubuntu)

---

## ⚡️ ۱. دستور نصب سریع تک‌خطی روی سرور (One-Line Quick Install)

کافیست وارد ترمینال سرور لینوکس (Ubuntu / Debian / VPS) خود شوید و دستور زیر را با دسترسی `root` یا `sudo` اجرا کنید:

```bash
curl -fsSL https://raw.githubusercontent.com/mmganjabad19980809-ui/telegram-mini-store/main/install.sh | sudo bash
```

یا با استفاده از روش کلون مستقیم گیت:

```bash
git clone https://github.com/mmganjabad19980809-ui/telegram-mini-store.git /opt/tsm-store
cd /opt/tsm-store
sudo bash install.sh
```

---

## 💻 ۲. منوی تعاملی خط فرمان ترمینال (`shop` CLI)

پس از نصب، دستور سراسری `shop` در سرور شما فعال می‌شود. با نوشتن `shop` در هر کجای ترمینال، منوی اصلی TSM STORE اجرا خواهد شد:

```text
==================================================
                  TSM STORE
           TELEGRAM STORE MANAGEMENT
==================================================

SYSTEM INFORMATION
Domain       : shop.example.com
SSL          : Active
Telegram Bot : Connected
Service      : Running
Backend Port : 3000
Public HTTPS : 443
Disk         : 14.2 GB / 40 GB (35% used)
RAM          : 482 MB / 2048 MB (24% used)
==================================================

MAIN SYSTEM MENU
[01] Install New Store       - Nasb Forooshgah
[02] Update Store            - Be-rooz-resani
[03] Repair Installation     - Tamir va Bazsazi
[04] Uninstall Store         - Hazf Barnamé
[05] Start Store             - Shorooe Service
[06] Stop Store              - Tavaghof Service
[07] Restart Store           - Rah-andazi Mojadad
[08] Service Status          - Vaziate Service
[09] Backup & Restore        - Backup va Bazgardani
[10] Manage SSL & Domain     - Modiriate SSL va Domain
[11] Edit Settings           - Virayeshe Tanzimat
[12] Admin Credentials       - Taghyire Ramze Modir
[13] View Application Logs   - Log Haye Barnamé
[14] System Diagnostics      - Barresi System
[15] GitHub Information      - Etelaate GitHub
[00] Exit                    - Khorooj

Select option:
```

### دستورات سریع ترمینال:

| دستور | عملکرد |
| :--- | :--- |
| `shop menu` | باز کردن منوی تعاملی مدیریتی |
| `shop status` | بررسی وضعیت سرویس systemd فروشگاه |
| `shop restart` | راه‌اندازی مجدد سرویس و بک‌اند |
| `shop logs` | مشاهده لاگ‌های زنده برنامه |
| `shop doctor` | اجرای تست عیب‌یابی و ماتریس تست سیستم |
| `shop backup` | تهیه نسخه پشتیبان آنی از دیتابیس و تنظیمات |
| `shop update` | دریافت آخرین آپدیت‌ها از گیت‌هاب و بیلد خودکار |

---

## 🚀 ۳. آموزش گام‌به‌گام راه‌اندازی دستی در سرور (Manual Setup)

اگر می‌خواهید مراحل را به‌صورت دستی و قدم‌به‌قدم روی سرور پیش ببرید:

### مرحله ۱: نصب پیش‌نیازها
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git jq build-essential
```

### مرحله ۲: نصب Node.js نسخه ۲۲ LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # خروجی باید v22.x باشد
npm -v
```

### مرحله ۳: کلون مخزن و نصب پکیج‌ها
```bash
sudo git clone https://github.com/mmganjabad19980809-ui/telegram-mini-store.git /opt/tsm-store
cd /opt/tsm-store
npm install --legacy-peer-deps
npm run build
```

### مرحله ۴: تنظیم فایل محیطی (.env)
```bash
cp .env.example .env
nano .env
```
مقادیر زیر را وارد کنید:
```env
PORT=3000
APP_URL=https://shop.yourdomain.com
STORE_NAME=فروشگاه من و تو
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_FROM_BOTFATHER
ADMIN_TELEGRAM_ID=YOUR_NUMERIC_TELEGRAM_ID
NODE_ENV=production
```

### مرحله ۵: اجرای سرویس دائمی با Systemd
```bash
sudo cp scripts/tsm-store.service /etc/systemd/system/tsm-store.service
sudo systemctl daemon-reload
sudo systemctl enable tsm-store
sudo systemctl start tsm-store
sudo systemctl status tsm-store
```

---

## 🤖 ۴. آموزش اتصال به ربات تلگرام و ساخت Mini App

برای اینکه فروشگاه شما مستقیماً داخل تلگرام باز شود:

1. وارد اکانت رسمی [@BotFather](https://t.me/BotFather) در تلگرام شوید.
2. دستور `/newbot` را ارسال کنید، نام نمایشی و یوزرنیم بات خود را انتخاب کنید (مثلاً `MyManotoStoreBot`).
3. توکن دریافتی (API Token) را در فایل `.env` یا در پنل مدیریت فروشگاه وارد کنید.
4. دستور `/newapp` را در @BotFather بفرستید:
   - ربات مورد نظر را انتخاب کنید.
   - یک عنوان و توضیحات برای مینی‌اپ بنویسید.
   - یک تصویر شاخص (Thumbnail با ابعاد 640x360) ارسال کنید.
   - **آدرس WebApp URL را برابر با دامنهٔ فروشگاه خود قرار دهید:**  
     `https://shop.yourdomain.com`
   - یک نام کوتاه (Short name) مانند `shop` انتخاب کنید.
5. لینک مینی‌اپ شما آماده است: `https://t.me/MyManotoStoreBot/shop`
6. همچنین برای تنظیم دکمه منوی ثابت ربات، دستور `/setmenubutton` را در BotFather بزنید، دکمه را روی WebApp بگذارید و لینک بالا را وارد کنید.

---

## 🌐 ۵. اتصال دامنه و کلودفلر تانل (Cloudflare Tunnel)

روش پیشنهادی برای استقرار با بالاترین امنیت بدون نیاز به باز کردن پورت‌های ورودی سرور:

1. نصب `cloudflared` روی سرور:
   ```bash
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   ```
2. لاگین به حساب کلودفلر:
   ```bash
   cloudflared tunnel login
   ```
3. ساخت تانل:
   ```bash
   cloudflared tunnel create tsm-tunnel
   ```
4. مسیردهی تانل به پورت محلی ۳۰۰۰ فروشگاه:
   ```yaml
   # ~/.cloudflared/config.yml
   tunnel: <TUNNEL_UUID>
   credentials-file: /root/.cloudflared/<TUNNEL_UUID>.json

   ingress:
     - hostname: shop.yourdomain.com
       service: http://127.0.0.1:3000
     - service: http_status:404
   ```
5. ثبت رکورد DNS در کلودفلر و اجرای سرویس:
   ```bash
   cloudflared tunnel route dns tsm-tunnel shop.yourdomain.com
   sudo cloudflared service install
   sudo systemctl start cloudflared
   ```

---

## 🔐 ۶. ورود به پنل مدیریت فروشگاه

* **روش ورود:**  
  روی آیکون چرخ‌دنده (⚙️) در بالای مینی‌اپ کلیک کنید، یا کلید میانبر **`Alt + A`** را در کیبورد فشار دهید.
* **رمز عبور پیش‌فرض مدیریت:**
  ```text
  Manoto@1405
  ```
* **سؤال و پاسخ محرمانه بازیابی رمز عبور:**
  * سؤال: `عبارت محرمانهٔ بازیابی فروشگاه چیست؟`
  * پاسخ: `Sormeh!Narenj-84_Qamar#731`
* *توصیه امنیتی: پس از اولین ورود، رمز عبور را از منوی مدیریت به رمز شخصی و پیچیده تغییر دهید.*

---

## 🎧 ۷. راهنمای کامل پشتیبانی و تیکت‌ها (مخصوص مشتریان و مدیران)

سیستم پشتیبانی TSM STORE به گونه‌ای طراحی شده که مشتری بدون سردرگمی بتواند مشکلات سفارش یا سوالات قبل از خرید خود را مطرح کند و مدیر فروشگاه به‌صورت آنی پاسخ دهد.

### الف) نحوه ارسال تیکت توسط مشتری
1. در هدر مینی‌اپ روی آیکون هدفون (🎧 **پشتیبانی**) کلیک کنید.
2. فرم ایجاد تیکت باز می‌شود:
   - **نام و نام خانوادگی:** نام مشتری
   - **آیدی تلگرام:** مثلاً `@username` (جهت پیگیری و ارسال پاسخ در تلگرام)
   - **موضوع تیکت:** عنوان سوال (مثلاً: *راهنمایی فعال‌سازی اشتراک ChatGPT* یا *عدم اتصال کانفیگ VPN*)
   - **متن پیام:** شرح کامل مشکل یا سوال
3. روی دکمهٔ **«ارسال تیکت به پشتیبانی»** کلیک کنید. تیکت دارای شناسه یکتای اختصاصی (مانند `TCK-201`) خواهد شد.
4. مشتری می‌تواند در همان صفحه، تاریخچه پیام‌ها و پاسخ‌های ارسالی ادمین را مشاهده کند.

### ب) نحوه مدیریت و پاسخ‌دهی به تیکت‌ها توسط مدیر فروشگاه
1. با کلید میانبر `Alt + A` یا آیکون ⚙️ وارد پنل مدیریت شوید.
2. از منوی کناری، روی گزینه **«💬 پشتیبانی»** کلیک کنید.
3. فهرست تمامی تیکت‌ها همراه با وضعیت (در انتظار پاسخ / پاسخ داده شده)، مشخصات مشتری و متن پیام‌ها نمایش داده می‌شود.
4. در کادر زیر هر تیکت، متن پاسخ را تایپ کرده و دکمه **«ارسال پاسخ»** را بزنید.
5. وضعیت تیکت به‌صورت خودکار به «پاسخ داده شده» تغییر می‌کند و مشتری در صفحه مینی‌اپ خود پاسخ را مشاهده خواهد کرد.

### ج) پشتیبانی در چت ربات تلگرام
* مشتری در صفحه چت ربات تلگرام می‌تواند با زدن دکمه اینلاین **«🎧 ورود به بخش پشتیبانی»** یا ارسال متن، مستقیماً وارد جریان پشتیبانی شود.

---

## 🚧 ۸. آموزش بستن موقت فروشگاه (حالت تعمیرات) و ارسال نوتیفیکیشن به مشتریان

مدیر فروشگاه هر زمان که نیاز به ارتقای سرور یا ثبت محصولات داشته باشد، می‌تواند دسترسی مشتریان را بدون قطعی سرور متوقف کند:

1. با کلید میانبر **`Alt + A`** وارد پنل مدیریت شوید.
2. در بالای داشبورد، کادر **«کنترل دسترسی و باز/بسته بودن فروشگاه»** قرار دارد.
3. با کلیک روی دکمه **«⛔ بستن فروشگاه (تعمیرات)»**:
   * فروشگاه به حالت تعلیق درمی‌آید.
   * به مشتریان صفحهٔ شیک و اطلاع‌رسانی با متن *«فروشگاه در حال به‌روزرسانی است»* نمایش داده می‌شود و امکان ثبت سفارش نخواهند داشت.
   * پیگیری سفارشات قبلی و ارسال تیکت پشتیبانی برای مشتریان همچنان در دسترس است.
4. **ارسال نوتیفیکیشن / اطلاعیه بالای صفحه:**
   * در همان کادر داشبورد، می‌توانید متن دلخواه (مانند: *«تخفیف ویژه آغاز شد»* یا *«سفارشات تحویل آنی شدند»*) را تایپ کرده و تیک **«نمایش نوتیف»** را فعال کنید تا بنر اعلان در بالای فروشگاه برای تمام کاربران نمایش داده شود.
5. برای بازگشایی مجدد، کافیست دکمه سبز رنگ **«✓ بازگشایی و فعال‌سازی فروشگاه»** را بزنید.

---

## 🤖 ۹. دستورات اختصاصی استارت و مدیریت ربات تلگرام در سرور

برای اینکه ربات رسمی تلگرام شما به‌صورت خودکار و ۲۴ ساعته پاسخ‌دهی داشته باشد:

```bash
# استارت و راه‌اندازی زنده ربات در پس‌زمینه
shop bot start

# بررسی وضعیت اتصال ربات
shop bot status

# توقف سرویس ربات
shop bot stop
```

همچنین می‌توانید از داخل پنل مدیریت، بخش **«🤖 تنظیمات ربات»** دکمه‌های زنده **«▶️ استارت و راه‌اندازی ربات در تلگرام»** و **«🔔 ارسال پیام تست به تلگرام من»** را کلیک کنید تا از اتصال ربات مطمئن شوید.

---

## 🛠 ۱۰. آموزش رفع خطای بازسازی (Fix Repair ERESOLVE)

اگر قبلاً هنگام زدن گزینه `[03] Repair Installation` در ترمینال با خطای `npm error ERESOLVE` مربوط به esbuild مواجه شدید، این مورد با حذف وابستگی متناقض و استفاده از فلگ `--legacy-peer-deps` به طور کامل برطرف شده است:

```bash
shop repair
```
این دستور به‌طور خودکار کش npm را پاک کرده، پکیج‌ها را بدون تداخل نصب می‌کند، پروژه را بیلد مجدد کرده و سرویس فروشگاه را راه‌اندازی مجدد می‌نماید.

```text
├── install.sh             # اسکریپت نصاب خودکار سرور لینوکس
├── shop                   # دستور CLI خط فرمان ترمینال برای مدیریت TSM STORE
├── update.sh              # اسکریپت آپدیت خودکار
├── doctor.sh              # اسکریپت عیب‌یابی و تست سلامت
├── backup.sh              # اسکریپت بکاپ‌گیری از دیتابیس
├── restore.sh             # اسکریپت بازگردانی بکاپ
├── support-matrix.json    # ماتریس سیستم‌عامل‌های پشتیبانی‌شده
├── server.ts              # سرور فول‌استک Express و API
├── index.html             # نقطه ورود مینی‌اپ به زبان فارسی و RTL
├── src/
│   ├── App.tsx            # کامپوننت اصلی و روتینگ نماها
│   ├── components/
│   │   ├── CustomerStore.tsx       # مینی‌اپ فروشگاه قالب من و تو v18
│   │   ├── AdminPanel.tsx          # پنل مدیریت جامع و احراز هویت
│   │   ├── TelegramBotSimulator.tsx # شبیه‌ساز چت و وب‌ویو ربات تلگرام
│   │   ├── ServerInstallerCli.tsx  # شبیه‌ساز و رابط ترمینال TSM STORE
│   │   └── HeaderNav.tsx           # منوی سوئیچ بین حالت‌ها
│   ├── types/store.ts     # تعاریف داده، محصول، سفارش و تنظیمات
│   ├── data/initialData.ts # اطلاعات اولیه محصولات، پلن‌ها و سفارشات
│   └── services/storeStorage.ts # سیستم مدیریت داده محلی و دیتابیس
└── metadata.json          # متادیتا و تنظیمات پلتفرم
```

---

## 🔍 ۱۱. راهنمای حل مشکلات و خطاهای متداول (Troubleshooting & FAQ)

### ۱. چرا ربات در تلگرام به پیام‌ها یا /start پاسخ نمی‌داد؟
* **علت:** متغیرهای فایل `.env` به درستی در پروسه systemd لود نشده بودند یا ربات استارت نشده بود. همچنین پیام‌های منوی فارسی (مثل «خرید VPN»، «آفرهای ویژه»، «شماره کارت») نیاز به پردازشگر پیام متنی داشتند.
* **راه حل:** 
  ۱. با دستور `shop` وارد منو شوید و گزینه `[16] Telegram Bot Manager` را بزنید.
  ۲. گزینه `[3]` را انتخاب کرده و توکن دریافتی از BotFather را وارد کنید.
  ۳. سپس با گزینه `[1] Start Telegram Bot Polling` ربات را استارت کنید یا دستور مستقیم زیر را بزنید:
  ```bash
  shop bot start
  ```
  ربات بلافاصله هم دکمه‌های متنی کیبورد و هم دکمه WebApp باز کردن مینی‌اپ را ارسال خواهد کرد.

### ۲. چرا در مینی‌اپ خطای `Oops... Failed to load - net::ERR_CONNECTION_CLOSED` نمایش داده می‌شد؟
* **علت:** تلگرام فقط و فقط دامنه‌های دارای **SSL معتبر (HTTPS)** را برای مینی‌اپ قبول می‌کند. اگر دامنه `shop.example.com` یا آی‌پی خام بدون SSL تنظیم شده باشد، تلگرام اتصال را می‌بندد (`ERR_CONNECTION_CLOSED`).
* **راه حل:**
  * یک دامنه واقعی متصل به کلودفلر (Cloudflare) با SSL فعال (حالت Full یا Flexible) تنظیم کنید.
  * یا از **Cloudflare Tunnel (cloudflared)** رایگان استفاده کنید:
    ```bash
    # نصب کلودفلر تانل رایگان روی سرور
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    cloudflared tunnel --url http://localhost:3000
    ```
    آدرس اینترنتی `https://...trycloudflare.com` را کپی کرده و در گزینه `[10]` دستور `shop` وارد کنید و در BotFather به عنوان WebApp URL ست کنید.

### ۳. نحوه بستن یا باز کردن فروشگاه و نمایش اعلان تعمیرات (Maintenance Mode):
* در ترمینال سرور: دستور `shop` -> گزینه `[11] Edit Store Settings` -> گزینه `[2] Toggle Maintenance Mode` -> فعال یا غیرفعال‌سازی با پیام دلخواه.
* در پنل مدیریت تحت وب: تب **«تنظیمات فروشگاه»** -> بخش **«حالت تعمیرات و به‌روزرسانی»** -> سوئیچ را روشن یا خاموش کنید.

### ۴. نحوه اعمال این آپدیت‌ها در سرور فعلی شما:
کافیست در سرور دستورات زیر را وارد نمایید:
```bash
cd /opt/tsm-store
git pull origin main
shop repair
```

---

## 🛡️ ۱۲. ویژگی‌های امنیتی

* کنترل دسترسی ادمین با اعتبارسنجی دو مرحله‌ای و آیدی تلگرام.
* پنهان‌سازی توکن بات تلگرام و پسوردها در رابط ترمینال.
* پورت داخلی Backend (پیش‌فرض ۳۰۰۰) فقط روی `127.0.0.1` گوش می‌دهد و مستقیماً روی اینترنت باز نیست.
* پشتیبانی کامل از اتصال امن HTTPS و Cloudflare Tunnel با مسدود کردن دسترسی مستقیم به آی‌پی مبدا.

---

**توسعه داده شده برای پلتفرم TSM STORE • نسخه پایدار من و تو v18**

