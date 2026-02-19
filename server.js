const express = require('express');
const path = require('path');
const { pool, initDB } = require('./db');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 初始化資料庫
console.log('🦞 Attempting to initialize database...');
initDB()
    .then(() => console.log('✅ Database initialization complete.'))
    .catch(err => {
        console.error('❌ Database initialization failed:', err);
        // 在生產環境中，如果資料庫沒連上，我們可能不希望服務直接掛掉，
        // 但至少要讓日誌看得到錯誤。
    });

// 獲取狀態 (保持原有邏輯，但可考慮未來移入 DB)
app.get('/api/status', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'status.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.json({
            'main': 'online',
            'looploom': 'online',
            'signalscout': 'offline',
            'shadowledger': 'offline'
        });
    }
});

// 指令 API (內存存儲，適合作為即時指令)
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

// 數據同步 API
app.post('/api/backstage/sync', async (req, res) => {
    const { agentId, inputTokens, outputTokens, mood, onlineTime, isNewSession, taskCompleted } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const input = inputTokens || 0;
        const output = outputTokens || 0;
        const cost = (input * 0.0000001) + (output * 0.0000004);
        const sessionsInc = isNewSession ? 1 : 0;
        const taskInc = taskCompleted ? 1 : 0;

        // 1. 更新系統總計
        await client.query(`
            UPDATE system_stats 
            SET total_sessions = total_sessions + $1,
                total_input = total_input + $2,
                total_output = total_output + $3,
                total_cost = total_cost + $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (SELECT id FROM system_stats LIMIT 1)
        `, [sessionsInc, input, output, cost]);

        // 2. 更新或插入成員數據
        await client.query(`
            INSERT INTO agents (agent_id, name, sessions, tokens, cost, tasks)
            VALUES ($1, $1, $2, $3, $4, $5)
            ON CONFLICT (agent_id) DO UPDATE 
            SET sessions = agents.sessions + $2,
                tokens = agents.tokens + $3,
                cost = agents.cost + $4,
                tasks = agents.tasks + $5
        `, [agentId, sessionsInc, input + output, cost, taskInc]);

        // 3. 更新心情
        if (mood || onlineTime) {
            await client.query(`
                INSERT INTO moods (agent_id, mood, online_time, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (agent_id) DO UPDATE 
                SET mood = EXCLUDED.mood,
                    online_time = EXCLUDED.online_time,
                    updated_at = CURRENT_TIMESTAMP
            `, [agentId, mood || "穩定運作中", onlineTime || "00:00:00"]);
        }

        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Sync error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
});

// 獲取後台數據
app.get('/api/backstage', async (req, res) => {
    try {
        const statsRes = await pool.query('SELECT * FROM system_stats LIMIT 1');
        const agentsRes = await pool.query('SELECT * FROM agents');
        const moodsRes = await pool.query('SELECT * FROM moods');

        if (statsRes.rows.length === 0) {
            // 回傳空數據或演示數據
            return res.json({ totalSessions: 0, totalTokens: 0, members: [], moods: [] });
        }

        const stats = statsRes.rows[0];
        res.json({
            totalSessions: stats.total_sessions,
            totalTokens: parseInt(stats.total_input) + parseInt(stats.total_output),
            totalInput: parseInt(stats.total_input),
            totalOutput: parseInt(stats.total_output),
            totalCost: parseFloat(stats.total_cost),
            members: agentsRes.rows.map(a => ({
                name: a.name,
                sessions: a.sessions,
                tokens: parseInt(a.tokens),
                cost: parseFloat(a.cost),
                tasks: a.tasks
            })),
            moods: moodsRes.rows.map(m => ({
                agent: m.agent_id,
                mood: m.mood,
                onlineTime: m.online_time
            }))
        });
    } catch (err) {
        console.error('Fetch backstage error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🦞 Lobster Gang Office is sailing on port ${PORT}`);
});
