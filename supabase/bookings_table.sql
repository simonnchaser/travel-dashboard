-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('flight', 'accommodation', 'tour', 'restaurant', 'transportation', 'entertainment', 'other')),
  title TEXT NOT NULL,
  booking_number TEXT,
  booking_url TEXT,
  booking_date DATE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'KRW',
  notes TEXT,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings(start_date);

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can insert their own bookings"
  ON bookings FOR INSERT
  WITH CHECK (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE
  USING (trip_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ));
