# Lobster Gang Office vNext 規格草案

## 1. 專案定位

### 1.1 產品核心定位
Lobster Gang Office 是一個 **雙軌產品**：

- **Track A：虛擬辦公室（Office Experience）**
  - 讓人用比較輕鬆、詼諧、像巡遊戲基地的方式感受團隊狀態
  - 強調角色存在感、辦公室氛圍、即時事件、互動感

- **Track B：戰情儀表板（Backstage Dashboard）**
  - 讓管理者快速掌握團隊數據、任務狀態、成本、趨勢與異常
  - 強調可讀性、可追蹤性、可判讀性

### 1.2 核心原則
**同一份資料底盤，兩種觀看模式。**

不是做兩套互不相干的產品，而是：
- 虛擬辦公室負責「讓人想看」
- 戰情儀表板負責「讓人能管」

### 1.3 產品目標
1. 降低觀看管理資訊的心理負擔
2. 保留龍蝦幫品牌個性與遊戲感
3. 提升狀態感知、事件追蹤與管理效率
4. 建立可持續擴充的前後端架構

## 2. Sitemap

```text
Lobster Gang Office
├─ /
│  ├─ Header
│  │  ├─ 進入辦公室
│  │  ├─ 查看戰情板
│  │  └─ 系統狀態摘要
│  ├─ Office Scene
│  │  ├─ 指揮台（Nexora）
│  │  ├─ 開發區（LoopLoom）
│  │  ├─ 情報區（SignalScout）
│  │  ├─ 財務區（ShadowLedger）
│  │  └─ 戰情室入口
│  ├─ Agent Drawer
│  │  ├─ 基本資訊
│  │  ├─ 即時狀態
│  │  ├─ 今日摘要
│  │  ├─ 最近事件
│  │  └─ 前往詳細頁
│  ├─ Timeline Panel
│  │  ├─ All
│  │  ├─ Commands
│  │  ├─ Sync
│  │  ├─ Mood
│  │  └─ System
│  └─ Mini Summary
│     ├─ 在線數
│     ├─ 今日事件數
│     ├─ 最新公告
│     └─ 系統負載狀態
│
└─ /dashboard
   ├─ KPI Overview
   │  ├─ Sessions
   │  ├─ Tokens
   │  ├─ Cost
   │  ├─ Tasks
   │  ├─ Active Agents
   │  └─ Alerts
   ├─ Agent Table
   │  ├─ 名稱
   │  ├─ 狀態
   │  ├─ Tokens
   │  ├─ Tasks
   │  ├─ Mood
   │  └─ 最後更新
   ├─ Trend Section
   │  ├─ 7日 Sessions
   │  ├─ 7日 Tokens
   │  ├─ 7日 Tasks
   │  └─ 7日 Cost
   ├─ Mood / Alert Section
   │  ├─ Mood 狀態
   │  ├─ 持續時間
   │  ├─ 異常提示
   │  └─ 風險標記
   └─ Event Timeline
      ├─ 公告
      ├─ 指令
      ├─ 任務事件
      └─ 狀態切換
```

## 3. Phase 1 範圍

### 3.1 目標
在不重寫整個系統的前提下，把目前專案從 demo 升級成可持續迭代的雙軌骨架。

### 3.2 包含項目
1. Office / Dashboard 雙路由分流
2. Dashboard 從 modal 改成正式頁面
3. `main.js` 模組化拆分
4. Agent Drawer
5. Timeline Panel 重構
6. Dashboard 趨勢圖落地
7. Header / 首頁雙入口設計
8. 基礎 shared state 建立

## 4. Phase 1 工單拆分

### Epic A：雙軌頁面骨架
- A-1 建立 Office / Dashboard 頁面分流
- A-2 Header 雙入口調整

### Epic B：前端模組化
- B-1 拆分 `main.js`
- B-2 CSS 分離

### Epic C：Office 互動升級
- C-1 Agent hover / click 行為
- C-2 Agent Drawer UI
- C-3 Timeline Panel 改版

### Epic D：Dashboard 最小可用版
- D-1 KPI 區塊重整
- D-2 Agent Table
- D-3 趨勢圖實作

### Epic E：資料與事件整理
- E-1 Timeline Event Model 建立
- E-2 Office / Dashboard 共用 state
