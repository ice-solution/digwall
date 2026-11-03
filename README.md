# Digital Wall API

用 Express.js、MongoDB、WebSocket、Tailwind CSS 打造的數碼牆系統。

## 功能

1. **客人提交** — 網頁提交 `name`、`sticker_id`、`msg_id`、`optional_id`
2. **Message Slot** — 收到 submit 後放入 slot，並經 WebSocket 推送給 display client
3. **Completed** — display client 顯示完畢後回報 completed
4. **JWT Admin** — 登入有效期 1 天，可查看 submit / complete 紀錄
5. **WebSocket** — 即時推送新訊息與完成狀態

## 快速開始

### 前置需求

- Node.js 18+
- MongoDB（本機或遠端）

### 安裝

```bash
cp .env.example .env
npm install
npm run build:css
npm run seed
npm run dev
```

開啟：

| 頁面 | URL |
|------|-----|
| 客人提交 | http://localhost:3000/ |
| Display 牆 | http://localhost:3000/display.html |
| Admin | http://localhost:3000/admin.html |
| WebSocket | ws://localhost:3000/ws |

預設 admin（見 `.env`）：`admin` / `admin123`

## 環境變數 (`.env`)

```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/digital_wall
JWT_SECRET=digital_wall_jwt_secret_change_me
JWT_EXPIRES_IN=1d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## API

### Auth

| Method | Path | 說明 |
|--------|------|------|
| POST | `/api/auth/login` | `{ username, password }` → JWT（1d） |

### Messages（公開）

| Method | Path | 說明 |
|--------|------|------|
| POST | `/api/messages/slot` | 提交訊息 → 入 slot → WS 推送 |
| GET | `/api/messages/slot` | 取得尚未完成的訊息（display 啟動用） |
| POST | `/api/messages/completed` | `{ id }` 標記完成 |

#### Submit body

```json
{
  "name": "Keith",
  "sticker_id": "sticker_01",
  "msg_id": "msg_hello",
  "optional_id": ""
}
```

### Admin（需 `Authorization: Bearer <token>`）

| Method | Path | 說明 |
|--------|------|------|
| GET | `/api/admin/messages?status=all\|slot\|displaying\|completed` | 訊息列表 |
| GET | `/api/admin/stats` | 統計 |
| GET | `/api/admin/export.xlsx` | 匯出全部訊息為 XLSX |

## 訊息狀態流程

```
submit → slot → displaying (WS push) → completed
```

## 開發

```bash
npm run watch:css   # Tailwind watch
npm run dev         # Server with --watch
```

## Postman

匯入 `postman/` 內檔案：

- `Digital_Wall_API.postman_collection.json` — API collection
- `Digital_Wall_API.postman_environment.json` — Local (`http://localhost:3000`)
- `Digital_Wall_API.Production.postman_environment.json` — Production (`https://digwall.ice-solution.hk`)

建議順序：`POST Login` → `POST Message Slot` → `POST Message Completed` → Admin 查詢。Login 會自動寫入 `token`。

## 部署

Production domain：**digwall.ice-solution.hk**（Cloudflare Flexible）。

詳見 [deploy/DEPLOY.md](deploy/DEPLOY.md)。

```bash
sudo bash deploy/install.sh
```

## 專案結構

```
├── .env
├── deploy/           # Apache2 vhost + systemd + install
├── public/           # 靜態頁面 + Tailwind CSS
├── server/
│   ├── index.js
│   ├── websocket.js
│   ├── seed.js
│   ├── config/db.js
│   ├── models/
│   ├── middleware/
│   └── routes/
├── src/input.css
└── package.json
```
