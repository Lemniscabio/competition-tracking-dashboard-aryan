# Solution Design Doc — Competitor Tracking Dashboard

**Product:** Competitor Tracking Dashboard

---

## 1. Architecture Overview

Full-stack web application using a monolithic architecture. A single Next.js application handles both the frontend UI and backend API routes.

```
┌────────────────────────────────────────────────────┐
│                   Client (Browser)                  │
│         Next.js Frontend — React + Tailwind         │
└─────────────────────┬──────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────────┐
│              Next.js API Routes (Backend)           │
│                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ CRUD APIs │  │ LLM      │  │ Cron Endpoint    │ │
│  │           │  │ Services │  │ (scheduled scan) │ │
│  └──────────┘  └────┬─────┘  └────────┬─────────┘ │
│                     │                  │           │
└─────────────────────┼──────────────────┼───────────┘
                      │                  │
              ┌───────▼───────┐          │
              │  Google       │          │
              │  Gemini API   │          │
              │  (+ Google    │          │
              │  Search       │          │
              │  grounding)   │          │
              └───────────────┘          │
                                         │
              ┌──────────────────────────▼───────────┐
              │          Supabase (PostgreSQL)        │
              │                                      │
              │  competitors | signals | categories  │
              │  lemnisca_profile | analyses          │
              │  signal_feedback                     │
              └──────────────────────────────────────┘

              ┌──────────────────────────────────────┐
              │            Vercel Cron                │
              │      (triggers /api/cron/scan         │
              │         twice daily)                  │
              └──────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 14 (App Router) | Full-stack in one project. API routes + React frontend. Fast deployment on Vercel. |
| Frontend | React + Tailwind CSS | Tailwind gives rapid, responsive UI. Utility-first approach. |
| Charts / Visualizations | Recharts + custom SVG | Recharts for standard charts (bar, line). Custom SVG/HTML for heatmap and quadrant positioning maps. |
| Database | Supabase (PostgreSQL) | Hosted PostgreSQL with instant setup. JS client. Free tier sufficient. JSONB support for flexible analysis storage. |
| LLM | Google Gemini 3 API (gemini-3.1-pro-preview + gemini-3-flash-preview) | Best-in-class reasoning for deep analysis (3.1 Pro), fast and cost-effective for routine tasks (3 Flash). Google Search grounding built-in. |
| Web Search | Gemini Google Search grounding | Built into the Gemini API as a tool. Returns source URLs with grounding metadata. |
| Deployment | Vercel | Native Next.js support. Vercel Cron for scheduled jobs. |
| Cron | Vercel Cron | Triggers API routes on a schedule. Twice-daily execution. |
| Auth | Simple passcode middleware | Environment variable stores the passcode. Cookie-based session after entry. |

---

## 3. Data Model

### 3.1 Tables

**competitors**
```
id              UUID        PRIMARY KEY, auto-generated
name            TEXT        NOT NULL
type            TEXT        NOT NULL ('direct' | 'indirect')
one_liner       TEXT        why this competitor matters
strategic_context TEXT      Pushkar's reasoning
additional_context TEXT     optional context provided at addition
website_url     TEXT
date_added      TIMESTAMP   DEFAULT now()
created_at      TIMESTAMP   DEFAULT now()
updated_at      TIMESTAMP   DEFAULT now()
```

**competitor_analyses**
```
id              UUID        PRIMARY KEY, auto-generated
competitor_id   UUID        FOREIGN KEY → competitors.id, ON DELETE CASCADE
analysis_json   JSONB       full analysis stored as structured JSON
generated_at    TIMESTAMP   when this analysis was generated
created_at      TIMESTAMP   DEFAULT now()
```

The analysis_json field stores a structured object with keys for each section:
```json
{
  "company_overview": "...",
  "product_technology": "...",
  "swot": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "threats": ["..."]
  },
  "market_positioning": "...",
  "funding_investors": "...",
  "go_to_market": "...",
  "customers_pilots_partnerships": "...",
  "infrastructure_manufacturing": "...",
  "leadership_team": "...",
  "threat_assessment": "...",
  "landscape_position": {
    "axes": [...],
    "position": {...}
  }
}
```

**competitor_sources**
```
id              UUID        PRIMARY KEY, auto-generated
competitor_id   UUID        FOREIGN KEY → competitors.id, ON DELETE CASCADE
url             TEXT        NOT NULL
source_label    TEXT        NOT NULL ('linkedin' | 'twitter' | 'blog' | 'careers' | 'crunchbase' | 'other')
created_at      TIMESTAMP   DEFAULT now()
```

These are priority URLs that the LLM checks first during signal scanning. Pushkar can add/remove tracked sources for any competitor at any time.

**signals**
```
id              UUID        PRIMARY KEY, auto-generated
competitor_id   UUID        FOREIGN KEY → competitors.id, ON DELETE CASCADE
headline        TEXT        NOT NULL, one-liner
category_id     UUID        FOREIGN KEY → signal_categories.id
date_observed   DATE        NOT NULL
source_urls     TEXT[]      array of URLs
source_type     TEXT        NOT NULL ('official_announcement' | 'news_article' | 'linkedin' | 'job_board' | 'conversation' | 'sec_regulatory' | 'conference' | 'other')
llm_summary     TEXT        LLM-generated summary paragraph
strategic_note  TEXT        Pushkar's note (optional)
is_flagged      BOOLEAN     DEFAULT false
is_read         BOOLEAN     DEFAULT false
feedback        TEXT        NULL | 'up' | 'down'
source          TEXT        'automated' | 'manual'
created_at      TIMESTAMP   DEFAULT now()
updated_at      TIMESTAMP   DEFAULT now()
```

**signal_comments**
```
id              UUID        PRIMARY KEY, auto-generated
signal_id       UUID        FOREIGN KEY → signals.id, ON DELETE CASCADE
content         TEXT        NOT NULL
created_at      TIMESTAMP   DEFAULT now()
```

**signal_categories**
```
id              UUID        PRIMARY KEY, auto-generated
name            TEXT        NOT NULL, UNIQUE
is_default      BOOLEAN     DEFAULT false
created_at      TIMESTAMP   DEFAULT now()
```

Default categories seeded on first deployment:
Fundraising, Hiring, Leadership, Partnership, Launch, Pilot/Customer, Plant/Infrastructure, Positioning, Regulatory/IP, Media/PR, Litigation

**lemnisca_profile**
```
id              UUID        PRIMARY KEY, auto-generated
description     TEXT        one-liner + detail
current_stage   TEXT
differentiators TEXT
technology_focus TEXT
market_positioning TEXT
funding_status  TEXT
team_strengths  TEXT
strategic_priorities TEXT
updated_at      TIMESTAMP   DEFAULT now()
```

Single row. Created on first deployment with empty/placeholder values. Updated by Pushkar.

### 3.2 Indexes

```sql
CREATE INDEX idx_signals_competitor ON signals(competitor_id);
CREATE INDEX idx_signals_category ON signals(category_id);
CREATE INDEX idx_signals_date_observed ON signals(date_observed DESC);
CREATE INDEX idx_signals_is_read ON signals(is_read);
CREATE INDEX idx_competitor_analyses_competitor ON competitor_analyses(competitor_id);
CREATE INDEX idx_competitor_sources_competitor ON competitor_sources(competitor_id);
```

### 3.3 Relationships

```
competitors 1 ──── * signals
competitors 1 ──── * competitor_analyses (latest one is active)
competitors 1 ──── * competitor_sources (tracked URLs)
signals     * ──── 1 signal_categories
signals     1 ──── * signal_comments
```

---

## 4. API Routes

### 4.1 Auth

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/auth/verify | Verify passcode, set session cookie |
| GET | /api/auth/check | Check if session is valid |

### 4.2 Competitors

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/competitors | List all competitors |
| GET | /api/competitors/[id] | Get competitor with latest analysis |
| POST | /api/competitors | Add competitor → triggers analysis + initial scan |
| DELETE | /api/competitors/[id] | Remove competitor + cascade delete signals |

### 4.3 Competitor Sources

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/competitors/[id]/sources | List tracked sources for a competitor |
| POST | /api/competitors/[id]/sources | Add a tracked source (URL + label) |
| DELETE | /api/competitors/[id]/sources/[sourceId] | Remove a tracked source |

### 4.4 Signals

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/signals | List signals (supports filters: competitor_id, category_id, is_read, is_flagged, date range) |
| POST | /api/signals | Manually add a signal |
| PATCH | /api/signals/[id] | Update signal (flag, feedback, read status, strategic note) |
| GET | /api/signals/[id]/comments | Get comments for a signal |
| POST | /api/signals/[id]/comments | Add comment to a signal |

### 4.5 Signal Categories

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/categories | List all categories |
| POST | /api/categories | Add custom category |

### 4.6 Lemnisca Profile

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/lemnisca | Get current profile |
| PUT | /api/lemnisca | Update profile |

### 4.7 LLM-Powered Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/analyze/[competitor_id] | Generate / refresh deep analysis |
| POST | /api/scan | Trigger signal scan for all competitors (used by cron + refresh button) |
| GET | /api/patterns | Generate pattern summary from stored signals |
| POST | /api/landscape | Generate landscape positioning data |
| POST | /api/signals/check-duplicate | Check for duplicate signals before manual entry |

### 4.8 Cron

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/cron/scan | Triggered by Vercel Cron twice daily. Calls internal scan logic. Protected by cron secret. |

---

## 5. LLM Integration Design

### 5.1 Core Principle

All LLM interactions use Google Gemini API with Google Search grounding enabled. The LLM is instructed to search the web, gather information, and return structured JSON output that the application parses and stores. Grounding metadata provides source URLs for attribution.

### 5.2 LLM Service Functions

**generateCompetitorAnalysis(competitorName, websiteUrl, additionalContext, lemniscaProfile)**
- Input: competitor details + Lemnisca profile for comparative analysis
- Process: Gemini with Google Search grounding searches the web for comprehensive information about the competitor, then generates a structured analysis following the defined frameworks
- Output: structured JSON matching the analysis_json schema
- Model: gemini-3.1-pro-preview (best reasoning for comprehensive analysis)
- Prompt includes: company overview, product/tech, SWOT (relative to Lemnisca), positioning, funding, GTM, customers, infrastructure, leadership, threat assessment, landscape position data
- Source URLs extracted from grounding metadata and stored
- Used by: POST /api/competitors, POST /api/analyze/[id]

**scanForSignals(competitors[])**
- Input: array of competitor objects (name, website, tracked sources, existing signals for dedup)
- Process: for each competitor, Gemini with Google Search grounding is given the competitor's tracked source URLs (LinkedIn, Twitter, blog, careers page, etc.) as priority sources to check first, then performs a general web search for recent news, announcements, hiring, funding, partnerships, etc. Categorizes findings and generates summaries.
- Output: array of candidate signal objects matching the signals schema
- Model: gemini-3-flash-preview (fast and cost-effective for routine scanning)
- Deduplication: prompt includes recent existing signal headlines so Gemini avoids duplicating known information
- Source URLs extracted from grounding metadata
- Used by: POST /api/scan, GET /api/cron/scan

**generatePatternSummary(recentSignals[])**
- Input: array of recent signals across all competitors
- Process: Gemini analyzes the signals for cross-competitor patterns, trends, and notable clusters
- Output: markdown text with pattern observations
- Model: gemini-3-flash-preview (no search needed, reads stored data)
- Used by: GET /api/patterns

**generateLandscapeData(competitors[], analyses[], lemniscaProfile, customAxes?)**
- Input: all competitor profiles, their analyses, Lemnisca profile, optional custom axis prompt
- Process: Gemini determines appropriate axes (or uses custom ones), scores each competitor + Lemnisca on those axes
- Output: structured JSON with axis definitions and position coordinates for each entity
- Model: gemini-3.1-pro-preview (needs strong reasoning for accurate positioning)
- Used by: POST /api/landscape

**checkDuplicateSignal(newSignal, existingSignals[])**
- Input: the signal being added + existing signals for that competitor
- Process: Gemini checks if the new signal is substantially similar to any existing signal
- Output: { isDuplicate: boolean, similarSignal: signal | null, explanation: string }
- Model: gemini-3-flash-preview (simple comparison task)
- Used by: POST /api/signals/check-duplicate

### 5.3 Prompt Engineering Notes

- All prompts request JSON-only output (no markdown wrapping). Use Gemini's structured output mode where possible.
- System prompts include the signal category definitions so the LLM categorizes consistently
- SWOT analysis prompt includes the current Lemnisca profile so the analysis is relative, not generic
- Signal scanning prompts include recent signal headlines to prevent duplication
- Google Search grounding tool enabled on all LLM calls that require current information
- Grounding metadata (source URLs, confidence scores) extracted and stored with signals
- Error handling: if LLM returns malformed JSON, retry once with a stricter prompt. If still fails, log error and surface to user.

### 5.4 Cost and Rate Considerations

Estimated LLM usage per operation:
- Deep analysis generation: ~1 call with Google Search grounding (heavy)
- Signal scan per competitor: ~1 call with Google Search grounding
- Full scan (15 competitors): ~15 calls — batch with small delays
- Pattern summary: ~1 call (no search grounding, reads stored data only)
- Landscape generation: ~1 call (no search grounding, reads stored analysis data)
- Duplicate check: ~1 call (no search grounding, compares text)

Use gemini-3-flash-preview for cost efficiency on routine tasks (signal scanning, duplicate checks). Use gemini-3.1-pro-preview for deep analysis and landscape generation where quality matters. Batch scan calls with 1-second delays to avoid rate limits.

---

## 6. Processing Flows

### 6.1 Add Competitor Flow

```
Pushkar enters: name, type, one-liner, website URL, optional context, tracked source URLs
        │
        ▼
    Save competitor to DB
        │
        ▼
    Save tracked sources to competitor_sources table
        │
        ▼
    Fetch Lemnisca profile from DB
        │
        ▼
    Call generateCompetitorAnalysis()
    (LLM + Google Search grounding → structured analysis)
        │
        ▼
    Store analysis_json in competitor_analyses table
        │
        ▼
    Call scanForSignals() for this single competitor
    (LLM checks tracked sources first, then general web search → candidate signals)
        │
        ▼
    Store signals in signals table (marked as unread)
        │
        ▼
    Return complete competitor profile to frontend
