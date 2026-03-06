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
    status VARCHAR(20) DEFAULT 'idle',
    online_time INTERVAL,
    mood_timestamp TIMESTAMP,  -- 心情語錄時間戳記
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 每日統計表
CREATE TABLE IF NOT EXISTS daily_stats (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sessions INTEGER DEFAULT 0,
    tokens BIGINT DEFAULT 0,
    tasks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, date)
);
