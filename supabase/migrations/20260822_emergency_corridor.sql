-- AERO Emergency Corridor Schema Update

-- 1. Extend emergency_incidents table
ALTER TABLE public.emergency_incidents 
  ADD COLUMN IF NOT EXISTS destination_address TEXT,
  ADD COLUMN IF NOT EXISTS route_geometry JSONB,
  ADD COLUMN IF NOT EXISTS route_distance_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS route_duration_seconds DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_accuracy DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_speed DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_heading DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS corridor_status TEXT DEFAULT 'PENDING' CHECK (corridor_status IN ('PENDING', 'CLEARING', 'CLEAR', 'CAUTION', 'BLOCKED')),
  ADD COLUMN IF NOT EXISTS police_acknowledged_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS police_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- 2. Enable Realtime for emergency_incidents
-- We add it to the supabase_realtime publication to ensure frontend subscriptions work
BEGIN;
  DO $$
  BEGIN
    -- Check if the table is already in the publication
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'emergency_incidents'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_incidents;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if publication doesn't exist (e.g. local dev without full realtime setup)
    RAISE NOTICE 'Could not add to supabase_realtime publication. It may not exist.';
  END;
  $$;
COMMIT;

-- 3. Row Level Security Policies

-- Enable RLS (safe to run multiple times)
ALTER TABLE public.emergency_incidents ENABLE ROW LEVEL SECURITY;

-- Police Select Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Traffic Police can view all incidents' AND tablename = 'emergency_incidents'
  ) THEN
    CREATE POLICY "Traffic Police can view all incidents"
    ON public.emergency_incidents
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('traffic_operator', 'admin')
      )
    );
  END IF;
END
$$;

-- Police Update Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Traffic Police can update incidents' AND tablename = 'emergency_incidents'
  ) THEN
    CREATE POLICY "Traffic Police can update incidents"
    ON public.emergency_incidents
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('traffic_operator', 'admin')
      )
    );
  END IF;
END
$$;

-- Ambulance policies already exist in schema.sql:
-- "Users can view their incidents" (USING auth.uid() = user_id)
-- "Users can insert incidents" (WITH CHECK auth.uid() = user_id)
-- "Users can update their incidents" (USING auth.uid() = user_id)
-- These satisfy the ambulance requirements safely.

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_police_id ON public.emergency_incidents(police_id);
CREATE INDEX IF NOT EXISTS idx_incidents_updated_at ON public.emergency_incidents(updated_at);
-- (user_id and status indexes already exist in base schema)

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_emergency_incidents_modtime') THEN
    CREATE TRIGGER update_emergency_incidents_modtime
    BEFORE UPDATE ON public.emergency_incidents
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END
$$;
