#!/usr/bin/env bash
# Deploy Digital Wall to digwall.ice-solution.hk (Cloudflare Flexible + Apache2)
# Run on the origin server as root / with sudo.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/digwall.ice-solution.hk}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="digwall.ice-solution.hk"

echo "==> App dir: $APP_DIR"

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo)."
  exit 1
fi

mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude '.env' \
  "$REPO_DIR/" "$APP_DIR/"

if [[ ! -f "$APP_DIR/.env" ]]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "Created $APP_DIR/.env — edit secrets before production use."
fi

cd "$APP_DIR"
npm install --omit=dev
npm run build:css
npm run seed || true

# Apache2
a2enmod proxy proxy_http proxy_wstunnel headers remoteip rewrite
cp "$APP_DIR/deploy/apache2/cloudflare-remoteip.conf" /etc/apache2/conf-available/cloudflare-remoteip.conf
a2enconf cloudflare-remoteip
cp "$APP_DIR/deploy/apache2/digwall.ice-solution.hk.conf" "/etc/apache2/sites-available/${DOMAIN}.conf"
a2ensite "${DOMAIN}"
apache2ctl configtest
systemctl reload apache2

# systemd
cp "$APP_DIR/deploy/systemd/digital-wall.service" /etc/systemd/system/digital-wall.service
chown -R www-data:www-data "$APP_DIR"
systemctl daemon-reload
systemctl enable --now digital-wall
systemctl restart digital-wall

echo ""
echo "Done. Health check:"
curl -sS "http://127.0.0.1:3000/health" || true
echo ""
echo "Public URL (via Cloudflare Flexible): https://${DOMAIN}/"
echo "Remember: Cloudflare SSL/TLS mode = Flexible, DNS A/AAAA orange-cloud proxied."
