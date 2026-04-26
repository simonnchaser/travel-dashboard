-- Create packing_items table
CREATE TABLE IF NOT EXISTS packing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('documents', 'electronics', 'clothing', 'toiletries', 'medicine', 'accessories', 'others')),
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_packed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todo_items table
CREATE TABLE IF NOT EXISTS todo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packing_items_trip_id ON packing_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_packing_items_category ON packing_items(category);
CREATE INDEX IF NOT EXISTS idx_packing_items_is_packed ON packing_items(is_packed);

CREATE INDEX IF NOT EXISTS idx_todo_items_trip_id ON todo_items(trip_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_is_completed ON todo_items(is_completed);
CREATE INDEX IF NOT EXISTS idx_todo_items_due_date ON todo_items(due_date);
CREATE INDEX IF NOT EXISTS idx_todo_items_priority ON todo_items(priority);

-- Enable Row Level Security
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for packing_items
CREATE POLICY "Users can view their own packing items"
  ON packing_items FOR SELECT
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can insert their own packing items"
  ON packing_items FOR INSERT
  WITH CHECK (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can update their own packing items"
  ON packing_items FOR UPDATE
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can delete their own packing items"
  ON packing_items FOR DELETE
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

-- Create RLS policies for todo_items
CREATE POLICY "Users can view their own todo items"
  ON todo_items FOR SELECT
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can insert their own todo items"
  ON todo_items FOR INSERT
  WITH CHECK (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can update their own todo items"
  ON todo_items FOR UPDATE
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can delete their own todo items"
  ON todo_items FOR DELETE
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_packing_items_updated_at BEFORE UPDATE ON packing_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON todo_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
