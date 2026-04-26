-- Add file attachment columns to packing_items table
ALTER TABLE packing_items
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Add file attachment columns to todo_items table
ALTER TABLE todo_items
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Create storage bucket for packing files (run this in Supabase Dashboard > Storage)
-- Bucket name: 'packing-files'
-- Public: false (private files only accessible by authenticated users)

-- Storage policies will be created via Supabase Dashboard
