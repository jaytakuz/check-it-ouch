
-- Add new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{"showRadar":true,"showSkills":true,"showTimeline":true,"showTimelineDetails":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_order text[] NOT NULL DEFAULT ARRAY['radar','skills','timeline'];

-- Generate usernames for existing profiles that don't have one
UPDATE public.profiles
SET username = LOWER(REPLACE(COALESCE(full_name, 'user'), ' ', '-')) || '-' || SUBSTR(user_id::text, 1, 4)
WHERE username IS NULL;

-- Add public SELECT policy so unauthenticated visitors can view public profiles
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (is_public = true);

-- Update handle_new_user to auto-generate username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'user'), ' ', '-')) || '-' || SUBSTR(NEW.id::text, 1, 4)
  );
  RETURN NEW;
END;
$$;
