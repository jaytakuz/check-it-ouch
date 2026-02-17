
# Comprehensive Functional Testing Plan -- Check-in System

## Objective
Systematically test every core functional requirement across the platform, document findings, and identify UX improvement opportunities.

---

## Test Environment Setup

**Prerequisites:**
- Two test accounts: Account A (Host + Attendee roles), Account B (Attendee only)
- One Incognito/private browser window for guest and public profile testing
- Test on both desktop (1920x1080) and mobile (390x844) viewports

---

## Test Suite 1: Authentication & Onboarding

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 1.1 | Sign Up | Go to `/auth`, switch to Sign Up mode, enter name/email/password, submit | Account created, redirect to `/role-select` |
| 1.2 | Sign Up -- validation | Submit with password < 6 chars, invalid email | Zod validation errors shown inline |
| 1.3 | Sign Up -- duplicate email | Sign up with an already registered email | Error toast: "This email is already registered" |
| 1.4 | Sign In | Switch to Login mode, enter valid credentials, submit | Redirect to `/dashboard` |
| 1.5 | Sign In -- invalid credentials | Enter wrong password | Error toast: "Invalid email or password" |
| 1.6 | Auth redirect -- already logged in | Visit `/auth` while authenticated | Auto-redirect to `/dashboard` (or `/role-select` if no roles) |
| 1.7 | Role Selection | After sign up, select "Attendee" role, click Continue | Role saved to `user_roles` table, redirect to `/dashboard` |
| 1.8 | Dual Role Selection | Select both Host + Attendee, choose primary view, Continue | Both roles saved, primary view preference dialog shown |
| 1.9 | Role guard | Visit `/role-select` when roles already exist | Auto-redirect to `/dashboard` |
| 1.10 | Unauthenticated guard | Visit `/dashboard` without login | Redirect to `/auth` |

---

## Test Suite 2: Host -- Event Creation

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 2.1 | Step 1 -- Event Type | Select "One-time Event" | Card highlighted, Continue button enabled |
| 2.2 | Step 1 -- Toggle selection | Click One-time, then Recurring | Selection switches, previous deselected |
| 2.3 | Step 2 -- Tracking Mode | Select "Full Tracking" | Card highlighted, eCertificate & Detailed logs badges visible |
| 2.4 | Step 3 -- Event Tier | Select "Practice" tier | Tier card highlighted with checkmark |
| 2.5 | Step 3 -- Form fill | Fill name, description, date, time, location (map pin), radius, max attendees, event tag | All fields populated correctly |
| 2.6 | Step 3 -- Event Tag | Type "Work" in tag field | Filtered dropdown shows "Workshop" suggestion |
| 2.7 | Step 3 -- Location picker | Click on map to set event location | Lat/lng captured, location marker shown |
| 2.8 | Step 3 -- Submit | Click "Create Event" with all required fields | Event saved to `events` table, redirect to `/dashboard`, success toast |
| 2.9 | Validation -- missing location | Submit without setting map location | Error toast: "Please set a location" |
| 2.10 | Validation -- missing date | One-time event without date | Error toast: "Please select a date" |

---

## Test Suite 3: Host -- Live Monitor & QR

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 3.1 | QR Generation | Navigate to `/host/monitor/{eventId}` for a live event | QR code displayed with CHECKIN-{eventId}-{secret}-{timestamp} format |
| 3.2 | QR Auto-refresh | Wait 7 seconds | QR code value changes, countdown resets to 7 |
| 3.3 | Check-in counter | Have another user check in | Real-time counter increments (via Supabase realtime subscription) |
| 3.4 | Tracking mode badge | Create Full Tracking event, open monitor | "Full Tracking" badge shown in header |
| 3.5 | Progress bar | Check in multiple users | Progress bar fills proportionally to max_attendees |

---

