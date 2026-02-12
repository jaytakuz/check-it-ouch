

# Professional Profile Redesign - Dynamic Visibility & Enhanced UX

## Problem Statement

The current `/user/profile` page functions as a competency passport but lacks the dynamic, owner-customizable feel of professional platforms like LinkedIn, Facebook, or Fastwork. Key issues include:

1. **Static layout** -- All zones render in a fixed order with no drag/reorder or section-level interactivity beyond hide/show.
2. **Zone 2 (Competency Framework)** has UX issues -- the Dimension Ranking list uses uniform indigo styling that lacks visual hierarchy, and the selected dimension tooltip overlaps the chart area.
3. **Color usage** in the radar and dimension selection does not differentiate dimensions from each other, making the chart feel monochromatic.
4. **No inline edit affordances** -- Users must open a separate modal to edit their bio/links, unlike LinkedIn where you can click-to-edit inline.
5. **Section ordering is rigid** -- Professional platforms let users reorder sections to prioritize what matters to them.

---

## Design Philosophy

Each section on the profile must earn its place by answering one of these questions for a recruiter/viewer:

| Zone | Question Answered | Reference Platform |
|------|------------------|-------------------|
| Identity Header | "Who is this person?" | LinkedIn profile card |
| Competency Radar | "What are their strengths?" | GitHub contribution graph (visual proof) |
| Key Skills | "What can they do?" | LinkedIn Skills & Endorsements |
| Activity Log | "What have they done?" | Fastwork portfolio / GitHub activity |

---

## Implementation Plan

### 1. Zone 1: Identity Header -- Add Inline Edit Mode

**File:** `src/components/profile/ProfileIdentityHeader.tsx`

**Changes:**
- Add an `isOwner` prop (default `true`) to conditionally show edit controls
- Add a subtle "Edit" pencil icon next to Bio that toggles inline editing (textarea appears in-place)
- Add inline edit for contact links (click icon to edit URL in a popover)
- Improve avatar area with a camera overlay on hover (owner view only)
- Change stats from generic icons to more meaningful labels: "Total XP" with a progress-style indicator, "Events Joined", "Certificates Earned"

**Rationale:** LinkedIn allows inline editing. The current flow (open modal to edit) adds friction. Inline edit reduces cognitive load for quick updates.

---

### 2. Zone 2: Competency Framework -- Complete Visual Overhaul

**File:** `src/components/profile/CompetencyRadar.tsx`

This is the highest-priority redesign zone. Current problems:
- All dimensions use the same indigo color -- no visual differentiation
- The dimension ranking list lacks clear visual hierarchy
- Selected state tooltip can overlap chart content
- No clear connection between chart segments and ranking items

**Changes:**

#### 2a. Dimension-Specific Color System
Assign each dimension a unique, professional color palette:

| Dimension | Color | Rationale |
|-----------|-------|-----------|
| Technology | Violet-500 | Tech/engineering association |
| Social | Rose-500 | People/warmth association |
| Cognitive | Amber-500 | Thinking/lightbulb association |
| Domain | Emerald-500 | Knowledge/growth association |
| Self-Efficacy | Sky-500 | Aspiration/clarity association |

These colors will be used consistently across:
- Radar chart dots (each dot gets its dimension color)
- Dimension ranking row highlight
- Selected state background

#### 2b. Dimension Ranking Redesign
Replace the current flat list with a more professional card-based layout:

```text
+------------------------------------------+
| Competency Framework          (i)         |
+------------------------------------------+
|                                           |
|    [Pentagon Radar Chart]                 |
|    (each axis dot in dimension color)     |
|                                           |
+------------------------------------------+
| Dimension Breakdown                       |
|                                           |
| [=====] Technology          28 XP   [>]  |
| [====]  Cognitive           19 XP   [>]  |
| [===]   Social              14 XP   [>]  |
| [==]    Self-Efficacy        6 XP   [>]  |
| [=]     Domain               5 XP   [>]  |
+------------------------------------------+
```

- Replace numbered rank badges with **horizontal progress bars** (filled proportionally to max score)
- Each bar uses the dimension's unique color
- Clicking a dimension expands a detail panel below (not overlay) showing the definition and contributing events
- Remove the trophy icon from "Dimension Ranking" header -- use "Dimension Breakdown" instead (more professional)

#### 2c. Layout Change
- On desktop: Keep 2-column (Radar left, Breakdown right)
- On mobile: Stack vertically (Radar on top, Breakdown below)
- Remove the floating tooltip overlay entirely -- move dimension details to an expandable row within the ranking list

