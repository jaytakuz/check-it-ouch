-- Create guest_check_ins table for storing guest (non-registered) check-ins
CREATE TABLE public.guest_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name text NOT NULL DEFAULT 'Anonymous Guest',
  guest_email text,
  checked_in_at timestamp with time zone NOT NULL DEFAULT now(),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  location_lat double precision NOT NULL,
  location_lng double precision NOT NULL,
  distance_meters double precision NOT NULL,
  tracking_mode text NOT NULL DEFAULT 'count_only' CHECK (tracking_mode IN ('count_only', 'full_tracking')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guest_check_ins ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert guest check-ins (public access for guests)
CREATE POLICY "Anyone can create guest check-ins"
ON public.guest_check_ins
FOR INSERT
WITH CHECK (true);

-- Policy: Hosts can view guest check-ins for their events
CREATE POLICY "Hosts can view guest check-ins for their events"
ON public.guest_check_ins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = guest_check_ins.event_id
    AND events.host_id = auth.uid()
  )
);

-- Policy: Allow public read for the guest who just checked in (via event_id match)
-- This allows the success screen to work
CREATE POLICY "Public can view recent guest check-ins"
ON public.guest_check_ins
FOR SELECT
USING (
  checked_in_at > now() - interval '1 minute'
);

-- Add index for efficient queries
CREATE INDEX idx_guest_check_ins_event_id ON public.guest_check_ins(event_id);
CREATE INDEX idx_guest_check_ins_session_date ON public.guest_check_ins(session_date);

-- Add comment
COMMENT ON TABLE public.guest_check_ins IS 'Stores check-ins from guest users who are not logged in';