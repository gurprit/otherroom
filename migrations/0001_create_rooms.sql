CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  management_token TEXT NOT NULL UNIQUE,
  character_name TEXT NOT NULL,
  username TEXT NOT NULL,
  personality_id TEXT,
  personality_instructions TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_rooms_created_at
ON rooms(created_at);
