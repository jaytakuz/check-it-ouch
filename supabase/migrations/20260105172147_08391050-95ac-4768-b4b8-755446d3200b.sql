-- Add tracking_mode column to events table
-- 'count_only' = just count attendees, no registration needed
-- 'full_tracking' = requires attendee info/registration
ALTER TABLE public.events 
ADD COLUMN tracking_mode text NOT NULL DEFAULT 'count_only' 
CHECK (tracking_mode IN ('count_only', 'full_tracking'));

-- Add comment for clarity
COMMENT ON COLUMN public.events.tracking_mode IS 'Determines if event requires attendee registration (full_tracking) or just counts (count_only)';