## Test Suite 4: Attendee -- Check-in Flow (Registered User)

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 4.1 | Scan entry | Navigate to `/scan`, click "Open Scanner" | Camera QR scanner opens |
| 4.2 | Valid QR scan | Scan a valid, fresh QR code from Live Monitor | Parsed successfully, navigate to `/checkin?code=...` |
| 4.3 | Expired QR | Scan a QR code older than 10 seconds | Error: "QR code has expired" |
| 4.4 | Invalid QR format | Scan a random QR code | Error: "Invalid QR code format" |
| 4.5 | Location verification | After valid scan, check GPS distance | Map shows user position relative to event, distance displayed |
| 4.6 | Within radius -- Check In | User is within radius_meters | Green "Check In" button enabled, submit succeeds |
| 4.7 | Outside radius -- Fail | User is outside radius | Failed screen: "You are outside the check-in radius" |
| 4.8 | Time window -- Fail | Scan QR outside event start_time/end_time | Failed screen: "Check-in window has closed" |
| 4.9 | Duplicate check-in | Check in twice on the same day | Failed screen: "You have already checked in today" |
| 4.10 | Success screen | Successful check-in | Green fullscreen with "VERIFIED", live timestamp, "Go to Dashboard" button |
| 4.11 | Host self-check-in blocked | Host scans their own event QR | Error toast: "Hosts cannot check into their own events" |

---

## Test Suite 5: Guest Check-in Flow

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 5.1 | Guest entry | Navigate to `/guest-join` from Landing page | "Join Event as Guest" UI shown |
| 5.2 | Count-only mode | Scan QR for a count-only event | Proceed directly to location verification (no registration form) |
| 5.3 | Full-tracking mode | Scan QR for a full-tracking event | Registration form appears (name + email required) |
| 5.4 | Guest check-in save | Complete guest check-in | Record saved to `guest_check_ins` table |
| 5.5 | Guest success screen | After successful check-in | Green success screen with guest name and event name |
| 5.6 | Scan routing | Scan from `/scan` while not logged in | Automatically routes to `/guest-join?code=...` |

---

## Test Suite 6: Host -- Attendance Logs

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 6.1 | Session tabs | Navigate to `/host/attendance/{eventId}` | Session dates shown as tabs, most recent first |
| 6.2 | Registered attendees table | Click a session date | Table shows name, check-in time, distance for registered users |
| 6.3 | Guest attendees table | Session with guest check-ins | Separate "Guest Attendees" section with name, email (if full tracking), time |
| 6.4 | Stats accuracy | Check Overall Stats cards | Total Sessions, Total Check-ins, Avg Attendance, Peak Attendance match data |
| 6.5 | Breakdown display | Events with both registered + guest check-ins | Breakdown card shows correct registered vs guest counts |

---

## Test Suite 7: Event Details

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 7.1 | Attendee view | Navigate to `/event/{eventId}` as attendee | Event info shown: name, host, schedule, location map, check-in stats |
| 7.2 | Host view | Navigate to `/host/event/{eventId}` as host | Edit button visible, certificate configuration tab available |
| 7.3 | Live badge | View event during active time window | "Live Now" badge displayed |
| 7.4 | Certificate config (host) | Enable certificate, upload template, set threshold | Settings saved to `events` table |
| 7.5 | Share event | Click share button | Native share dialog (or clipboard copy fallback) |

---

## Test Suite 8: Dashboard

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 8.1 | Role switcher | Toggle between Host and Attendee views | View changes, events filtered appropriately |
| 8.2 | View persistence | Switch to Host view, refresh page | Host view persists (localStorage) |
| 8.3 | Host quick actions | In Host view, click "Create Event" | Navigates to `/host/create-event` |
| 8.4 | Attendee quick actions | In Attendee view, click "Scan QR Code" | Navigates to `/checkin` |
| 8.5 | Host stats cards | In Host view | Active events count, total check-ins, avg rate displayed |
| 8.6 | Event cards | Both views | Events listed with status (live/upcoming/completed), date, time, location |
| 8.7 | Tag filtering | Enter a tag name in filter input | Only events with matching tag shown |
| 8.8 | Monitor Live button | Host view with a live event | Green "Monitor Live" button navigates to Live Monitor |
| 8.9 | Profile navigation | Click user icon | Navigates to `/user/profile` |

---

