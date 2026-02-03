
# CMU Student Competency Passport - Professional Edition Upgrade Plan

## Overview

This plan upgrades the current `/user/profile` page to a more professional, LinkedIn-inspired portfolio system. The changes focus on removing gamification elements, adding professional contact information, implementing privacy controls via a Settings Modal, and adding filter functionality to the Activity Timeline.

---

## Current State Analysis

### What We Have:
- Zone 1: Identity Header with Avatar, Name, ID, Faculty, Bio, Persona Badge, Public Toggle, Stats
- Zone 2: Competency Radar with 2-sided layout (Radar + Ranking)
- Zone 3: Skill Showcase with Pinning (max 5) and Verified badges
- Zone 4: Activity Timeline with Tier Badges and Attendance Strip
- Roles Section (Host/Attendee management)
- Sign Out button

### What Needs to Change:
1. Remove gamified "Persona Badge" from Identity Header
2. Add professional Contact Icons (Email, LinkedIn, GitHub)
3. Implement Privacy Settings Modal accessible via Settings gear
4. Add "Info Tooltip" explaining WEF framework to Radar
5. Change Skill Pinning from max 5 to max 3
6. Update skill tooltip text for industry standards
7. Add Filter Tabs to Activity Timeline (All | Participation | Practice | Implementation)
8. Soften Absent color from Red to Amber
9. Add Footer credit for taxonomy reference

---

## Implementation Plan

### Phase 1: Data Model Updates

**File: `src/data/profileMockData.ts`**

1. Update `UserProfile` interface to include contact information:
```typescript
interface UserProfile {
  // ... existing fields
  email?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  privacySettings: {
    showRadar: boolean;
    showSkills: boolean;
    showTimeline: boolean;
    showTimelineDetails: boolean;
  };
}
```

2. Update `TIER_CONFIG` labels and colors to match new naming:
   - Tier 1: "Participation" (Slate-100/600)
   - Tier 2: "Practice" (Blue-50/600) 
   - Tier 3: "Implementation" (Amber-50/700 with Star icon)

3. Update mock data with new contact fields and privacy defaults

---

### Phase 2: Privacy Settings Modal

**New File: `src/components/profile/PrivacySettingsModal.tsx`**

```text
+------------------------------------------+
|  Privacy Settings               [X]      |
+------------------------------------------+
|  Control what others see on your         |
|  public profile.                         |
|                                          |
|  [x] Show Competency Radar               |
|  [x] Show Key Skills                     |
|  [x] Show Activity Timeline              |
|  [ ] Show Timeline Details               |
|      (Attendance dots, certificates)     |
|                                          |
|  Public URL: cmu.ac.th/in/alex-651       |
|  [Copy Link]  [Preview Profile]          |
|                                          |
|  [Save Changes]                          |
+------------------------------------------+
```

**Features:**
- Toggle switches for each Zone visibility
- "Timeline Details" is a sub-option under Timeline
- Copy Link and Preview buttons
- Save confirmation toast

---

### Phase 3: Zone 0 - Navigation Updates

**File: `src/pages/user/Profile.tsx`**

Update header to:
- Change title: "My Profile" to "My Competency Passport"
- Settings gear icon opens the new Privacy Settings Modal
- Remove Roles section (move to separate Settings page in future)
- Keep Sign Out at very bottom

---

### Phase 4: Zone 1 - Professional Identity Header

**File: `src/components/profile/ProfileIdentityHeader.tsx`**

Changes:
1. **Remove** Persona Badge completely (cleaner professional look)
2. **Add** Contact Icons row:
   ```text
   [Mail icon] [LinkedIn icon] [GitHub icon]
   ```
   - Only show icons that have values
   - Clicking opens link/mailto
3. **Update** Public URL format: `cmu.ac.th/in/username` (LinkedIn-style /in/)
4. **Keep** Stats row (Total XP, Events, Certs)

---

### Phase 5: Zone 2 - Competency Radar Enhancement

**File: `src/components/profile/CompetencyRadar.tsx`**

Changes:
1. **Add** Info Tooltip next to title:
   ```text
   Competency Radar (i)
   
   Tooltip text:
   "The 5-Dimension Competency Framework is adapted from 
   the World Economic Forum's (WEF) Future of Jobs Report, 
   tailored to fit the student activity context."
   ```

2. Keep existing 2-sided layout and interaction logic
3. No other changes needed

---

### Phase 6: Zone 3 - Skill Showcase Updates

**File: `src/components/profile/SkillShowcase.tsx`**

Changes:
1. **Update** title: "Top Skills" to "Key Skills"
2. **Change** max pins from 5 to 3
3. **Update** Shield tooltip text:
   ```text
   "Industry Standard: [Skill Name] is aligned with 
   LinkedIn Skills Database to ensure market relevance."
   ```
4. **Update** legend: "Pinned (X/3)"

---

### Phase 7: Zone 4 - Activity Timeline Overhaul

**File: `src/components/profile/ActivityTimeline.tsx`**

Major Changes:

1. **Add** Filter Tabs (Segmented Control):
   ```text
   +------------------------------------------+
   |  Activity Log                            |
   |  [All] [Participation] [Practice] [Impl.]|
   +------------------------------------------+
   ```
   - Use Shadcn Tabs or custom toggle group
   - Filter based on `tierLevel`

2. **Update** Tier Badge styling:
   - Participation (Tier 1): `bg-slate-100 text-slate-600`
   - Practice (Tier 2): `bg-blue-50 text-blue-600`
   - Implementation (Tier 3): `bg-amber-50 text-amber-700` + Star icon

3. **Update** Attendance Strip colors (softer palette):
   - Present: `bg-emerald-500` (keep)
   - Absent: `bg-amber-300` (change from red to soft amber)
   - Upcoming/Future: `bg-slate-200`

4. **Update** tooltips:
   - "Session verified via Dynamic QR"

5. **Add** Footer Credit:
   ```text
   ─────────────────────────────────────────────
   Taxonomy developed by CMU Check-in Project,
   referencing frameworks from WEF and LinkedIn
   for educational purposes.
   ```

---

### Phase 8: Visual Design System Updates

**Color Palette Changes:**

| Element | Old Color | New Color |
|---------|-----------|-----------|
| Absent dot | `bg-destructive` (red) | `bg-amber-300` |
| Tier 1 badge | `bg-muted` | `bg-slate-100 text-slate-600` |
| Tier 2 badge | `bg-primary/10` | `bg-blue-50 text-blue-600` |
| Tier 3 badge | `bg-amber-500/10` | `bg-amber-50 text-amber-700` |
| Primary brand | current | Deep Indigo (keep) |

---

## File Change Summary

| File | Action | Changes |
|------|--------|---------|
| `src/data/profileMockData.ts` | Edit | Add contact fields, privacy settings, update tier config |
| `src/components/profile/PrivacySettingsModal.tsx` | **Create** | New modal component with toggle controls |
| `src/pages/user/Profile.tsx` | Edit | Add modal state, update header, remove roles section |
| `src/components/profile/ProfileIdentityHeader.tsx` | Edit | Remove persona, add contact icons, update URL format |
| `src/components/profile/CompetencyRadar.tsx` | Edit | Add WEF info tooltip |
| `src/components/profile/SkillShowcase.tsx` | Edit | Update title, max pins, tooltip text |
| `src/components/profile/ActivityTimeline.tsx` | Edit | Add filter tabs, update colors, add footer |

---

## Technical Implementation Details

### Filter Tabs Logic (ActivityTimeline)
```typescript
const [activeFilter, setActiveFilter] = useState<'all' | 1 | 2 | 3>('all');

const filteredActivities = useMemo(() => {
  if (activeFilter === 'all') return activities;
  return activities.filter(a => a.tierLevel === activeFilter);
}, [activities, activeFilter]);
```

### Privacy Settings State Management
- Initial implementation: Local state with mock persistence
- Future: Connect to Supabase `profiles` table

### Contact Icons Component
```typescript
const ContactIcons = ({ email, linkedin, github }) => (
  <div className="flex items-center gap-3">
    {email && <a href={`mailto:${email}`}><Mail /></a>}
    {linkedin && <a href={linkedin}><Linkedin /></a>}
    {github && <a href={github}><Github /></a>}
  </div>
);
```

---

## Migration Notes

- Persona Badge removal is intentional for professional appearance
- Max pins reduced from 5 to 3 for focused skill showcase
- Roles section should be moved to a dedicated `/user/settings` page in future iteration
- Privacy settings will need database persistence in production

---

## Expected Outcome

A clean, professional portfolio that:
1. Looks credible to HR/Recruiters (LinkedIn-inspired)
2. Provides evidence-based verification (GitHub-inspired)
3. Allows granular privacy control
4. Uses softer, more professional color palette
5. Credits the academic framework appropriately

ADDITIONAL CRITICAL REQUIREMENTS (Must Include):

1.  **Edit Profile Capability:**
    Inside the "Settings Modal" (Gear Icon), adds a section called "Profile Information".
    - Fields: Bio (Textarea, max 150 chars), LinkedIn URL (Input), GitHub URL (Input).
    - Logic: Use local state to simulate saving this data. When saved, Zone 1 should update immediately.

2.  **Navigation Safety Net:**
    Do NOT delete the "Sign Out" and "Switch Role" buttons completely.
    - Action: Move them to the BOTTOM of the "Settings Modal".
    - Style: Use a destructive/red color for "Sign Out" to keep it distinct from settings.

3.  **Mobile Responsiveness for Filters:**
    For the Zone 4 Activity Timeline Filters (Participation/Practice/Implementation):
    - Requirement: Ensure the tab container is "Horizontally Scrollable" with hidden scrollbars on mobile screens.
    - Constraint: Do not let the text wrap or break the layout on small screens.

4.  **Empty States:**
    - If the user has NO events in the Timeline, display a friendly empty state card: "No activities yet. Join your first event to start building your passport!"
    - If the Radar Chart has 0 data, show a gray placeholder polygon instead of nothing.