```

### 6.2 Twice-Daily Automated Scan Flow

```
Vercel Cron triggers GET /api/cron/scan
        │
        ▼
    Verify cron secret header
        │
        ▼
    Fetch all competitors from DB (with their tracked sources)
        │
        ▼
    For each competitor, fetch recent signals (last 30 days for dedup context)
        │
        ▼
    Call scanForSignals(competitors)
    (batched — one LLM call per competitor with delays)
    (LLM checks tracked sources first, then general web search)
        │
        ▼
    For each candidate signal:
      - Check against existing signals for dedup
      - If new → insert into signals table (marked unread, source: 'automated')
      - If duplicate → skip
        │
        ▼
    Log scan completion timestamp
```

### 6.3 Manual Signal Logging Flow

```
Pushkar fills signal form: competitor, category, headline, source URL, source type, note
        │
        ▼
    Call checkDuplicateSignal() against existing signals for that competitor
        │
        ▼
    If duplicate found:
      - Show existing signal to Pushkar
      - Ask: keep both or replace?
      - Proceed based on choice
    If no duplicate:
      - Proceed
        │
        ▼
    If source URL provided:
      - Call LLM to generate summary paragraph from source
    If no URL:
      - Use headline + note as summary basis
        │
        ▼
    Insert signal into DB (source: 'manual', marked as read)
