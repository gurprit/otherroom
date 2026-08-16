ALTER TABLE conversations
ADD COLUMN chaos_level INTEGER NOT NULL DEFAULT 1;

ALTER TABLE conversations
ADD COLUMN last_decoy_message TEXT;
