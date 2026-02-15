

# Persistent Profile Settings & Public Profile Page

## Overview

This plan covers three major workstreams:
1. Persist profile preferences (privacy settings, section order, bio, social links) to the database
2. Create a publicly accessible profile page at `/p/:username` (no login required)
3. Redesign the Public URL display and Radar Chart for a more professional look

---

## 1. Database Schema Changes

### Extend `profiles` table

Add columns to the existing `profiles` table to store profile preferences:

```sql
ALTER TABLE public.profiles
  ADD COLUMN bio text,
  ADD COLUMN username text UNIQUE,
  ADD COLUMN linkedin_url text,
  ADD COLUMN github_url text,
  ADD COLUMN is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN privacy_settings jsonb NOT NULL DEFAULT '{"showRadar":true,"showSkills":true,"showTimeline":true,"showTimelineDetails":true}'::jsonb,
  ADD COLUMN section_order text[] NOT NULL DEFAULT ARRAY['radar','skills','timeline'];
```

### RLS Policy for Public Access

Add a SELECT policy so unauthenticated users can view public profiles:

```sql
CREATE POLICY "Anyone can view public profiles"
  ON public.profiles FOR SELECT
  USING (is_public = true);
```

This allows the public profile page to load without authentication while keeping private profiles hidden.

### Auto-generate username on signup

Update the `handle_new_user` trigger function to auto-generate a username from the user's name + student ID fragment:

```sql
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
```

---

## 2. Profile Page -- Save Preferences to Database

### File: `src/pages/user/Profile.tsx`

- On mount, fetch profile data from the `profiles` table (bio, username, social links, privacy_settings, section_order, is_public)
- When user updates settings in the modal, persist to database via `supabase.from('profiles').update(...)`
- Remove dependency on `mockUser` for fields that are now persisted (bio, username, social links, privacy settings, section order)
- Keep mock data only for XP/skills/events (since those come from check-ins, not profile settings)

### File: `src/components/profile/PrivacySettingsModal.tsx`

- "Save Profile" button triggers a database update
- Privacy toggle changes auto-save (or batch save on modal close)
- Section reorder persists immediately

---

## 3. Public Profile Page

### New Route: `/p/:username`

Add a new route in `App.tsx`:
```
<Route path="/p/:username" element={<PublicProfile />} />
```

### New File: `src/pages/PublicProfile.tsx`

- Fetches profile by username from `profiles` table (public RLS policy allows this)
- Renders a read-only version of the profile using the same components (ProfileIdentityHeader, CompetencyRadar, SkillShowcase, ActivityTimeline)
- Passes `isOwner={false}` to hide edit controls
- Respects `privacy_settings` -- only shows zones the user has enabled
- Respects `section_order` for rendering sequence
- Shows a minimal header with "CMU Competency Passport" branding (no back/settings buttons)
- If profile not found or not public, shows a friendly 404-style message

---

## 4. Public URL Display Redesign (Identity Header)

### Current Problem
The Public URL bar takes up significant vertical space and looks utilitarian. Professional platforms like LinkedIn don't show a raw URL bar on the profile card -- they use subtle, contextual actions.

### New Design
Replace the URL bar with a minimal "Share" icon button next to the contact icons. When clicked, it copies the public URL and shows a toast.

```text
Before:
+------------------------------------------+
| [ExternalLink] cmu.ac.th/in/alex   [Copy]|
+------------------------------------------+

After:
[Mail] [LinkedIn] [GitHub] [Share]   <-- Share icon in the contact row
                                         Copies URL on click, toast confirms
```

- Remove the large URL bar entirely from the profile card
- Add a `Share2` (or `Link`) icon as the last contact icon
- On click: copy the real public URL (`{origin}/p/{username}`) to clipboard
- Show toast: "Profile link copied!"
- The full Copy URL functionality remains in the Settings Modal for detailed management

---

## 5. Radar Chart Professional Redesign

### Current Issues
- Uniform indigo stroke/fill lacks visual depth
- The chart feels flat and generic
- Colors don't communicate dimension identity

### New Design Approach

**Color Strategy:**
Use a single, refined color palette instead of the current flat indigo. The radar polygon should feel like a "data visualization" rather than a decorative element.

- Grid lines: `#e2e8f0` (slate-200) -- subtle, clean
- Polygon stroke: `#334155` (slate-700) -- strong, authoritative
- Polygon fill: `#334155` at 8% opacity -- subtle shading
- Data dots: Each dimension gets its own color from `DIMENSION_COLORS` (Violet, Rose, Amber, Emerald, Sky)
- Axis labels: `#475569` (slate-600) -- readable, professional
- Active dimension: Label becomes bold + colored, dot gets a glow ring

**Layout refinements:**
- Increase chart height slightly for breathing room
- Use thinner grid lines (strokeWidth 0.5) for a cleaner look
- Remove the heavy polygon fill, use a very light tint
- Add subtle tick marks on the polygon vertices using dimension colors

**Dimension Breakdown refinements:**
- Use softer border radius and padding
- Progress bars use gradient fills instead of solid colors
- Expanded detail cards use a left-colored border accent instead of full background tint

---

## File Change Summary

| File | Action | Key Changes |
|------|--------|-------------|
| Database migration | Create | Add columns to profiles, update trigger, add public RLS policy |
| `src/App.tsx` | Edit | Add `/p/:username` route |
| `src/pages/PublicProfile.tsx` | Create | Public read-only profile page |
| `src/pages/user/Profile.tsx` | Edit | Fetch/save profile from database |
| `src/components/profile/ProfileIdentityHeader.tsx` | Edit | Replace URL bar with Share icon in contact row |
| `src/components/profile/CompetencyRadar.tsx` | Edit | Professional color palette, refined grid, dimension-colored dots |
| `src/components/profile/PrivacySettingsModal.tsx` | Edit | Save to database, update public URL to use real route |

---

## Technical Details

### Profile Fetch/Save Hook Pattern
```typescript
// Fetch profile on mount
const { data: dbProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Save changes
await supabase
  .from('profiles')
  .update({
    bio: profileData.bio,
    linkedin_url: profileData.linkedinUrl,
    github_url: profileData.githubUrl,
    is_public: profileData.isPublic,
    privacy_settings: privacySettings,
    section_order: sectionOrder,
  })
  .eq('user_id', user.id);
```

### Public Profile Data Flow
```text
/p/:username --> fetch profile by username (public RLS) --> render read-only zones
```

### Share Button in Contact Row
```typescript
<button onClick={() => {
  navigator.clipboard.writeText(`${window.location.origin}/p/${profile.username}`);
  toast.success("Profile link copied!");
}}>
  <Share2 size={16} />
</button>
```