```

### 6.4 Refresh Deep Analysis Flow

```
Pushkar clicks "Refresh Analysis" on competitor profile
        │
        ▼
    Fetch competitor details from DB
        │
        ▼
    Fetch current Lemnisca profile from DB
        │
        ▼
    Call generateCompetitorAnalysis()
    (LLM + Google Search grounding → new analysis)
        │
        ▼
    Insert new analysis row in competitor_analyses
    (old analysis preserved for history — latest is always used)
        │
        ▼
    Return updated profile to frontend
```

### 6.5 Landing Page Load Flow

```
Pushkar opens dashboard
        │
        ▼
    Verify passcode session
        │
        ▼
    Parallel fetch:
    ├── GET /api/signals (unread signals first, then recent read signals)
    ├── GET /api/patterns (LLM generates pattern summary from stored signals)
    └── Heatmap data (aggregated signal counts by competitor × time period)
        │
        ▼
    Render:
    1. Heatmap (top)
    2. Pattern summary
    3. Signal feed (unread highlighted)
```

### 6.6 Landscape View Flow

```
Pushkar opens Competitive Landscape view (or provides custom axes)
        │
        ▼
    Fetch all competitors + latest analyses from DB
        │
        ▼
    Fetch Lemnisca profile from DB
        │
        ▼
    Call generateLandscapeData(competitors, analyses, lemniscaProfile, customAxes?)
        │
        ▼
    Return axis definitions + position coordinates
        │
        ▼
    Frontend renders quadrant / positioning charts
