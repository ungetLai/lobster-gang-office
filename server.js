const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 提供靜態檔案服務
app.use(express.static(path.join(__dirname, './')));

// 預留 API 介面：未來可以用來動態寫入 agents.json
app.get('/api/status', async (req, res) => {
    try {
        // 這裡回傳模擬的成員狀態，未來可以透過讀取 OpenClaw 的 session 或狀態檔案來更新
        const statuses = {
            'main': 'online',
            'looploom': 'online',
            'signalscout': 'offline',
            'shadowledger': 'offline'
        };
        res.json(statuses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🦞 Lobster Gang Office is sailing on port ${PORT}`);
});
