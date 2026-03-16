# CLAUDE.md — Competitor Tracking Dashboard

## Project Overview

Internal competitor tracking dashboard for Lemnisca (biotech/synthetic biology). Single user: Pushkar (founder). Daily 2-5 min usage for scanning competitive signals, occasional 10-15 min deep dives into competitor profiles.

Refer to `docs/prd_lite.md` and `docs/solution_design.md` for full product and technical specifications.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) — monolith, API routes + React frontend
- **Styling:** Tailwind CSS only (no component libraries, custom design, clean and data-dense)
- **Charts:** Recharts + custom SVG for heatmap and quadrant positioning maps
- **Database:** Supabase (PostgreSQL) with JS client (`@supabase/supabase-js`)
- **LLM:** Google Gemini API (`@google/generative-ai`)
  - `gemini-3.1-pro-preview` — deep analysis, landscape generation (quality-critical)
  - `gemini-3-flash-preview` — signal scanning, pattern summary, duplicate checking (speed-critical)
  - Google Search grounding enabled on all calls requiring current web information
- **Deployment:** Vercel with Vercel Cron
- **Auth:** Simple passcode gate via environment variable, cookie-based session

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
APP_PASSCODE
CRON_SECRET
```

---

## Database Schema

### competitors

id (UUID PK), name (TEXT), type (TEXT: 'direct'|'indirect'), one_liner (TEXT), strategic_context (TEXT), additional_context (TEXT), website_url (TEXT), date_added (TIMESTAMP), created_at (TIMESTAMP), updated_at (TIMESTAMP)

### competitor_analyses

id (UUID PK), competitor_id (UUID FK→competitors ON DELETE CASCADE), analysis_json (JSONB), generated_at (TIMESTAMP), created_at (TIMESTAMP)

analysis_json structure:

```json
{
  "company_overview": "",
  "product_technology": "",
  "swot": {
    "strengths": [],
    "weaknesses": [],
    "opportunities": [],
    "threats": []
  },
  "market_positioning": "",
  "funding_investors": "",
  "go_to_market": "",
  "customers_pilots_partnerships": "",
  "infrastructure_manufacturing": "",
  "leadership_team": "",
  "threat_assessment": "",
  "landscape_position": { "axes": [], "position": {} }
}
```

### competitor_sources

id (UUID PK), competitor_id (UUID FK→competitors ON DELETE CASCADE), url (TEXT), source_label (TEXT: 'linkedin'|'twitter'|'blog'|'careers'|'crunchbase'|'other'), created_at (TIMESTAMP)

### signals

id (UUID PK), competitor_id (UUID FK→competitors ON DELETE CASCADE), headline (TEXT), category_id (UUID FK→signal_categories), date_observed (DATE), source_urls (TEXT[]), source_type (TEXT: 'official_announcement'|'news_article'|'linkedin'|'job_board'|'conversation'|'sec_regulatory'|'conference'|'other'), llm_summary (TEXT), strategic_note (TEXT), is_flagged (BOOLEAN default false), is_read (BOOLEAN default false), feedback (TEXT: null|'up'|'down'), source (TEXT: 'automated'|'manual'), created_at (TIMESTAMP), updated_at (TIMESTAMP)

### signal_comments

id (UUID PK), signal_id (UUID FK→signals ON DELETE CASCADE), content (TEXT), created_at (TIMESTAMP)

### signal_categories

id (UUID PK), name (TEXT UNIQUE), is_default (BOOLEAN), created_at (TIMESTAMP)

Default categories: Fundraising, Hiring, Leadership, Partnership, Launch, Pilot/Customer, Plant/Infrastructure, Positioning, Regulatory/IP, Media/PR, Litigation

### lemnisca_profile

id (UUID PK), description (TEXT), current_stage (TEXT), differentiators (TEXT), technology_focus (TEXT), market_positioning (TEXT), funding_status (TEXT), team_strengths (TEXT), strategic_priorities (TEXT), updated_at (TIMESTAMP)

Single row, seeded on first deploy.

### Indexes

```sql
CREATE INDEX idx_signals_competitor ON signals(competitor_id);
CREATE INDEX idx_signals_category ON signals(category_id);
CREATE INDEX idx_signals_date_observed ON signals(date_observed DESC);
CREATE INDEX idx_signals_is_read ON signals(is_read);
CREATE INDEX idx_competitor_analyses_competitor ON competitor_analyses(competitor_id);
CREATE INDEX idx_competitor_sources_competitor ON competitor_sources(competitor_id);
```

---

## API Routes

### Auth

POST /api/auth/verify — verify passcode, set cookie
GET /api/auth/check — check session

### Competitors

GET /api/competitors — list all
GET /api/competitors/[id] — get with latest analysis
POST /api/competitors — add (triggers analysis + initial scan)
DELETE /api/competitors/[id] — remove with cascade

### Competitor Sources

GET /api/competitors/[id]/sources — list tracked sources
POST /api/competitors/[id]/sources — add tracked source
DELETE /api/competitors/[id]/sources/[sourceId] — remove

### Signals

GET /api/signals — list (filters: competitor_id, category_id, is_read, is_flagged, date range)
POST /api/signals — manual add
PATCH /api/signals/[id] — update (flag, feedback, read status, note)
GET /api/signals/[id]/comments — get comments
POST /api/signals/[id]/comments — add comment

### Categories

GET /api/categories — list all
POST /api/categories — add custom

### Lemnisca Profile

GET /api/lemnisca — get
PUT /api/lemnisca — update

### LLM-Powered

POST /api/analyze/[competitor_id] — generate/refresh deep analysis
POST /api/scan — trigger signal scan for all competitors
GET /api/patterns — generate pattern summary
POST /api/landscape — generate landscape positioning data
POST /api/signals/check-duplicate — check for duplicates

### Cron

GET /api/cron/scan — triggered by Vercel Cron at 01:30 UTC and 13:30 UTC (7 AM and 7 PM IST)

---

## LLM Service Functions

All LLM calls use Google Gemini with `@google/generative-ai` SDK. Enable Google Search grounding (`google_search` tool) on calls that need current web data. All prompts request JSON-only output. Extract source URLs from grounding metadata.

### generateCompetitorAnalysis(name, url, context, lemniscaProfile)

Model: gemini-3.1-pro-preview + search grounding
Output: analysis_json matching schema above
Include Lemnisca profile in prompt for relative SWOT and threat assessment.

### scanForSignals(competitors[])

Model: gemini-3-flash-preview + search grounding
Input includes: competitor tracked sources (check these first), recent signal headlines (for dedup)
Output: array of signal objects

### generatePatternSummary(recentSignals[])

Model: gemini-3-flash-preview (no search)
Output: markdown text with cross-competitor trend observations

### generateLandscapeData(competitors[], analyses[], lemniscaProfile, customAxes?)

Model: gemini-3.1-pro-preview (no search)
Output: JSON with axis definitions + position coordinates for each entity

### checkDuplicateSignal(newSignal, existingSignals[])

Model: gemini-3-flash-preview (no search)
Output: { isDuplicate, similarSignal, explanation }

---

## Five Views

### 1. Landing Page (/) — daily scan surface

- Competitor activity heatmap (rows=competitors, columns=time periods, intensity=signal volume)
- LLM pattern summary (cross-competitor trends)
- Signal feed (newest first, unread highlighted, thumbs up/down, flag, comments)
- "Refresh feed" button (triggers same scan as cron)
- Manual signal logging form

### 2. Competitor Profile (/competitors/[id]) — deep dive

- Full analysis in collapsible sections (Company Overview, Product/Tech, SWOT, Positioning, Funding, GTM, Customers, Infrastructure, Leadership, Threat Assessment, Landscape Position Chart)
- Signal timeline for this competitor
- Strategic notes
- Tracked sources management
- "Refresh analysis" button

### 3. Category Filter (/categories) — pattern exploration

- Filter signals by category across all competitors

### 4. Competitive Landscape (/landscape) — strategic view

- Positioning maps / quadrant charts with all competitors + Lemnisca
- Auto-generated axes + custom axis text input

### 5. Lemnisca Profile (/lemnisca) — self-assessment

- Editable form for Lemnisca's own profile
- Reference point for all comparative analyses

---

## Frontend Structure

```
app/
├── page.tsx                        # Passcode entry
├── dashboard/
│   ├── layout.tsx                  # Sidebar nav + top bar
│   ├── page.tsx                    # Landing page
│   ├── competitors/
│   │   ├── page.tsx                # Competitor list
│   │   ├── [id]/page.tsx           # Competitor profile
│   │   └── add/page.tsx            # Add competitor
│   ├── categories/page.tsx         # Category filter
│   ├── landscape/page.tsx          # Competitive landscape
│   └── lemnisca/page.tsx           # Lemnisca profile
```

---

## Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scan",
      "schedule": "30 1,13 * * *"
    }
  ]
}
```

