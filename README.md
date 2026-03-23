# 🦞 Lobster Gang Office (vNext in progress)

Lobster Gang Office 是龍蝦幫的雙軌產品：

- **Office Experience**：用比較輕鬆、像巡視遊戲基地的方式看團隊狀態
- **Backstage Dashboard**：用正式的戰情板視角看數據、任務、趨勢與事件

## 目前進度

Phase 1 已啟動，完成中的重點包含：

- Office / Dashboard 雙頁分流
- Dashboard 從首頁 modal 升級為獨立頁面
- 前端開始模組化拆分
- Office 首頁加入 timeline 與 agent drawer
- Dashboard 開始承接 KPI、agent 總覽、mood、7 日趨勢

## 主要頁面

- `/`：虛擬辦公室
- `/dashboard`：戰情儀表板

## 啟動方式

```bash
npm install
npm start
```

預設埠：`3000`

## vNext 規格

詳細規格請看：

- `docs/vnext-spec.md`

## Phase 1 驗收重點

- [x] 雙軌頁面結構建立
- [x] Dashboard 獨立路由
- [x] Office 首頁雙入口
- [x] Timeline 第一版
- [x] Agent Drawer 第一版
- [x] Dashboard KPI / Agent / Mood / 趨勢骨架
- [x] 基礎模組拆分

## 已追加完成（Phase 2 / Phase 3）

- Office 熱區提示與導覽感
- Office → Dashboard / Agent 詳細頁導流
- `agent.html` Agent 詳細頁
- Timeline event model 第一版
- 警示 banner / 成就 toast / 聚焦提示
- 戰情板 focus 高亮

## 後續可延伸

- 更完整圖表元件
- 更多區域互動與路徑動畫
- 更完整事件模型與持久化
- 權限與公開/內部模式切換
- mobile fallback 強化
