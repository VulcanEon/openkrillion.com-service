CREATE TABLE IF NOT EXISTS puzzles (
  date TEXT PRIMARY KEY,
  day_number INTEGER NOT NULL,
  source TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  player TEXT NOT NULL,
  date TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('daily','practice')),
  next_round INTEGER NOT NULL DEFAULT 0,
  round_start INTEGER,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_daily_per_player ON runs(player,date) WHERE mode='daily';
CREATE INDEX IF NOT EXISTS daily_results ON runs(date,mode,completed);
CREATE TABLE IF NOT EXISTS answers (
  run_id TEXT NOT NULL REFERENCES runs(id),
  round INTEGER NOT NULL,
  raw_answer TEXT,
  answer TEXT,
  tier TEXT,
  score INTEGER NOT NULL CHECK(score IN (0,10,15,30,60,85,100)),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(run_id,round)
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(key,window)
);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player TEXT NOT NULL,
  date TEXT NOT NULL,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
