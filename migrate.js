const { pool } = require('./db');

async function migrate() {
  console.log('🦞 Starting manual migration...');
  const client = await pool.connect();
  try {
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
    
    const res = await client.query('SELECT COUNT(*) FROM system_stats');
    if (parseInt(res.rows[0].count) === 0) {
      await client.query('INSERT INTO system_stats (total_sessions) VALUES (0)');
    }
    console.log('✅ Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
