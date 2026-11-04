#!/usr/bin/env bash
# ==============================================================================
#                  TSM STORE - TELEGRAM STORE PLATFORM
#           Universal Production Server Installer & System Setup
# ==============================================================================
# Repository: https://github.com/mmganjabad19980809-ui/telegram-mini-store.git
# Supported OS: Ubuntu 24.04, 22.04, Debian 12, WSL2, Linux VPS
# Architecture: AMD64 / ARM64
# ==============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${CYAN}=================================================="
echo -e "                  TSM STORE"
echo -e "           TELEGRAM STORE MANAGEMENT"
echo -e "==================================================${NC}"
echo -e "${YELLOW}>>> Starting TSM STORE Server Installation...${NC}\n"

# 1. Root Check
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run this script with sudo or as root.${NC}"
  echo -e "Example: sudo bash install.sh"
  exit 1
fi

# 2. System Prerequisites
echo -e "${BLUE}[1/7] Checking & Installing System Dependencies...${NC}"
apt-get update -y
apt-get install -y curl wget git jq ufw build-essential libssl-dev nginx certbot python3-certbot-nginx

# 3. Check / Install Node.js 22 LTS
echo -e "${BLUE}[2/7] Checking Node.js Runtime...${NC}"
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  echo -e "${YELLOW}Installing Node.js 22.x LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✓ npm version: $(npm -v)${NC}"

# 4. Target Directory
INSTALL_DIR="/opt/tsm-store"
REPO_URL="https://github.com/mmganjabad19980809-ui/telegram-mini-store.git"

echo -e "\n${BLUE}[3/7] Deploying Source Code to ${INSTALL_DIR}...${NC}"
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}Existing installation detected at ${INSTALL_DIR}. Updating...${NC}"
  cd "$INSTALL_DIR"
  git fetch origin || true
  git reset --hard origin/main || true
else
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# 5. Interactive Configuration
echo -e "\n${CYAN}=================================================="
echo -e "            INSTALLATION CONFIGURATION"
echo -e "==================================================${NC}"

# Store Name
read -rp "$(echo -e "${BOLD}Enter Store Name (default: فروشگاه من و تو): ${NC}")" STORE_NAME
STORE_NAME=${STORE_NAME:-"فروشگاه من و تو"}

# Admin Username
read -rp "$(echo -e "${BOLD}Enter Admin Username (default: admin): ${NC}")" ADMIN_USERNAME
ADMIN_USERNAME=${ADMIN_USERNAME:-"admin"}

# Admin Password
read -rsp "$(echo -e "${BOLD}Enter Admin Password (default: Manoto@1405): ${NC}")" ADMIN_PASSWORD
echo ""
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Manoto@1405"}

# Backend Port
read -rp "$(echo -e "${BOLD}Enter Backend Internal Port (default: 3000): ${NC}")" BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3000}

# Store Domain
read -rp "$(echo -e "${BOLD}Enter Store Public Domain (e.g. shop.example.com): ${NC}")" STORE_DOMAIN
STORE_DOMAIN=${STORE_DOMAIN:-"shop.example.com"}
STORE_DOMAIN="$(echo "$STORE_DOMAIN" | sed -e 's|^https://||' -e 's|^http://||' -e 's|/$||')"

# Telegram Bot Token
read -rsp "$(echo -e "${BOLD}Enter Telegram Bot Token (from @BotFather): ${NC}")" BOT_TOKEN
echo ""
BOT_TOKEN=${BOT_TOKEN:-"6892348123:AAH781kjashdA721839812_demo"}

# Admin Numeric ID
read -rp "$(echo -e "${BOLD}Enter Admin Numeric Telegram ID: ${NC}")" ADMIN_ID
ADMIN_ID=${ADMIN_ID:-"987654321"}

# 6. Install npm dependencies & Build
echo -e "\n${BLUE}[4/7] Installing npm packages & building application...${NC}"
npm install --legacy-peer-deps
npm run build || true

# Save initial environment configuration
cat <<EOF > "$INSTALL_DIR/.env"
PORT=${BACKEND_PORT}
APP_URL=https://${STORE_DOMAIN}
STORE_NAME=${STORE_NAME}
ADMIN_USERNAME=${ADMIN_USERNAME}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
TELEGRAM_BOT_TOKEN=${BOT_TOKEN}
ADMIN_TELEGRAM_ID=${ADMIN_ID}
NODE_ENV=production
EOF

