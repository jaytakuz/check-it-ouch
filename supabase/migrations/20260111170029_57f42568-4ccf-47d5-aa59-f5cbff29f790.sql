-- Add end_repeat_date column for recurring events
ALTER TABLE public.events 
ADD COLUMN end_repeat_date date DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.events.end_repeat_date IS 'The end date for recurring events. NULL means the event repeats indefinitely.';