#### 2d. Interaction Model
- Click a dimension row to expand its detail (accordion-style, one at a time)
- The expanded section shows: definition text, top contributing events (max 2), and XP breakdown by tier
- Corresponding radar dot gets a larger radius + glow ring when selected
- No overlapping tooltips -- all information is inline

---

### 3. Zone 3: Key Skills -- Minor Refinements

**File:** `src/components/profile/SkillShowcase.tsx`

**Changes:**
- Add category color coding to skill pills (match dimension colors from Zone 2 for consistency)
- Add a subtle "endorsement count" concept (mock: "3 events" shown as a small number badge)
- Keep existing pin logic (max 3)

---

### 4. Zone 4: Activity Log -- No Major Changes

Already well-implemented. Minor tweaks only:
- Ensure filter tab active state uses the corresponding tier color instead of generic primary

---

### 5. Privacy Settings Modal -- Add Section Reordering

**File:** `src/components/profile/PrivacySettingsModal.tsx`

**Changes:**
- Add a "Section Order" area where users can drag-to-reorder profile sections (Radar, Skills, Activity)
- Implement using simple up/down arrow buttons (no drag library needed) for simplicity
- Store order in local state as `sectionOrder: string[]`

**File:** `src/pages/user/Profile.tsx`

**Changes:**
- Add `sectionOrder` state that controls rendering order of zones 2-4
- Render sections dynamically based on order array
- Pass `isOwner` prop to ProfileIdentityHeader

---

### 6. Data Model Updates

**File:** `src/data/profileMockData.ts`

**Changes:**
- Add `DIMENSION_COLORS` constant mapping each dimension to its color palette
- Add `sectionOrder` to `UserProfile` interface
- Export dimension color config for reuse across components

---

## Technical Details

### Dimension Color Config (New Constant)
```typescript
export const DIMENSION_COLORS: Record<string, {
  primary: string;    // e.g. "#8b5cf6"
  bg: string;         // e.g. "bg-violet-50"
  text: string;       // e.g. "text-violet-600"
  border: string;     // e.g. "border-violet-200"
  fill: string;       // e.g. "#8b5cf6" for recharts
}> = {
  Technology: { primary: "#8b5cf6", bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", fill: "#8b5cf6" },
  Social: { primary: "#f43f5e", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", fill: "#f43f5e" },
  Cognitive: { primary: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", fill: "#f59e0b" },
  Domain: { primary: "#10b981", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", fill: "#10b981" },
  "Self-Efficacy": { primary: "#0ea5e9", bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", fill: "#0ea5e9" },
};
```

### Section Reorder Logic
```typescript
const [sectionOrder, setSectionOrder] = useState(['radar', 'skills', 'timeline']);

const sectionComponents = {
  radar: <CompetencyRadar ... />,
  skills: <SkillShowcase ... />,
  timeline: <ActivityTimeline ... />,
};

// Render in order
{sectionOrder.map(key => 
  privacySettings[visibilityKey] && sectionComponents[key]
)}
```

### Dimension Expansion (Accordion in CompetencyRadar)
```typescript
const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

// Click handler toggles expansion
const handleDimensionClick = (category: string) => {
  setExpandedDimension(prev => prev === category ? null : category);
};
```

---

## File Change Summary

| File | Action | Key Changes |
|------|--------|-------------|
| `src/data/profileMockData.ts` | Edit | Add `DIMENSION_COLORS`, `sectionOrder` to interface |
| `src/components/profile/CompetencyRadar.tsx` | Rewrite | Dimension colors, progress bars, accordion expansion, remove overlay tooltip |
| `src/components/profile/ProfileIdentityHeader.tsx` | Edit | Add `isOwner` prop, inline edit mode for bio |
| `src/components/profile/SkillShowcase.tsx` | Edit | Category color consistency |
| `src/components/profile/PrivacySettingsModal.tsx` | Edit | Add section reorder controls |
| `src/pages/user/Profile.tsx` | Edit | Dynamic section rendering, section order state |

---

## Expected Outcome

A professional, dynamic profile page where:
1. Each dimension has a distinct visual identity (color-coded throughout)
2. Users can reorder profile sections to prioritize their strengths
3. The Competency Framework uses inline expansion instead of overlapping tooltips
4. Inline editing reduces friction for profile updates
5. Visual hierarchy in Dimension Breakdown uses progress bars instead of rank numbers
6. The overall feel matches LinkedIn/Fastwork -- clean, trustworthy, and owner-customizable

