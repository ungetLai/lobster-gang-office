const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const fs = require('fs').promises;
const fsSync = require('fs');

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 數據持久化路徑
const DATA_FILE = path.join(__dirname, 'backstage-data.json');

let backstageData = {
    totalSessions: 0,
    totalInput: 0,
    totalOutput: 0,
    totalCost: 0,
    members: {},
    moods: {}
};

// 載入持久化數據
if (fsSync.existsSync(DATA_FILE)) {
    try {
        backstageData = JSON.parse(fsSync.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error("Failed to load persistence data", e);
    }
}

// 預留 API 介面
app.get('/api/status', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'status.json'), 'utf8');
        const statuses = JSON.parse(data);
        res.json(statuses);
    } catch (err) {
        res.json({
            'main': 'online',
            'looploom': 'online',
            'signalscout': 'offline',
            'shadowledger': 'offline'
        });
    }
});

// 指令 API
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

// --- 新增：數據同步 API (供 OpenClaw 回傳真實數據) ---
app.post('/api/backstage/sync', (req, res) => {
    const { agentId, inputTokens, outputTokens, mood, onlineTime, isNewSession } = req.body;
    
    backstageData.totalInput += (inputTokens || 0);
    backstageData.totalOutput += (outputTokens || 0);
    if (isNewSession) backstageData.totalSessions++;
    
    // 預估花費 (USD)
    const cost = ((inputTokens || 0) * 0.0000001) + ((outputTokens || 0) * 0.0000004);
    backstageData.totalCost += cost;

    // 更新成員戰功
    if (!backstageData.members[agentId]) {
        backstageData.members[agentId] = { name: agentId, sessions: 0, tokens: 0, cost: 0, tasks: 0 };
    }
    const m = backstageData.members[agentId];
    if (isNewSession) m.sessions++;
    m.tokens += ((inputTokens || 0) + (outputTokens || 0));
    m.cost += cost;
    if (req.body.taskCompleted) m.tasks++;

    // 更新心情
    backstageData.moods[agentId] = {
        agent: agentId,
        mood: mood || backstageData.moods[agentId]?.mood || "穩定運作中",
        onlineTime: onlineTime || "00:00:00"
    };

    // 存檔
    fsSync.writeFileSync(DATA_FILE, JSON.stringify(backstageData, null, 2));
    res.json({ success: true });
});

// 後台數據讀取
app.get('/api/backstage', (req, res) => {
    const response = {
        totalSessions: backstageData.totalSessions || 0,
        totalTokens: (backstageData.totalInput || 0) + (backstageData.totalOutput || 0),
        totalInput: backstageData.totalInput || 0,
        totalOutput: backstageData.totalOutput || 0,
        totalCache: 0,
        totalCost: backstageData.totalCost || 0,
        members: Object.values(backstageData.members),
        moods: Object.values(backstageData.moods)
    };

    // 如果沒數據，回傳一些預設演示數據
    if (response.members.length === 0) {
        res.json({
            totalSessions: 144, totalTokens: 392404, totalInput: 77680, totalOutput: 314724, totalCache: 0, totalCost: 5.6027,
            members: [
                { name: 'Nexora 🦞', sessions: 85, tokens: 250000, cost: 4.2, tasks: 12 },
                { name: 'LoopLoom 🕷️', sessions: 42, tokens: 120000, cost: 1.1, tasks: 8 }
            ],
            moods: [
                { agent: 'Nexora 🦞', mood: '等待首領指令中，數據中心已就緒！', onlineTime: '8:12:45' }
            ]
        });
    } else {
        res.json(response);
    }
});

app.listen(PORT, () => {
    console.log(`🦞 Lobster Gang Office is sailing on port ${PORT}`);
});
