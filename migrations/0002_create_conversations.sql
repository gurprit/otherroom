CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  visitor_message_count INTEGER NOT NULL DEFAULT 0,
  ended_at TEXT,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE INDEX idx_conversations_room_id
ON conversations(room_id);

CREATE INDEX idx_conversations_last_activity
ON conversations(last_activity_at);
