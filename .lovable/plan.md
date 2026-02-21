

# Plan: Restructure Create Event Form to Reduce Cognitive Overload

## Problem Analysis

Step 3 currently contains **6 distinct sections** with **10+ input fields** plus an interactive map, all on a single scrollable page. This violates Miller's Law (7 +/- 2 items) and creates decision fatigue, especially on mobile where the map alone occupies most of the viewport.

**Current structure (3 steps):**
- Step 1: Event Type (1 decision) -- Good
- Step 2: Tracking Mode (1 decision) -- Good
- Step 3: Everything else (10+ fields) -- Overloaded

## Proposed Structure (5 steps)

Reorganize into 5 steps following the principle of **progressive disclosure** -- each step groups logically related decisions with a clear mental model.

```text
Step 1: Event Type          (unchanged -- 1 decision)
Step 2: Tracking Mode       (unchanged -- 1 decision)
Step 3: Identity            (Name, Description, Tag, Tier -- "What is this event?")
Step 4: Schedule            (Date/Time/Days/Advanced -- "When does it happen?")
Step 5: Location & Finalize (Map, Radius, Attendees, eCert toggle, Submit -- "Where & how?")
```

### Why this grouping works

| Step | Mental Model | Fields | Cognitive Load |
|------|-------------|--------|---------------|
| 3 - Identity | "What is this event?" | Name, Description, Event Tag, Event Tier | 4 items (well within Miller's Law) |
| 4 - Schedule | "When does it happen?" | Date or Days + Time + End Repeat (or Advanced table) | 3-4 items, contextual to event type |
| 5 - Location & Finalize | "Where, and final settings" | Venue, Map picker, Radius slider, Max Attendees, eCert toggle, Submit | 5 items including the map as a focal element |

### Why Max Attendees moves to Step 5

"Expected Attendees" is a capacity/logistics concern that pairs naturally with the physical location context. When a host sees the venue on the map and sets the check-in radius, attendee count becomes a spatial-logistical decision rather than an abstract number buried among identity fields.

## Technical Changes

### 1. Update step count and navigation

- Change `totalSteps` from `3` to `5`
- Update `handleNextStep` to handle steps 1 through 4 (step 5 submits the form)
- Add validation gates:
  - `canProceedToStep4`: `formData.name` is not empty (event name is required)
  - `canProceedToStep5`: schedule fields are valid (date set for one-time, or days selected for recurring)

### 2. Step 3 -- Event Identity (new step)

Extract from current Step 3:
- Event Tier selection (the 3-column grid)
- Event Name input
- Description textarea
- Event Tag input with dropdown

This step uses the heading: **"Describe your event"** with subtitle **"Give your event an identity"**

### 3. Step 4 -- Schedule (new step)

Extract from current Step 3:
- The entire Schedule card (basic/advanced toggle for recurring)
- For one-time: Date + Start Time + End Time
- For recurring basic: Time + Days + End Repeat
- For recurring advanced: The session table with Add Session

This step uses the heading: **"Set the schedule"** with subtitle contextual to event type

### 4. Step 5 -- Location and Finalize (modified current step)

Retains:
- Location card (Venue input + Map picker + Radius slider)
- Max Attendees input (moved here from Identity)
- eCertificate toggle (only for full-tracking)
- Submit button "Create Event"

This step uses the heading: **"Set the location"** with subtitle **"Pin your event on the map and finalize"**

### 5. Summary badges update

The summary badges bar (showing selected Event Type, Tracking Mode, Tier) should appear on Steps 4 and 5, giving hosts a persistent reminder of their earlier choices without needing to go back.

### 6. Progress bar

The existing animated progress bar automatically adapts since it uses `(currentStep / totalSteps) * 100%`. No changes needed to the progress bar component itself.

## Files Modified

- `src/pages/host/CreateEvent.tsx` -- All changes are within this single file (restructure the step rendering and navigation logic)

## No Database or Backend Changes Required

This is a purely frontend restructuring. The `handleSubmit` function and all data sent to the database remain identical.

