const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { pool, initDB } = require('./db');
const fs = require('fs').promises;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// 初始化資料庫
initDB().catch(err => console.error('Database initialization failed:', err));

// Socket.io 連線處理
io.on('connection', (socket) => {
    console.log('📡 A user connected to the office');
    socket.on('disconnect', () => {
        console.log('📡 A user disconnected');
    });
});

// 獲取狀態
app.get('/api/status', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'data/status.json'), 'utf8');
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

// 指令 API
let lastCommand = null;
app.post('/api/command', (req, res) => {
    const { command, target } = req.body;
    console.log(`🦞 Received command: ${command} for ${target}`);
    lastCommand = { command, target, timestamp: Date.now() };
    
    // 透過 Socket 即時廣播指令
    io.emit('boss_command', lastCommand);
    
    res.json({ success: true });
});

app.get('/api/command', (req, res) => {
    res.json(lastCommand);
});

// 系統公告 API
app.post('/api/announce', (req, res) => {
    const { message, type = 'system', sender = 'Nexora 🦞' } = req.body;
    console.log(`📢 Announcement: [${sender}] ${message}`);
    
    io.emit('announcement', {
        message,
        type,
        sender,
        timestamp: Date.now()
    });
    
    res.json({ success: true });
});

// 數據同步 API
app.post('/api/backstage/sync', async (req, res) => {
    const { agentId, inputTokens, outputTokens, mood, status, onlineTime, isNewSession, taskCompleted } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const input = inputTokens || 0;
        const output = outputTokens || 0;
        const cost = (input * 0.0000001) + (output * 0.0000004);
        const sessionsInc = isNewSession ? 1 : 0;
        const taskInc = taskCompleted ? 1 : 0;

        await client.query(`
            UPDATE system_stats 
            SET total_sessions = total_sessions + $1,
                total_input = total_input + $2,
                total_output = total_output + $3,
                total_cost = total_cost + $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = (SELECT id FROM system_stats LIMIT 1)
        `, [sessionsInc, input, output, cost]);

        await client.query(`
            INSERT INTO agents (agent_id, name, sessions, tokens, cost, tasks)
            VALUES ($1, $1, $2, $3, $4, $5)
            ON CONFLICT (agent_id) DO UPDATE 
            SET sessions = agents.sessions + $2,
                tokens = agents.tokens + $3,
                cost = agents.cost + $4,
                tasks = agents.tasks + $5
        `, [agentId, sessionsInc, input + output, cost, taskInc]);

        if (mood || status || onlineTime) {
            // 檢查是否為 mood 更新（需要更新 mood_created_at）
            const isMoodUpdate = mood && mood !== "穩定運作中";
            
            await client.query(`
                INSERT INTO moods (agent_id, mood, status, online_time, updated_at, mood_created_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, ${isMoodUpdate ? 'CURRENT_TIMESTAMP' : 'moods.mood_created_at'})
                ON CONFLICT (agent_id) DO UPDATE 
                SET mood = COALESCE(EXCLUDED.mood, moods.mood),
                    status = COALESCE(EXCLUDED.status, moods.status),
                    online_time = COALESCE(EXCLUDED.online_time, moods.online_time),
                    updated_at = CURRENT_TIMESTAMP,
                    mood_created_at = CASE 
                        WHEN EXCLUDED.mood IS NOT NULL AND EXCLUDED.mood <> '穩定運作中' 
                        THEN COALESCE(moods.mood_created_at, CURRENT_TIMESTAMP) 
                        ELSE moods.mood_created_at 
                    END
            `, [agentId, mood || "穩定運作中", status || "idle", onlineTime || "00:00:00"]);
        }

        // 更新每日統計
        const today = new Date().toISOString().split('T')[0];
        await client.query(`
            INSERT INTO daily_stats (agent_id, date, sessions, tokens, tasks)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (agent_id, date) DO UPDATE 
            SET sessions = daily_stats.sessions + $3,
                tokens = daily_stats.tokens + $4,
                tasks = daily_stats.tasks + $5
        `, [agentId, today, sessionsInc, input + output, taskInc]);

        await client.query('COMMIT');

        // 即時通知前端更新數據與成員狀態
        io.emit('sync_update', { 
            agentId, 
            input, 
            output, 
            isNewSession, 
            mood: mood || "穩定運作中",
            status: status || "idle",
            onlineTime: onlineTime || "00:00:00"
        });

        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Sync error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
});

app.get('/api/backstage', async (req, res) => {
    try {
        const statsRes = await pool.query('SELECT * FROM system_stats LIMIT 1');
        const agentsRes = await pool.query('SELECT * FROM agents');
        const moodsRes = await pool.query('SELECT * FROM moods');

        if (statsRes.rows.length === 0) {
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
                status: m.status || 'idle',
                onlineTime: m.online_time,
                timestamp: m.mood_created_at ? new Date(m.mood_created_at).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : (m.updated_at ? new Date(m.updated_at).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : null)
            }))
        });
    } catch (err) {
        console.error('Fetch backstage error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 昨日工作摘要 API
app.get('/api/backstage/daily', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const result = await pool.query(`
            SELECT agent_id, date, sessions, tokens, tasks
            FROM daily_stats
            WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
            ORDER BY date DESC, agent_id
        `);

        // 整理數據
        const dailyData = {};
        result.rows.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0];
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = [];
            }
            dailyData[dateStr].push({
                agent: row.agent_id,
                sessions: row.sessions,
                tokens: parseInt(row.tokens),
                tasks: row.tasks
            });
        });

        // 昨日摘要
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayData = dailyData[yesterdayStr] || [];

        // 7日趨勢
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            trend.push({
                date: dStr,
                totalSessions: dailyData[dStr]?.reduce((sum, a) => sum + a.sessions, 0) || 0,
                totalTokens: dailyData[dStr]?.reduce((sum, a) => sum + a.tokens, 0) || 0,
                totalTasks: dailyData[dStr]?.reduce((sum, a) => sum + a.tasks, 0) || 0
            });
        }

        res.json({
            yesterday: yesterdayData,
            trend: trend,
            summary: {
                totalSessions: yesterdayData.reduce((sum, a) => sum + a.sessions, 0),
                totalTokens: yesterdayData.reduce((sum, a) => sum + a.tokens, 0),
                totalTasks: yesterdayData.reduce((sum, a) => sum + a.tasks, 0)
            }
        });
    } catch (err) {
        console.error('Fetch daily error:', err);
        res.status(500).json({ error: err.message });
    }
});

server.listen(PORT, () => {
    console.log(`🦞 Lobster Gang Office (WebSocket Enabled) is sailing on port ${PORT}`);
});
