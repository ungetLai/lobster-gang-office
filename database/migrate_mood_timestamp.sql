-- Add mood_created_at column to moods table
-- This timestamp specifically records when the mood/voice was submitted
ALTER TABLE moods ADD COLUMN IF NOT EXISTS mood_created_at TIMESTAMP DEFAULT NULL;

-- Update existing records where mood_created_at is null but updated_at exists
UPDATE moods 
SET mood_created_at = updated_at 
WHERE mood_created_at IS NULL AND updated_at IS NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_moods_created_at ON moods(mood_created_at);