---

## Design Direction

- **Aesthetic:** Modern, minimal, professional SaaS dashboard. Think Linear, Vercel Dashboard, Raycast — clean geometry, intentional spacing, quiet confidence.
- **Color palette:** Dark theme primary. Deep navy/charcoal background (#0a0a0f or similar), subtle borders (#1a1a2e), accent color for interactive elements (cool blue or teal). Category tags get distinct muted colors. Heatmap uses intensity gradients (dark → vibrant).
- **Typography:** Clean sans-serif (Inter or system font stack). Strong hierarchy — large bold headings, medium weight subheads, regular body text. Use font size and weight for hierarchy, not color alone.
- **Layout:** Sidebar navigation (collapsible), content area with generous but purposeful spacing. Cards with subtle borders or soft shadows, not heavy boxes. Grid-based layouts for data.
- **Tailwind CSS only** — no component libraries. Custom components, hand-crafted feel.
- **Mobile responsive:** Sidebar collapses to bottom tab bar. Cards stack vertically. Heatmap scrolls horizontally. Forms become full-screen modals. All touch targets min 44px.

## UI Principles

- **Information density over whitespace** — this is a data tool, not a marketing page. Pack information meaningfully but never cluttered.
- **Scannable at a glance** — Pushkar should understand the state of his competitive landscape in under 10 seconds on the landing page. Use visual hierarchy aggressively.
- **Visual encoding** — heatmap intensity, color-coded category tags, bold/subtle contrast for read/unread signals. The UI should communicate before the user reads text.
- **Micro-interactions** — smooth hover states, subtle transitions on collapsible sections, gentle fade-ins on data load. Nothing flashy, just polished.
- **Loading states everywhere** — all LLM-powered operations take seconds. Use skeleton loaders, shimmer effects, or progress indicators. Never show a blank screen during generation.
- **Empty states matter** — when there are no signals yet or no competitors added, show helpful prompts that guide the user, not blank voids.
- **Collapsible by default** — competitor profile sections should be collapsed on load with clear headers. Expand on click. Don't overwhelm on first view.
- **Consistent component patterns** — signal cards, competitor cards, category tags, action buttons should all follow a unified design language across views.
- **Subtle depth** — use layering with slight background differences, soft shadows, and border treatments to create visual separation without hard lines.
- **Feedback is immediate** — thumbs up/down, flag toggle, read status changes should reflect instantly in the UI with subtle animations. Optimistic updates.

---

## Critical Rules

- All signals go directly to feed (no approval queue). Unread signals highlighted. Thumbs up/down for feedback.
- One real-world event can produce multiple signals across categories.
- AI does NOT judge signal severity. Pushkar flags manually.
- Source type acts as implicit credibility signal — no explicit scoring.
- Lemnisca profile is manually maintained and used as reference for all comparative analysis.
- On competitor deletion: confirm first, then cascade delete all signals, analyses, sources.
- Duplicate check on manual signal entry: if similar exists, show it and ask keep both or replace.
- Signal categories are extensible by user.
- Landscape charts include Lemnisca as a special entity.