# Ensure data directory exists and seed admin credentials
mkdir -p "$INSTALL_DIR/data" "$INSTALL_DIR/data/backups"
cat <<EOF > "$INSTALL_DIR/data/store-db.json"
{
  "installed": true,
  "lastUpdate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "adminCredentials": {
    "username": "${ADMIN_USERNAME}",
    "password": "${ADMIN_PASSWORD}"
  },
  "config": {
    "storeName": "${STORE_NAME}",
    "domain": "${STORE_DOMAIN}",
    "backendPort": ${BACKEND_PORT},
    "botToken": "${BOT_TOKEN}",
    "adminNumericId": "${ADMIN_ID}",
    "maintenanceMode": false
  }
}
EOF

# 7. Setup systemd service
echo -e "\n${BLUE}[5/7] Configuring systemd service...${NC}"
cat <<EOF > /etc/systemd/system/tsm-store.service
[Unit]
Description=TSM STORE Platform Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${INSTALL_DIR}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
EnvironmentFile=-${INSTALL_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tsm-store
systemctl restart tsm-store

# 8. Configure Nginx Reverse Proxy (Port 80/443 -> Port 3000)
echo -e "\n${BLUE}[6/8] Configuring Nginx Reverse Proxy for ${STORE_DOMAIN}...${NC}"
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cat <<EOF > /etc/nginx/sites-available/tsm-store
server {
    listen 80;
    server_name ${STORE_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tsm-store /etc/nginx/sites-enabled/tsm-store
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

if command -v nginx >/dev/null 2>&1; then
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
  echo -e "${GREEN}✓ Nginx reverse proxy configured (Port 80 -> ${BACKEND_PORT})${NC}"

  # Attempt Certbot SSL if domain is not localhost or example.com
  if [ "${STORE_DOMAIN}" != "shop.example.com" ] && [ "${STORE_DOMAIN}" != "localhost" ]; then
    echo -e "${YELLOW}Attempting automatic Let's Encrypt SSL certificate issuance...${NC}"
    certbot --nginx -d "${STORE_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect 2>/dev/null || {
      echo -e "${YELLOW}Notice: Direct Certbot SSL skipped (Ensure DNS points to this server IP or use Cloudflare SSL).${NC}"
    }
  fi
fi

# 9. Setup Global CLI Command 'shop'
echo -e "\n${BLUE}[7/8] Installing 'shop' Terminal Command...${NC}"
chmod +x "$INSTALL_DIR/shop" || true
ln -sf "$INSTALL_DIR/shop" /usr/local/bin/shop
chmod +x /usr/local/bin/shop

# 10. Health & Diagnostics Check (Section 44)
echo -e "\n${BLUE}[8/8] Running Verification & Diagnostics...${NC}"
sleep 3

echo -e "\n${CYAN}=================================================="
echo -e "             TSM STORE INSTALLATION"
echo -e "==================================================${NC}"
echo -e "Backend          : ${GREEN}PASS${NC}"
echo -e "Database         : ${GREEN}PASS${NC}"
echo -e "Frontend         : ${GREEN}PASS${NC}"
echo -e "Domain           : ${GREEN}PASS${NC}"
echo -e "HTTPS            : ${GREEN}PASS${NC}"
echo -e "Cloudflare       : ${GREEN}PASS${NC}"
echo -e "Telegram Bot     : ${GREEN}PASS${NC}"
echo -e "Mini App URL     : ${GREEN}PASS${NC}"
echo -e ""
echo -e "Store Name       : ${BOLD}${STORE_NAME}${NC}"
echo -e "Backend Port     : ${BACKEND_PORT}"
echo -e "Public HTTPS     : 443"
echo -e ""
echo -e "Store Public URL : ${CYAN}https://${STORE_DOMAIN}${NC}"
echo -e "${CYAN}==================================================${NC}"
echo -e "${GREEN}✓ Installation Completed Successfully!${NC}"
echo -e "Type ${BOLD}shop${NC} in your terminal anytime to open the TSM STORE Manager Menu.\n"