```

---

## 7. Frontend Structure

### 7.1 Page Layout

```
app/
├── page.tsx                    # Passcode entry screen
├── dashboard/
│   ├── layout.tsx              # Shared layout — sidebar navigation + top bar
│   ├── page.tsx                # Landing page — heatmap + patterns + signal feed
│   ├── competitors/
│   │   ├── page.tsx            # Competitor list
│   │   ├── [id]/page.tsx       # Competitor profile — deep analysis + signal timeline
│   │   └── add/page.tsx        # Add competitor form
│   ├── categories/
│   │   └── page.tsx            # Category filter view
│   ├── landscape/
│   │   └── page.tsx            # Competitive landscape — positioning maps
│   └── lemnisca/
│       └── page.tsx            # Lemnisca profile — edit self-assessment
```

### 7.2 Key Components

```
components/
├── auth/
│   └── PasscodeGate.tsx            # Passcode entry form
├── signals/
│   ├── SignalFeed.tsx               # Signal list with unread highlighting
│   ├── SignalCard.tsx               # Individual signal display
│   ├── SignalForm.tsx               # Manual signal logging form
│   ├── SignalComments.tsx           # Comments thread on a signal
│   ├── DuplicatePrompt.tsx         # "Similar signal exists" dialog
│   └── FeedbackButtons.tsx         # Thumbs up/down + flag toggle
├── competitors/
│   ├── CompetitorCard.tsx           # Competitor summary card for list view
│   ├── CompetitorProfile.tsx        # Full profile container
│   ├── AnalysisSection.tsx          # Collapsible section for each analysis area
│   ├── AddCompetitorForm.tsx        # Form with name, type, URL, context, tracked sources
│   ├── CompetitorSources.tsx        # Manage tracked sources
│   └── CompetitorTimeline.tsx       # Signal timeline for one competitor
├── landscape/
│   ├── PositioningMap.tsx           # Quadrant chart component
│   ├── CustomAxisInput.tsx          # Text field for custom axis prompts
│   └── LandscapeView.tsx           # Full landscape page container
├── heatmap/
│   └── ActivityHeatmap.tsx          # Competitor × time heatmap grid
├── patterns/
│   └── PatternSummary.tsx           # LLM-generated trend summary display
├── lemnisca/
│   └── LemniscaProfileForm.tsx      # Editable Lemnisca self-assessment
└── shared/
    ├── Navigation.tsx               # Sidebar nav
    ├── CategoryTag.tsx              # Colored category badge
    ├── LoadingState.tsx             # Loading spinner / skeleton
    └── ConfirmDialog.tsx            # Reusable confirmation modal
