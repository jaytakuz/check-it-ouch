
-- Create event_registrations table to track "first-scan" registrations
-- This allows users to quick check-in on subsequent sessions without scanning QR again
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- Hosts can view registrations for their events
CREATE POLICY "Hosts can view registrations for their events"
  ON public.event_registrations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_registrations.event_id AND events.host_id = auth.uid()
  ));

-- Users can register themselves
CREATE POLICY "Users can register themselves"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own registrations
CREATE POLICY "Users can delete their own registrations"
  ON public.event_registrations FOR DELETE
  USING (auth.uid() = user_id);
