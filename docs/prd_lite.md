# PRD-lite — Competitor Tracking Dashboard

**Product:** Competitor Tracking Dashboard

---

## 1. Problem Statement

Lemnisca's founder tracks competitive activity across the biotech / synthetic biology space through scattered, ad hoc sources — LinkedIn, company websites, news articles, investor conversations, and memory. There is no structured surface to log, organize, review, or analyze competitive signals over time.

This creates three compounding problems:

1. **Signals are lost.** Competitive moves are noticed but not captured. By the time they become relevant (e.g., during a fundraising conversation or a partnership discussion), the details are fuzzy or forgotten entirely.
2. **Patterns are invisible.** Individual signals are occasionally noticed, but cross-competitor trends — like multiple companies raising in the same quarter or several competitors hiring for the same capability — are never surfaced because there is no system that holds them together.
3. **Analysis is reconstructed from scratch every time.** When competitive context is needed for a decision, it has to be mentally reassembled rather than read from a maintained source.

The result is that competitive intelligence — which directly affects fundraising, positioning, and partnership decisions — remains an informal, unreliable, and high-effort process.

---

## 2. Why This Product Exists

- Lemnisca is actively sharpening its fundraising narrative, market positioning, and partnership strategy. All three require sharp, current, structured competitive awareness.
- Investors expect founders to articulate competitive differentiation clearly. A structured tracking surface turns "I think they raised recently" into precise, sourced, dated intelligence.
- The biotech landscape is becoming more active — more competitors entering, more funding, more positioning shifts. The cost of not tracking systematically increases as the field gets busier.
- Building this establishes a compounding asset. Every signal logged makes the competitive picture richer over time.

---

## 3. Core Use Cases

### Use Case 1 — Daily Scan (2–5 minutes)
Pushkar opens the dashboard in the morning or afternoon. He sees a competitor activity heatmap and an LLM-generated pattern summary at the top highlighting cross-competitor trends. Below that, new signals from the automated twice-daily scan are highlighted. He reads through, gives thumbs up/down on signal quality, flags anything important, writes comments for his own reference, and is done.

### Use Case 2 — Manual Signal Logging (1–2 minutes)
Pushkar hears something at a meeting, in a conversation, or on LinkedIn. He opens the dashboard (possibly on mobile), logs the signal — picks the competitor, picks a category, types a headline, pastes a source URL if available, adds a note on why it matters. The system checks for potential duplicates and prompts if a related signal already exists.

### Use Case 3 — Deep Competitor Dive (10–15 minutes)
Pushkar is preparing for a meeting, reviewing strategy, or has just heard about a new competitor. He opens a competitor profile and reads through the full LLM-generated analysis — company overview, SWOT, positioning, funding, go-to-market, threat assessment. He sees the competitor's position on the landscape chart within the profile. Below the analysis, he reviews the signal timeline for that competitor. He can refresh the analysis if it feels outdated.

### Use Case 4 — Adding a New Competitor (2–3 minutes)
Pushkar inputs a company name, optional URLs, and optional context. The system triggers a full competitive analysis via LLM + web search, generates the deep profile with all sections, and runs an initial signal scan. The competitor appears in the dashboard with a complete profile and any signals found.

### Use Case 5 — Landscape Review (5–10 minutes)
Pushkar opens the competitive landscape view to see all competitors (including Lemnisca) plotted on positioning maps. He reviews the auto-generated charts, and can type custom axis prompts to regenerate specific views. This is used for strategic thinking and fundraising prep.

### Use Case 6 — Category Exploration (3–5 minutes)
Pushkar wants to see all signals of a specific type — e.g., all fundraising activity, or all hiring signals. He uses the category filter view to browse signals across competitors within a single category.

---

## 4. MVP Scope

### 4.1 Entities

