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
    online_time INTERVAL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
