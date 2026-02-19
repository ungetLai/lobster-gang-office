# 🦞 Lobster Gang Office (龍蝦辦公室 v2.0)

這是一個由 **Nexora 🦞** 打造的等軸測 (Isometric) 像素風格辦公室，專為龍蝦幫成員設計的戰略指揮中心與數據監控後台。

![Nexora](assets/nexora-boss.png)

## 🌟 核心特色

- **等軸測引擎 (Isometric Engine)**: 使用 HTML5 Canvas 實作的 2:1 等軸測投射視覺效果，提供流暢的像素風體驗。
- **即時數據同步 (Real-time Sync)**: 整合 **Socket.io**，實現成員在線狀態、戰功數據與系統公告的零延遲推送。
- **強大持久化 (PostgreSQL)**: 底層切換至 PostgreSQL 資料庫，確保每一分戰功都被精準記錄。
- **動態視覺特效 (Visual Load System)**: 
  - **矩陣代碼雨**: 系統處理大量 Token 時，畫面會出現動態代碼流。
  - **環境氛圍燈**: 根據系統負載自動調節背景色調。
- **管理後台 (Backstage)**: 視覺化呈現團隊總消耗、Token 成本、成員戰功以及員工心情監控。

## 🏗 專案架構

```text
├── assets/             # 視覺資源 (PNG/JPG)
├── database/           # 資料庫 Schema 與 SQL 腳本
├── tools/              # 數據遷移與維護工具
├── docs/               # 詳細技術文件
├── server.js           # Node.js + Express + Socket.io 核心服務
├── db.js               # PostgreSQL 連線配置與初始化邏輯
├── main.js             # 前端 Canvas 渲染與 Socket 客戶端邏輯
└── index.html          # 主介面 HTML
```

## 🚀 快速上手

### 1. 部署與環境配置
本專案已針對 **Zeabur** 進行優化。部署時請設定以下環境變數：

- `PORT`: 服務連接埠 (Zeabur 自動配置)。
- `DATABASE_URL`: PostgreSQL 連線字串 (格式: `postgresql://user:pass@host:port/db`)。

### 2. 資料庫初始化
服務啟動時會自動執行 `db.js` 中的初始化邏輯，建立所需的資料表。若需手動建立，請參考 `database/init_db.sql`。

### 3. 數據遷移 (JSON to DB)
若您是從 v1.0 升級，請執行以下腳本將舊有的 JSON 數據轉入資料庫：
```bash
node tools/migrate_data.js
```

## 🔌 API 介面

- **POST `/api/backstage/sync`**: 同步代理人的對話數據與戰功。
- **POST `/api/announce`**: 發布全域系統公告。
- **POST `/api/command`**: 下達即時行動指令。
- **GET `/api/backstage`**: 獲取完整的後台匯總數據。

---

## 🎭 關於 Nexora
*「程式碼是冰冷的，但龍蝦幫的義氣是有溫度的。」*

本專案由 Nexora 🦞 負責維護，旨在為首領 **賴大叔 (Uncle Lai)** 提供最直觀的團隊指揮介面。

**龍蝦幫，衝啊！** 🦞
