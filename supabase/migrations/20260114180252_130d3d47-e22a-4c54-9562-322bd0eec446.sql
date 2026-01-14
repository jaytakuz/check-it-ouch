-- Add certificate configuration fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS certificate_threshold integer NOT NULL DEFAULT 80,
ADD COLUMN IF NOT EXISTS certificate_zones jsonb DEFAULT '{
  "eventName": {"x": 10, "y": 15, "width": 80, "height": 8},
  "attendeeName": {"x": 25, "y": 45, "width": 50, "height": 10},
  "verification": {"x": 70, "y": 80, "width": 20, "height": 15}
}'::jsonb;

-- Add check constraint for threshold (1-100%)
ALTER TABLE public.events 
ADD CONSTRAINT certificate_threshold_range CHECK (certificate_threshold >= 1 AND certificate_threshold <= 100);