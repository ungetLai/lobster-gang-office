const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs').promises;

app.use(express.json());

// 預留 API 介面：未來可以用來動態寫入 agents.json
app.get('/api/status', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'status.json'), 'utf8');
        const statuses = JSON.parse(data);
        res.json(statuses);
    } catch (err) {
        // 如果檔案讀取失敗，回傳預設值
        res.json({
            'main': 'online',
            'looploom': 'online',
            'signalscout': 'offline',
            'shadowledger': 'offline'
        });
    }
});

// 新增：接收指令 API
let lastCommand = null;

app.post('/api/command', (req, res) => {
    const { command, target } = req.body;
    console.log(`🦞 Received command: ${command} for ${target}`);
    lastCommand = { command, target, timestamp: Date.now() };
    res.json({ success: true });
});

app.get('/api/command', (req, res) => {
    res.json(lastCommand);
});

app.listen(PORT, () => {
    console.log(`🦞 Lobster Gang Office is sailing on port ${PORT}`);
});