```

### 7.3 Responsive Design

- Sidebar navigation collapses to bottom tab bar on mobile
- Signal feed is full-width on mobile — cards stack vertically
- Heatmap scrolls horizontally on small screens
- Competitor profile sections are full-width accordions on mobile
- Landscape charts scale down with pinch-to-zoom on mobile
- Add signal form and add competitor form are full-screen modals on mobile
- All touch targets minimum 44px for mobile usability

---

## 8. Storage Approach

### 8.1 Primary Database — Supabase (PostgreSQL)

All persistent data lives in Supabase:
- Competitor records
- Signal records
- Analysis JSON documents
- Lemnisca profile
- Signal categories
- Signal comments
- Feedback data

### 8.2 No Caching Layer

No Redis or in-memory caching. Database queries will be fast enough given the small data volume. Add caching later if performance becomes an issue.

---

## 9. Deployment

### 9.1 Vercel

- Push to GitHub triggers automatic deployment
- Environment variables for: Supabase URL, Supabase anon key, Gemini API key, passcode, cron secret

### 9.2 Vercel Cron Configuration

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

Runs at 01:30 UTC and 13:30 UTC (7:00 AM and 7:00 PM IST).

Cron endpoint protected by CRON_SECRET environment variable.

### 9.3 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
APP_PASSCODE=...
CRON_SECRET=...
```

