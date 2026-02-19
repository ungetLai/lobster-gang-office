const { pool } = require('./db');

async function migrate() {
  console.log('🦞 Starting data migration from JSON to DB...');
  const client = await pool.connect();
  try {
    const fs = require('fs');
    const path = require('path');
    const DATA_FILE = path.join(__dirname, 'backstage-data.json');

    if (!fs.existsSync(DATA_FILE)) {
      console.log('⚠️ No backstage-data.json found. Skipping migration.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    await client.query('BEGIN');

    // 1. 初始化資料表 (如果還沒建立)
    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
          agent_id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          sessions INTEGER DEFAULT 0,
          tokens BIGINT DEFAULT 0,
          cost DECIMAL(10, 6) DEFAULT 0,
          tasks INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS system_stats (
          id SERIAL PRIMARY KEY,
          total_sessions INTEGER DEFAULT 0,
          total_input BIGINT DEFAULT 0,
          total_output BIGINT DEFAULT 0,
          total_cost DECIMAL(10, 6) DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS moods (
          agent_id VARCHAR(50) PRIMARY KEY,
          mood TEXT,
          online_time VARCHAR(20),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. 遷移 system_stats
    const statsRes = await client.query('SELECT COUNT(*) FROM system_stats');
    if (parseInt(statsRes.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO system_stats (total_sessions, total_input, total_output, total_cost)
        VALUES ($1, $2, $3, $4)
      `, [data.totalSessions || 0, data.totalInput || 0, data.totalOutput || 0, data.totalCost || 0]);
    } else {
      await client.query(`
        UPDATE system_stats 
        SET total_sessions = $1, total_input = $2, total_output = $3, total_cost = $4
        WHERE id = (SELECT id FROM system_stats LIMIT 1)
      `, [data.totalSessions || 0, data.totalInput || 0, data.totalOutput || 0, data.totalCost || 0]);
    }

    // 3. 遷移 agents
    if (data.members) {
      for (const [id, m] of Object.entries(data.members)) {
        await client.query(`
          INSERT INTO agents (agent_id, name, sessions, tokens, cost, tasks)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (agent_id) DO UPDATE 
          SET sessions = EXCLUDED.sessions,
              tokens = EXCLUDED.tokens,
              cost = EXCLUDED.cost,
              tasks = EXCLUDED.tasks
        `, [id, m.name || id, m.sessions || 0, m.tokens || 0, m.cost || 0, m.tasks || 0]);
      }
    }

    // 4. 遷移 moods
    if (data.moods) {
      for (const [id, m] of Object.entries(data.moods)) {
        await client.query(`
          INSERT INTO moods (agent_id, mood, online_time)
          VALUES ($1, $2, $3)
          ON CONFLICT (agent_id) DO UPDATE 
          SET mood = EXCLUDED.mood,
              online_time = EXCLUDED.online_time
        `, [id, m.mood || '', m.onlineTime || '00:00:00']);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Data migration successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Data migration failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