**Competitor**
- Name
- Type (direct / indirect) — simple tag
- One-liner (why this competitor matters)
- Strategic context (Pushkar's own reasoning)
- Additional context (optional, provided at addition time to improve analysis quality)
- Website URL
- Tracked sources — priority URLs the LLM checks during scans (LinkedIn page, Twitter/X handle, company blog, careers page, Crunchbase, etc.). Pushkar can add/remove these at any time.
- Date added
- Deep analysis report (LLM-generated, stored, refreshable)

**Signal**
- Linked to one competitor
- Headline (one-liner describing the event)
- Category (from default or custom list)
- Date observed
- Source URL(s)
- Source type (official announcement, news article, LinkedIn, job board, conversation, SEC/regulatory filing, conference, other)
- LLM-generated summary paragraph
- Pushkar's strategic note (optional)
- Flag (manual, binary — Pushkar marks if important)
- Thumbs up / thumbs down (feedback on signal quality)
- Read / unread status
- Comments / notes (Pushkar can add over time)

**Lemnisca Profile**
- Company description (one-liner + detail)
- Current stage
- Key differentiators
- Technology focus
- Market positioning
- Funding status
- Team strengths
- Current strategic priorities
- Maintained manually by Pushkar
- Used as reference point for SWOT analyses, threat assessments, and landscape positioning

**Signal Categories (default set, extensible)**
- Fundraising
- Hiring
- Leadership
- Partnership
- Launch
- Pilot / Customer
- Plant / Infrastructure
- Positioning
- Regulatory / IP
- Media / PR
- Litigation

Pushkar can add new categories at any time.

### 4.2 Views

**View 1 — Recent Signals Feed (Landing Page)**
- Competitor activity heatmap at top — rows are competitors, columns are recent time periods (days/weeks), cell intensity shows signal volume. Instant visual read of who is active and who is quiet.
- Pattern summary section below heatmap — LLM-generated cross-competitor trends, regenerated from stored signals on page load
- Signal feed below, sorted by date observed (newest first)
- New / unread signals visually highlighted
- Each signal shows: competitor name, category tag, headline, date, flag status
- Thumbs up / down on each signal for feedback
- Manual signal logging accessible from this view
- "Refresh feed" button — triggers an on-demand signal scan using the same process as the twice-daily automated scan, for when Pushkar wants fresh signals immediately
- Deduplication check on manual entry — if related signal exists, prompt to keep both or replace

**View 2 — Competitor Profile (Deep Dive)**
- Full LLM-generated competitive analysis in collapsible sections:
  - Company Overview
  - Product / Technology Analysis
  - SWOT Analysis (relative to Lemnisca)
  - Market Positioning & Narrative
  - Funding & Investors
  - Go-to-Market
  - Customers / Pilots / Partnerships
  - Infrastructure & Manufacturing
  - Leadership & Team
  - Threat Assessment
  - Competitive Landscape Position (chart showing this competitor's position among others)
- Signal timeline for this competitor below the analysis
- Pushkar's strategic notes
- "Refresh analysis" button to regenerate with current web information

**View 3 — Category Filter**
- Filter signals by category across all competitors
- Browse all signals within a selected category
- Manual exploration and pattern recognition tool

**View 4 — Competitive Landscape**
- Comparative positioning maps / quadrant charts
- All competitors + Lemnisca plotted on strategic axes
- Auto-generated axis choices by LLM
- Text input field for custom axis prompts (e.g., "technology readiness vs commercial traction")
- Regenerates on demand

**View 5 — Lemnisca Profile**
- Pushkar's self-assessment of Lemnisca
- Editable at any time
- Used as the reference point for all comparative analyses across the product
- Accessible from settings / profile area

### 4.3 Key Capabilities

**Automated Signal Scanning**
- Runs twice daily as a background job
- LLM checks tracked source URLs (LinkedIn, Twitter, blog, careers, etc.) first as priority sources, then performs general web search
- Auto-categorizes findings, generates summary paragraphs
- Signals go directly into the feed (no approval queue)
- New signals marked as unread
- On-demand "Refresh feed" button triggers the same scan process manually when Pushkar wants immediate updates

**Manual Signal Logging**
- Pushkar can add a signal at any time
- Picks competitor, category, types headline, pastes source URL, adds strategic note
- System checks for duplicate / related signals and prompts accordingly

**Deep Competitive Analysis Generation**
- Triggered on competitor addition
- LLM + web search generates a full analysis across all profile sections
- Stored and persisted
- Manual refresh on demand

**Pattern Summary**
- LLM reads across all stored signals
- Surfaces cross-competitor trends on the landing page
- Regenerated each time the landing page loads

**Landscape Chart Generation**
- LLM generates positioning maps using data from competitor profiles and Lemnisca profile
- Auto-selects relevant axes
- Custom axis input available
- Displayed in both the landscape view and within individual competitor profiles

**Signal Feedback**
- Thumbs up / down on each signal
- Used to improve signal quality over time

### 4.4 Interactions

- Add a competitor (triggers deep analysis + initial signal scan)
- Remove a competitor (with confirmation — deletes profile and all associated signals)
- Add / remove tracked sources for a competitor (LinkedIn, Twitter, blog, careers, Crunchbase, etc.)
- Add a signal manually
- Add comments / notes to any signal
- Flag / unflag a signal
- Thumbs up / down on a signal
- Refresh competitor deep analysis
- Refresh signal feed on demand
- Edit Lemnisca profile
- Add custom signal categories
- Enter custom axes for landscape charts

---

## 5. Non-Goals

- No broad web crawling or internet monitoring platform
- No real-time alerting or push notifications
- No email notifications
- No multi-user collaboration or access control
- No full market intelligence product
- No automated refresh of deep analysis (manual trigger only)
- No signal archiving (signals persist indefinitely)
- No export or reporting features
- No advanced analytics engine beyond pattern summary and landscape charts
- No automatic re-triggering of competitor analyses when Lemnisca profile is updated (Pushkar can manually refresh individual profiles if needed)

---

## 6. Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Automated signals go directly to feed, no approval queue | Reduces friction. Pushkar scans and gives feedback via thumbs up/down instead of approving each signal. |
| 2 | Twice-daily automated scan | The tool should have signals waiting when Pushkar opens it. Monitoring that requires manual triggering defeats the purpose. |
| 3 | Deep analysis refresh is manual, not automated | Deep analysis is expensive and infrequent. Auto-refresh adds infrastructure cost without proportional value. |
| 4 | One event can produce multiple signals | A single announcement (e.g., fundraising + facility buildout) has different strategic implications per category. Signals are atomic. |
| 5 | No severity rating by AI | Importance is subjective and strategic. Pushkar flags signals himself. AI should not judge what matters. |
| 6 | Source type acts as implicit credibility signal | No need for an explicit credibility score. Source type (official announcement vs. LinkedIn post vs. conversation) gives Pushkar enough context to judge. |
| 7 | Lemnisca profile is manually maintained by Pushkar | The system cannot auto-assess Lemnisca's own position. Pushkar must keep this current for comparative analyses to be accurate. |
| 8 | Pattern summary on landing page, not in a separate view | Maximum impact — Pushkar sees trends immediately on opening the tool, not buried in a secondary view. |
| 9 | Simple passcode, no full auth | Single user tool. Passcode provides a basic gate without auth infrastructure overhead. |
| 10 | Signal categories are extensible | The competitive landscape evolves. Pushkar should be able to add categories like "acquisition" or "market exit" when they become relevant. |
| 11 | Landscape charts auto-generated with optional custom axes | Useful by default, and flexible when Pushkar wants specific comparisons. |
| 12 | Mobile responsive | Pushkar needs to log signals on the go — conversations, conferences, quick checks. Mobile is not optional. |
| 13 | On-demand refresh feed button alongside automated scans | Automated scan is the baseline. The button covers "I know something happened and want fresh signals now." Same underlying process. |
| 14 | Competitor activity heatmap on landing page | Adds an instant visual read of which competitors are active and which are quiet. Information-dense, strategically useful. |
| 15 | Lemnisca profile updates do not auto-trigger competitor re-analysis | Profile changes will be infrequent. Pushkar can manually refresh specific competitor analyses. |

---

## 7. Key Assumptions

- LLM + web search will return sufficiently accurate and relevant competitive signals for the biotech space. Quality improves over time with thumbs up/down feedback.
- Twice-daily scans provide adequate coverage. Real-time monitoring is not needed.
- The deep analysis generated by LLM on competitor addition is comprehensive enough to be useful as a strategic reference.
- Pushkar will maintain the Lemnisca profile. If it goes stale, comparative analyses degrade.
- Manual signal logging will be infrequent but critical for intelligence that web search cannot capture (conversations, events).
- The default signal category list covers the majority of relevant competitive events in the biotech space.
- A simple passcode is sufficient security for this use case.