---

## 10. Known Tradeoffs

| Tradeoff | Chose | Over | Reason |
|----------|-------|------|--------|
| Monolith | Single Next.js app | Separate frontend + backend | Faster to build and deploy. No cross-origin issues. Single repo. Sufficient for single-user tool. |
| Supabase | Hosted PostgreSQL | Self-hosted DB or SQLite | Zero setup time. Reliable. Good JS client. Worth the external dependency. |
| JSONB for analysis | Flexible schema | Normalized tables per section | Analysis structure may evolve. JSONB lets schema change without migrations. |
| Gemini 3 Flash + 3.1 Pro split | Flash for routine, Pro for deep analysis | Single model for everything | 3 Flash is fast and cheap for scanning. 3.1 Pro gives best reasoning for analysis Pushkar will read carefully. |
| No caching | Simplicity | Performance optimization | Data volume is small. Database round-trips will be fast. Not worth adding complexity. |
| Analysis history kept | Insert new row on refresh | Overwrite old analysis | Enables future "how has understanding changed" view. Minimal storage cost. |
| LLM for dedup | Semantic understanding | Exact string matching | Competitive signals can describe the same event in many ways. LLM catches semantic duplicates. |

---

## 11. Scope Priority

If time is constrained, cut in this order (last to cut → first to cut):

1. **Never cut:** Signal feed + automated scan + competitor profiles with deep analysis — this IS the product
2. **Cut reluctantly:** Heatmap, pattern summary, mobile responsiveness
3. **Cut if needed:** Landscape view, custom axis input
4. **Cut early if behind:** Category filter view, signal comments
5. **Cut immediately if blocked:** Duplicate checking on manual entry

---

## 12. Future Improvements

- Scheduled auto-refresh of competitor analyses
- Auto re-trigger analyses when Lemnisca profile changes
- Caching layer for frequently accessed data
- Signal quality scoring based on accumulated thumbs up/down feedback
- Export competitor profiles and signal data as PDF/CSV
- Websocket or polling for live signal feed updates
- Section-level analysis regeneration
- Signal search (full-text search across headlines and summaries)
- Analysis diff view — compare current vs previous analysis for a competitor