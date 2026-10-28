# Deploy — digwall.ice-solution.hk

Cloudflare **SSL/TLS = Flexible**（訪客 → CF 用 HTTPS；CF → origin 用 **HTTP :80**）。  
Web server：**Apache2** reverse proxy → Node `127.0.0.1:3000`。

## Cloudflare 設定

1. DNS：`digwall.ice-solution.hk` → origin 公網 IP，**Proxied（橘雲）**
2. SSL/TLS → Overview：**Flexible**
3. （建議）SSL/TLS → Edge Certificates：Always Use HTTPS = On  
4. 不要在 origin 開 443 / 不要用 Full，除非之後改成 Full (strict) + 本機證書

## Origin 需求

- Ubuntu/Debian + **Apache2**
- Node.js 18+
- MongoDB
- 防火牆只對外開 **80**（及 SSH）；Node 只聽 `127.0.0.1:3000`

## 一鍵安裝

```bash
sudo bash deploy/install.sh
```

預設路徑：`/var/www/digwall.ice-solution.hk`

```bash
sudo nano /var/www/digwall.ice-solution.hk/.env
sudo systemctl restart digital-wall
```

## 手動步驟

```bash
# 1) App
sudo mkdir -p /var/www/digwall.ice-solution.hk
sudo rsync -a --exclude node_modules --exclude .git ./ /var/www/digwall.ice-solution.hk/
cd /var/www/digwall.ice-solution.hk
sudo cp .env.example .env   # 首次
sudo npm install --omit=dev
sudo npm run build:css
sudo npm run seed

# 2) Apache2 (HTTP only — Flexible)
sudo a2enmod proxy proxy_http proxy_wstunnel headers remoteip rewrite
sudo cp deploy/apache2/cloudflare-remoteip.conf /etc/apache2/conf-available/
sudo a2enconf cloudflare-remoteip
sudo cp deploy/apache2/digwall.ice-solution.hk.conf /etc/apache2/sites-available/
sudo a2ensite digwall.ice-solution.hk
sudo apache2ctl configtest && sudo systemctl reload apache2

# 3) systemd
sudo cp deploy/systemd/digital-wall.service /etc/systemd/system/
sudo chown -R www-data:www-data /var/www/digwall.ice-solution.hk
sudo systemctl daemon-reload
sudo systemctl enable --now digital-wall
```

## 驗證

```bash
curl -s http://127.0.0.1:3000/health
curl -sI https://digwall.ice-solution.hk/health
```

| 服務 | URL |
|------|-----|
| Submit | https://digwall.ice-solution.hk/ |
| Display | https://digwall.ice-solution.hk/display.html |
| Admin | https://digwall.ice-solution.hk/admin.html |
| WebSocket | `wss://digwall.ice-solution.hk/ws` |

Display 會用 `wss://`；Apache `proxy_wstunnel` 轉到 Node `/ws`。

## 常用指令

```bash
sudo systemctl status digital-wall
sudo journalctl -u digital-wall -f
sudo tail -f /var/log/apache2/digwall.error.log
```

## 注意

- Flexible 下 **origin 不要** `Redirect permanent` 到 HTTPS，否則可能迴圈。
- 之後若改 **Full (strict)**，需另加 origin TLS（Let’s Encrypt）並加 `:443` vhost。