## Test Suite 9: Profile & Public Profile

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 9.1 | Own profile load | Navigate to `/user/profile` while logged in | Profile loads from database, shows Identity Header, Competency Radar, Skills, Timeline |
| 9.2 | Inline bio edit | Click pencil icon next to bio, type new bio | Bio updates inline, persists to `profiles` table |
| 9.3 | Settings modal | Click Settings gear icon | Modal opens with Profile Info, Public toggle, Privacy, Section Order, Roles, Sign Out |
| 9.4 | Save profile | Edit bio in modal, click "Save Profile" | Modal closes, data persisted to database |
| 9.5 | Privacy toggles | Toggle "Show Competency Radar" off | Radar section hidden from profile view |
| 9.6 | Section reorder | Move "Key Skills" above "Competency Radar" using arrows | Rendering order changes, persisted to database |
| 9.7 | Public profile toggle | Enable "Public Profile" | `is_public` set to true in database |
| 9.8 | Share link | Click Share icon in contact row | Public URL copied to clipboard, toast confirmation |
| 9.9 | Public profile access | Open `/user/profile/{username}` in Incognito (not logged in) | Profile loads read-only, no edit controls, "Login / Sign Up" CTA visible |
| 9.10 | Private profile guard | Disable "Public Profile", visit URL in Incognito | "Profile Not Found" page shown |
| 9.11 | Radar chart interaction | Click a dimension in Dimension Breakdown | Polygon color changes to dimension color, XP label appears, accordion expands |
| 9.12 | Skills "View All" | Click "View All" in Key Skills | Fullscreen dialog with vertical skill list |
| 9.13 | Activity filter multi-select | Click two tier filter buttons | Both tiers shown; clicking all three reverts to "All" |
| 9.14 | Certificate view | Click "Certified" badge on timeline event | Certificate dialog opens |
| 9.15 | Attendance dots limit | Event with > 5 attendance dots | Max 5 dots shown with "+N" overflow indicator |
| 9.16 | Add role from profile | Click "Add" on Host role in Settings | Host role added, toast confirmation |
| 9.17 | Sign out | Click "Sign Out" in Settings | Session cleared, redirect to Landing |

---

## Test Suite 10: Cross-cutting & Edge Cases

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|----------------|
| 10.1 | 404 page | Navigate to `/nonexistent` | NotFound page displayed |
| 10.2 | Legacy route redirects | Navigate to `/host/dashboard` | Redirects to `/dashboard` |
| 10.3 | Profile legacy routes | Navigate to `/p/{username}` or `/profile/{username}` | Redirects to unified profile |
| 10.4 | Mobile responsiveness | Test all pages at 390px width | No horizontal overflow, touch targets accessible, cards stack vertically |
| 10.5 | Network error handling | Disconnect network during check-in | Appropriate error toast shown |

---

## UX Observations & Improvement Recommendations

After completing the test suite, document findings in these categories:

### Category A: Navigation & Flow Friction
- Is the path from Landing to first check-in intuitive (fewer than 3 taps)?
- Does the role switcher on the dashboard feel discoverable?
- Are back buttons consistently placed and functional?

### Category B: Mobile Experience
- Are all touch targets at least 44x44px?
- Does the QR scanner overlay handle different screen sizes?
- Is the Radar Chart readable on small screens?
- Do modals (Settings, View All Skills) scroll properly on mobile?

### Category C: Feedback & Loading States
- Are loading spinners shown during every async operation?
- Do error states provide actionable guidance (not just "something went wrong")?
- Are success toasts consistent in tone and timing?

### Category D: Data Integrity
- Can a user check in twice if they rapidly tap the button?
- Does the QR expiry (10 seconds) match the refresh interval (7 seconds)?
- Are guest check-ins properly isolated from registered user check-ins?

### Category E: Public Profile Polish
- Does the public profile look professional enough for sharing on LinkedIn?
- Is the "Login / Sign Up" CTA prominent enough to convert visitors?
- Does the Radar Chart communicate competency effectively to a recruiter?

---

## Execution Notes

- Execute suites 1-3 first (Host flow) since they produce the data needed for suites 4-6 (Attendee flow)
- Suite 9 (Profile) can be tested independently at any time
- Document each test result as PASS / FAIL / PARTIAL with screenshots for failures
- After all suites complete, compile the UX observations into a prioritized improvement backlog
