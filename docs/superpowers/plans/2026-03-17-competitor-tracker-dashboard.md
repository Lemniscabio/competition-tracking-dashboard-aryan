# Competitor Tracking Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an internal competitor tracking dashboard for Lemnisca that automates competitive signal scanning via Gemini LLM and provides deep competitor analysis, landscape positioning, and a daily signal feed.

**Architecture:** Next.js 14 App Router monolith with API routes as backend. Supabase (PostgreSQL) for persistence. Google Gemini API with Google Search grounding for LLM-powered analysis and signal scanning. Simple passcode auth with cookie session. Deployed on Vercel with Vercel Cron for twice-daily scans.

**Tech Stack:** Next.js 14, Tailwind CSS, Recharts, Supabase (`@supabase/supabase-js`), Google Gemini (`@google/generative-ai`), Vercel

---

## File Structure

```
app/
├── page.tsx                              # Passcode entry screen
├── layout.tsx                            # Root layout (Inter font, dark theme)
├── globals.css                           # Tailwind directives + dark theme base
├── dashboard/
│   ├── layout.tsx                        # Sidebar nav + top bar
│   ├── page.tsx                          # Landing page (heatmap + patterns + feed)
│   ├── competitors/
│   │   ├── page.tsx                      # Competitor list
│   │   ├── [id]/page.tsx                 # Competitor profile deep dive
│   │   └── add/page.tsx                  # Add competitor form
│   ├── categories/page.tsx               # Category filter view
│   ├── landscape/page.tsx                # Competitive landscape maps
│   └── lemnisca/page.tsx                 # Lemnisca profile editor
└── api/
    ├── auth/verify/route.ts              # POST — verify passcode
    ├── auth/check/route.ts               # GET — check session
    ├── competitors/route.ts              # GET list, POST add
    ├── competitors/[id]/route.ts         # GET detail, DELETE remove
    ├── competitors/[id]/sources/route.ts # GET list, POST add source
    ├── competitors/[id]/sources/[sourceId]/route.ts  # DELETE source
    ├── signals/route.ts                  # GET list (filtered), POST manual add
    ├── signals/[id]/route.ts             # PATCH update
    ├── signals/[id]/comments/route.ts    # GET, POST comments
    ├── signals/check-duplicate/route.ts  # POST duplicate check
    ├── categories/route.ts               # GET list, POST add
    ├── lemnisca/route.ts                 # GET, PUT profile
    ├── analyze/[competitor_id]/route.ts  # POST generate analysis
    ├── scan/route.ts                     # POST trigger scan
    ├── patterns/route.ts                 # GET pattern summary
    ├── landscape/route.ts                # POST landscape data
    └── cron/scan/route.ts                # GET cron-triggered scan

lib/
├── supabase/client.ts                    # Browser Supabase client
├── supabase/server.ts                    # Server Supabase client (service role)
├── llm/client.ts                         # Gemini client init + helpers
├── llm/analysis.ts                       # generateCompetitorAnalysis
├── llm/signals.ts                        # scanForSignals
├── llm/patterns.ts                       # generatePatternSummary
├── llm/landscape.ts                      # generateLandscapeData
├── llm/duplicate.ts                      # checkDuplicateSignal
├── services/scan.ts                      # Shared scan logic (used by /api/scan + /api/cron/scan)
├── auth.ts                               # Cookie helpers
└── types.ts                              # All TypeScript types

components/
├── auth/PasscodeGate.tsx
├── signals/SignalFeed.tsx
├── signals/SignalCard.tsx
├── signals/SignalForm.tsx
├── signals/SignalComments.tsx
├── signals/DuplicatePrompt.tsx
├── signals/FeedbackButtons.tsx
├── competitors/CompetitorCard.tsx
├── competitors/CompetitorProfile.tsx
├── competitors/AnalysisSection.tsx
├── competitors/AddCompetitorForm.tsx
├── competitors/CompetitorSources.tsx
├── competitors/CompetitorTimeline.tsx
├── landscape/PositioningMap.tsx
├── landscape/CustomAxisInput.tsx
├── heatmap/ActivityHeatmap.tsx
├── patterns/PatternSummary.tsx
├── lemnisca/LemniscaProfileForm.tsx
└── shared/Navigation.tsx
    shared/CategoryTag.tsx
    shared/LoadingState.tsx
    shared/ConfirmDialog.tsx

middleware.ts                             # Auth middleware for /dashboard routes
vercel.json                               # Cron config
.env.local.example                        # Env var template
supabase/migrations/001_initial_schema.sql # DB migration
```

---

## Chunk 1: Foundation

### Task 1: Initialize Next.js project with Tailwind CSS

**Files:**
- Create: `package.json`, `tailwind.config.ts`, `next.config.js`, `tsconfig.json`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `.env.local.example`, `vercel.json`, `.gitignore`

- [ ] **Step 1: Create Next.js project**

```bash
cd "/Users/aryanjakhar/Desktop/Lemnisca/LemniscaProductSprintDocs/Competition Tracker Dashboard"
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

If directory not empty, move `docs/` and `claude.md` aside, init, move back.

- [ ] **Step 2: Install project dependencies**

```bash
npm install @supabase/supabase-js @google/generative-ai recharts
```

- [ ] **Step 3: Configure dark theme in `tailwind.config.ts`**

Set `darkMode: 'class'`, extend colors with custom palette:
```ts
// tailwind.config.ts
colors: {
  bg: { DEFAULT: '#0a0a0f', card: '#0f0f17', elevated: '#141420' },
  border: { DEFAULT: '#1a1a2e', light: '#252540' },
  accent: { DEFAULT: '#3b82f6', hover: '#2563eb', muted: '#1e3a5f' },
  text: { DEFAULT: '#e2e8f0', muted: '#94a3b8', dim: '#64748b' },
}
```
Add Inter font via `next/font/google`.

- [ ] **Step 4: Set up `app/globals.css` with dark base**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-bg text-text antialiased;
  }
}
```

- [ ] **Step 5: Set up `app/layout.tsx` with Inter font and dark class**

Root layout with `<html lang="en" className="dark">`, Inter font applied to body.

- [ ] **Step 6: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
APP_PASSCODE=
CRON_SECRET=
```

- [ ] **Step 7: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/scan",
      "schedule": "30 1,13 * * *"
    }
  ]
}
```

- [ ] **Step 8: Replace `app/page.tsx` with minimal placeholder**

Simple centered text: "Competitor Tracker Dashboard" on dark background.

- [ ] **Step 9: Verify**

Run: `npm run dev`
Expected: App loads at localhost:3000, dark background, placeholder text visible.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with Tailwind dark theme"
```

---

### Task 2: Supabase database schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write the full migration SQL**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Signal categories
CREATE TABLE signal_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed default categories
INSERT INTO signal_categories (name, is_default) VALUES
  ('Fundraising', true),
  ('Hiring', true),
  ('Leadership', true),
  ('Partnership', true),
  ('Launch', true),
  ('Pilot/Customer', true),
  ('Plant/Infrastructure', true),
  ('Positioning', true),
  ('Regulatory/IP', true),
  ('Media/PR', true),
  ('Litigation', true);

-- Competitors
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('direct', 'indirect')),
  one_liner TEXT,
  strategic_context TEXT,
  additional_context TEXT,
  website_url TEXT,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competitor analyses
CREATE TABLE competitor_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  analysis_json JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Competitor tracked sources
CREATE TABLE competitor_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_label TEXT NOT NULL CHECK (source_label IN ('linkedin', 'twitter', 'blog', 'careers', 'crunchbase', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Signals
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  category_id UUID REFERENCES signal_categories(id),
  date_observed DATE NOT NULL DEFAULT CURRENT_DATE,
  source_urls TEXT[],
  source_type TEXT NOT NULL CHECK (source_type IN ('official_announcement', 'news_article', 'linkedin', 'job_board', 'conversation', 'sec_regulatory', 'conference', 'other')),
  llm_summary TEXT,
  strategic_note TEXT,
  is_flagged BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  feedback TEXT CHECK (feedback IN (NULL, 'up', 'down')),
  source TEXT NOT NULL CHECK (source IN ('automated', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Signal comments
CREATE TABLE signal_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lemnisca profile (single row)
CREATE TABLE lemnisca_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT,
  current_stage TEXT,
  differentiators TEXT,
  technology_focus TEXT,
  market_positioning TEXT,
  funding_status TEXT,
  team_strengths TEXT,
  strategic_priorities TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed empty Lemnisca profile
INSERT INTO lemnisca_profile (description) VALUES ('');

-- Indexes
CREATE INDEX idx_signals_competitor ON signals(competitor_id);
CREATE INDEX idx_signals_category ON signals(category_id);
CREATE INDEX idx_signals_date_observed ON signals(date_observed DESC);
CREATE INDEX idx_signals_is_read ON signals(is_read);
CREATE INDEX idx_competitor_analyses_competitor ON competitor_analyses(competitor_id);
CREATE INDEX idx_competitor_sources_competitor ON competitor_sources(competitor_id);
```

- [ ] **Step 2: Run migration in Supabase**

Go to Supabase Dashboard → SQL Editor → paste and run `001_initial_schema.sql`.
Verify: all 6 tables created, 11 default categories seeded, 1 lemnisca_profile row exists.

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase database migration with all tables and seed data"
```

---

### Task 3: Supabase client setup and TypeScript types

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/types.ts`

- [ ] **Step 1: Create browser Supabase client**

```ts
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

- [ ] **Step 2: Create server Supabase client (service role)**

```ts
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 3: Create TypeScript types**

```ts
// lib/types.ts
export interface Competitor {
  id: string;
  name: string;
  type: 'direct' | 'indirect';
  one_liner: string | null;
  strategic_context: string | null;
  additional_context: string | null;
  website_url: string | null;
  date_added: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitorAnalysis {
  id: string;
  competitor_id: string;
  analysis_json: AnalysisJSON;
  generated_at: string;
  created_at: string;
}

export interface AnalysisJSON {
  company_overview: string;
  product_technology: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  market_positioning: string;
  funding_investors: string;
  go_to_market: string;
  customers_pilots_partnerships: string;
  infrastructure_manufacturing: string;
  leadership_team: string;
  threat_assessment: string;
  landscape_position: {
    axes: string[];
    position: Record<string, number>;
  };
}

export interface CompetitorSource {
  id: string;
  competitor_id: string;
  url: string;
  source_label: 'linkedin' | 'twitter' | 'blog' | 'careers' | 'crunchbase' | 'other';
  created_at: string;
}

export interface Signal {
  id: string;
  competitor_id: string;
  headline: string;
  category_id: string | null;
  date_observed: string;
  source_urls: string[] | null;
  source_type: 'official_announcement' | 'news_article' | 'linkedin' | 'job_board' | 'conversation' | 'sec_regulatory' | 'conference' | 'other';
  llm_summary: string | null;
  strategic_note: string | null;
  is_flagged: boolean;
  is_read: boolean;
  feedback: 'up' | 'down' | null;
  source: 'automated' | 'manual';
  created_at: string;
  updated_at: string;
  // Joined fields
  competitor?: Competitor;
  category?: SignalCategory;
}

export interface SignalComment {
  id: string;
  signal_id: string;
  content: string;
  created_at: string;
}

export interface SignalCategory {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface LemniscaProfile {
  id: string;
  description: string | null;
  current_stage: string | null;
  differentiators: string | null;
  technology_focus: string | null;
  market_positioning: string | null;
  funding_status: string | null;
  team_strengths: string | null;
  strategic_priorities: string | null;
  updated_at: string;
}

export interface LandscapeData {
  axes: { x: string; y: string };
  entities: Array<{
    name: string;
    x: number;
    y: number;
    isLemnisca: boolean;
  }>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarSignal: Signal | null;
  explanation: string;
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 5: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase clients and TypeScript type definitions"
```

---

### Task 4: Passcode authentication

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/verify/route.ts`, `app/api/auth/check/route.ts`, `middleware.ts`, `components/auth/PasscodeGate.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create auth helpers**

```ts
// lib/auth.ts
import { cookies } from 'next/headers';

const COOKIE_NAME = 'ct-session';
const SESSION_VALUE = 'authenticated';

export function setAuthCookie() {
  cookies().set(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export function checkAuthCookie(): boolean {
  const cookie = cookies().get(COOKIE_NAME);
  return cookie?.value === SESSION_VALUE;
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}
```

- [ ] **Step 2: Create POST /api/auth/verify**

```ts
// app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  const { passcode } = await request.json();

  if (passcode === process.env.APP_PASSCODE) {
    setAuthCookie();
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Invalid passcode' }, { status: 401 });
}
```

- [ ] **Step 3: Create GET /api/auth/check**

```ts
// app/api/auth/check/route.ts
import { NextResponse } from 'next/server';
import { checkAuthCookie } from '@/lib/auth';

export async function GET() {
  const isAuthed = checkAuthCookie();
  return NextResponse.json({ authenticated: isAuthed });
}
```

- [ ] **Step 4: Create middleware to protect /dashboard routes**

```ts
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('ct-session');

  if (!session || session.value !== 'authenticated') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/dashboard/:path*',
};
```

- [ ] **Step 5: Create PasscodeGate component**

```tsx
// components/auth/PasscodeGate.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PasscodeGate() {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid passcode');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">Competitor Tracker</h1>
          <p className="text-text-muted mt-2">Enter passcode to continue</p>
        </div>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className="w-full px-4 py-3 bg-bg-card border border-border rounded-lg text-text placeholder-text-dim focus:outline-none focus:border-accent"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 6: Update `app/page.tsx` to use PasscodeGate**

```tsx
// app/page.tsx
import PasscodeGate from '@/components/auth/PasscodeGate';

export default function Home() {
  return <PasscodeGate />;
}
```

- [ ] **Step 7: Verify**

1. Set `APP_PASSCODE=test123` in `.env.local`
2. Run `npm run dev`
3. Visit localhost:3000 — see passcode form
4. Enter wrong passcode — see error
5. Enter "test123" — redirected to /dashboard (will 404, that's fine)
6. Visit localhost:3000/dashboard directly without cookie — redirected to /

- [ ] **Step 8: Commit**

```bash
git add app/api/auth/ lib/auth.ts middleware.ts components/auth/ app/page.tsx
git commit -m "feat: add passcode authentication with cookie session and middleware"
```

---

### Task 5: Dashboard layout with sidebar navigation

**Files:**
- Create: `components/shared/Navigation.tsx`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`

- [ ] **Step 1: Create Navigation component**

Sidebar with links: Dashboard (home icon), Competitors, Categories, Landscape, Lemnisca Profile. Collapsible on mobile to bottom tab bar. Active route highlighted. Dark theme styling matching design spec.

Links:
- `/dashboard` — Dashboard
- `/dashboard/competitors` — Competitors
- `/dashboard/categories` — Categories
- `/dashboard/landscape` — Landscape
- `/dashboard/lemnisca` — Lemnisca

Desktop: fixed left sidebar, 240px wide, dark bg-bg-card, border-r border-border.
Mobile (<768px): fixed bottom bar, icons only, 56px tall.

- [ ] **Step 2: Create dashboard layout**

```tsx
// app/dashboard/layout.tsx
import Navigation from '@/components/shared/Navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      <main className="md:ml-60 pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Create dashboard landing page placeholder**

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>
      <p className="text-text-muted mt-2">Competitive intelligence at a glance.</p>
    </div>
  );
}
```

- [ ] **Step 4: Create placeholder pages for all routes**

Create minimal placeholder pages at:
- `app/dashboard/competitors/page.tsx`
- `app/dashboard/competitors/[id]/page.tsx`
- `app/dashboard/competitors/add/page.tsx`
- `app/dashboard/categories/page.tsx`
- `app/dashboard/landscape/page.tsx`
- `app/dashboard/lemnisca/page.tsx`

Each just renders an `<h1>` with the page name.

- [ ] **Step 5: Verify**

1. Run `npm run dev`, log in with passcode
2. See sidebar on desktop with all nav links
3. Click each link — navigates correctly, active state shows
4. Resize to mobile — sidebar becomes bottom tab bar
5. All placeholder pages render

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/ components/shared/
git commit -m "feat: add dashboard layout with sidebar navigation and placeholder pages"
```

---

## Chunk 2: LLM Service Layer

### Task 6: Gemini client setup

**Files:**
- Create: `lib/llm/client.ts`

- [ ] **Step 1: Create Gemini client with helpers**

```ts
// lib/llm/client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getProModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
  });
}

export function getFlashModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
  });
}

export function getProModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-3.1-pro-preview',
    tools: [{ googleSearch: {} }],
  });
}

export function getFlashModelWithSearch() {
  return genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    tools: [{ googleSearch: {} }],
  });
}

export function extractSourceUrls(response: any): string[] {
  const urls: string[] = [];
  const metadata = response?.candidates?.[0]?.groundingMetadata;
  if (metadata?.groundingChunks) {
    for (const chunk of metadata.groundingChunks) {
      if (chunk.web?.uri) {
        urls.push(chunk.web.uri);
      }
    }
  }
  return [...new Set(urls)];
}

export function parseJsonResponse(text: string): any {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/llm/client.ts
git commit -m "feat: add Gemini client setup with model helpers and response parsing"
```

---

### Task 7: generateCompetitorAnalysis LLM function

**Files:**
- Create: `lib/llm/analysis.ts`

- [ ] **Step 1: Implement generateCompetitorAnalysis**

```ts
// lib/llm/analysis.ts
import { getProModelWithSearch, extractSourceUrls, parseJsonResponse } from './client';
import type { AnalysisJSON, LemniscaProfile } from '@/lib/types';

export async function generateCompetitorAnalysis(
  name: string,
  websiteUrl: string | null,
  additionalContext: string | null,
  lemniscaProfile: LemniscaProfile
): Promise<{ analysis: AnalysisJSON; sourceUrls: string[] }> {
  const model = getProModelWithSearch();

  const prompt = `You are a competitive intelligence analyst for a biotech/synthetic biology company called Lemnisca. Research and analyze the following competitor thoroughly using web search.

**Competitor:** ${name}
${websiteUrl ? `**Website:** ${websiteUrl}` : ''}
${additionalContext ? `**Additional context:** ${additionalContext}` : ''}

**About Lemnisca (for relative analysis):**
- Description: ${lemniscaProfile.description || 'Not provided'}
- Stage: ${lemniscaProfile.current_stage || 'Not provided'}
- Differentiators: ${lemniscaProfile.differentiators || 'Not provided'}
- Technology: ${lemniscaProfile.technology_focus || 'Not provided'}
- Market positioning: ${lemniscaProfile.market_positioning || 'Not provided'}
- Funding: ${lemniscaProfile.funding_status || 'Not provided'}
- Team strengths: ${lemniscaProfile.team_strengths || 'Not provided'}
- Strategic priorities: ${lemniscaProfile.strategic_priorities || 'Not provided'}

Generate a comprehensive competitive analysis. SWOT should be relative to Lemnisca. Threat assessment should evaluate how this competitor threatens Lemnisca specifically.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "company_overview": "comprehensive overview paragraph",
  "product_technology": "detailed product and technology analysis",
  "swot": {
    "strengths": ["strength 1", "strength 2", ...],
    "weaknesses": ["weakness 1", "weakness 2", ...],
    "opportunities": ["opportunity 1", ...],
    "threats": ["threat 1", ...]
  },
  "market_positioning": "market positioning and narrative analysis",
  "funding_investors": "funding history, amounts, investors",
  "go_to_market": "go-to-market strategy analysis",
  "customers_pilots_partnerships": "known customers, pilots, partnerships",
  "infrastructure_manufacturing": "infrastructure and manufacturing capabilities",
  "leadership_team": "key leadership and team analysis",
  "threat_assessment": "specific threat assessment relative to Lemnisca",
  "landscape_position": {
    "axes": ["Technology Readiness", "Commercial Traction"],
    "position": { "x": 0.0, "y": 0.0 }
  }
}

Note: Always use the fixed default axes "Technology Readiness" and "Commercial Traction" so positions are comparable across competitors.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const analysis = parseJsonResponse(text) as AnalysisJSON;
  const sourceUrls = extractSourceUrls(response);

  return { analysis, sourceUrls };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/llm/analysis.ts
git commit -m "feat: add generateCompetitorAnalysis LLM function"
```

---

### Task 8: scanForSignals LLM function

**Files:**
- Create: `lib/llm/signals.ts`

- [ ] **Step 1: Implement scanForSignals**

```ts
// lib/llm/signals.ts
import { getFlashModelWithSearch, extractSourceUrls, parseJsonResponse } from './client';
import type { Competitor, CompetitorSource, Signal } from '@/lib/types';

interface CompetitorScanInput {
  competitor: Competitor;
  trackedSources: CompetitorSource[];
  recentHeadlines: string[];
}

interface ScannedSignal {
  competitor_id: string;
  headline: string;
  category_name: string;
  date_observed: string;
  source_urls: string[];
  source_type: string;
  llm_summary: string;
}

export async function scanForSignals(
  inputs: CompetitorScanInput[]
): Promise<ScannedSignal[]> {
  const allSignals: ScannedSignal[] = [];

  for (const input of inputs) {
    const signals = await scanSingleCompetitor(input);
    allSignals.push(...signals);
    // 1-second delay between competitors to avoid rate limits
    if (inputs.indexOf(input) < inputs.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return allSignals;
}

async function scanSingleCompetitor(
  input: CompetitorScanInput
): Promise<ScannedSignal[]> {
  const model = getFlashModelWithSearch();
  const { competitor, trackedSources, recentHeadlines } = input;

  const sourcesText = trackedSources.length > 0
    ? `Priority sources to check first:\n${trackedSources.map((s) => `- ${s.source_label}: ${s.url}`).join('\n')}`
    : 'No tracked sources specified.';

  const existingText = recentHeadlines.length > 0
    ? `Already known signals (DO NOT duplicate these):\n${recentHeadlines.map((h) => `- ${h}`).join('\n')}`
    : 'No existing signals.';

  const prompt = `You are a competitive intelligence scanner for biotech/synthetic biology. Search for recent news, announcements, and activity about this competitor.

**Competitor:** ${competitor.name}
${competitor.website_url ? `**Website:** ${competitor.website_url}` : ''}
${competitor.one_liner ? `**Context:** ${competitor.one_liner}` : ''}

${sourcesText}

${existingText}

**Valid categories:** Fundraising, Hiring, Leadership, Partnership, Launch, Pilot/Customer, Plant/Infrastructure, Positioning, Regulatory/IP, Media/PR, Litigation

Search the web for recent competitive signals. Find news, announcements, job postings, social media posts, regulatory filings, etc. from the last 30 days.

Return ONLY valid JSON array (no markdown, no code fences). If no new signals found, return [].
[
  {
    "headline": "one-line description of the event",
    "category_name": "one of the valid categories above",
    "date_observed": "YYYY-MM-DD",
    "source_type": "official_announcement|news_article|linkedin|job_board|conversation|sec_regulatory|conference|other",
    "llm_summary": "2-3 sentence summary of the signal and its strategic significance"
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const signals = parseJsonResponse(text) as any[];
    const sourceUrls = extractSourceUrls(response);

    return signals.map((s) => ({
      competitor_id: competitor.id,
      headline: s.headline,
      category_name: s.category_name,
      date_observed: s.date_observed,
      source_urls: s.source_urls || sourceUrls,
      source_type: s.source_type,
      llm_summary: s.llm_summary,
    }));
  } catch (error) {
    console.error(`Scan failed for ${competitor.name}:`, error);
    return [];
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add lib/llm/signals.ts
git commit -m "feat: add scanForSignals LLM function with per-competitor batching"
```

---

### Task 9: Remaining LLM functions (patterns, landscape, duplicate)

**Files:**
- Create: `lib/llm/patterns.ts`, `lib/llm/landscape.ts`, `lib/llm/duplicate.ts`

- [ ] **Step 1: Implement generatePatternSummary**

```ts
// lib/llm/patterns.ts
import { getFlashModel, parseJsonResponse } from './client';
import type { Signal } from '@/lib/types';

export async function generatePatternSummary(
  recentSignals: (Signal & { competitor_name: string; category_name: string })[]
): Promise<string> {
  if (recentSignals.length === 0) {
    return 'No signals to analyze yet. Add competitors and run a scan to see patterns.';
  }

  const model = getFlashModel();

  const signalsText = recentSignals
    .map((s) => `[${s.date_observed}] ${s.competitor_name} — ${s.category_name}: ${s.headline}`)
    .join('\n');

  const prompt = `You are a competitive intelligence analyst for a biotech/synthetic biology company. Analyze the following competitive signals and identify cross-competitor patterns, trends, and notable clusters.

**Recent signals:**
${signalsText}

Write a concise markdown summary (3-5 paragraphs) highlighting:
1. Key cross-competitor trends (e.g., multiple companies doing the same thing)
2. Notable clusters of activity
3. Strategic implications

Return ONLY the markdown text, no JSON wrapping.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

- [ ] **Step 2: Implement generateLandscapeData**

```ts
// lib/llm/landscape.ts
import { getProModel, parseJsonResponse } from './client';
import type { Competitor, CompetitorAnalysis, LemniscaProfile, LandscapeData } from '@/lib/types';

export async function generateLandscapeData(
  competitors: Competitor[],
  analyses: CompetitorAnalysis[],
  lemniscaProfile: LemniscaProfile,
  customAxes?: string
): Promise<LandscapeData> {
  const model = getProModel();

  const competitorsText = competitors
    .map((c) => {
      const analysis = analyses.find((a) => a.competitor_id === c.id);
      return `**${c.name}** (${c.type}): ${c.one_liner || 'No description'}
${analysis ? `Overview: ${analysis.analysis_json.company_overview?.substring(0, 300)}` : 'No analysis available'}`;
    })
    .join('\n\n');

  const axesInstruction = customAxes
    ? `Use these axes: ${customAxes}`
    : 'Choose two strategically meaningful axes for comparing these biotech competitors (e.g., technology readiness vs commercial traction, or R&D depth vs market reach).';

  const prompt = `You are a strategic analyst positioning biotech/synthetic biology companies on a competitive landscape map.

**Companies to position:**

${competitorsText}

**Lemnisca (reference company):**
- Description: ${lemniscaProfile.description || 'Not provided'}
- Stage: ${lemniscaProfile.current_stage || 'Not provided'}
- Technology: ${lemniscaProfile.technology_focus || 'Not provided'}
- Positioning: ${lemniscaProfile.market_positioning || 'Not provided'}

${axesInstruction}

Position each company and Lemnisca on a 0-100 scale for each axis.

Return ONLY valid JSON (no markdown, no code fences):
{
  "axes": { "x": "X axis label", "y": "Y axis label" },
  "entities": [
    { "name": "Company Name", "x": 50, "y": 75, "isLemnisca": false },
    { "name": "Lemnisca", "x": 60, "y": 80, "isLemnisca": true }
  ]
}`;

  const result = await model.generateContent(prompt);
  return parseJsonResponse(result.response.text()) as LandscapeData;
}
```

- [ ] **Step 3: Implement checkDuplicateSignal**

```ts
// lib/llm/duplicate.ts
import { getFlashModel, parseJsonResponse } from './client';
import type { Signal, DuplicateCheckResult } from '@/lib/types';

export async function checkDuplicateSignal(
  newHeadline: string,
  existingSignals: Signal[]
): Promise<DuplicateCheckResult> {
  if (existingSignals.length === 0) {
    return { isDuplicate: false, similarSignal: null, explanation: 'No existing signals to compare against.' };
  }

  const model = getFlashModel();

  const existingText = existingSignals
    .map((s, i) => `${i}: [${s.date_observed}] ${s.headline}`)
    .join('\n');

  const prompt = `You are checking if a new competitive signal is a duplicate of an existing one.

**New signal:** ${newHeadline}

**Existing signals:**
${existingText}

Determine if the new signal describes the same real-world event as any existing signal (even if worded differently).

Return ONLY valid JSON (no markdown, no code fences):
{
  "isDuplicate": true/false,
  "similarIndex": null or the index number of the similar signal,
  "explanation": "brief explanation"
}`;

  const result = await model.generateContent(prompt);
  const parsed = parseJsonResponse(result.response.text());

  return {
    isDuplicate: parsed.isDuplicate,
    similarSignal: parsed.similarIndex !== null ? existingSignals[parsed.similarIndex] : null,
    explanation: parsed.explanation,
  };
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add lib/llm/patterns.ts lib/llm/landscape.ts lib/llm/duplicate.ts
git commit -m "feat: add pattern summary, landscape, and duplicate check LLM functions"
```

---

## Chunk 3: API Routes

### Task 10: Categories API + Lemnisca Profile API

**Files:**
- Create: `app/api/categories/route.ts`, `app/api/lemnisca/route.ts`

- [ ] **Step 1: Implement categories API**

```ts
// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('signal_categories')
    .select('*')
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const { name } = await request.json();

  const { data, error } = await supabase
    .from('signal_categories')
    .insert({ name, is_default: false })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Implement Lemnisca profile API**

```ts
// app/api/lemnisca/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('lemnisca_profile')
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json();

  const { data: existing } = await supabase
    .from('lemnisca_profile')
    .select('id')
    .single();

  if (!existing) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('lemnisca_profile')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 3: Verify**

```bash
# After setting up .env.local with real Supabase creds:
curl http://localhost:3000/api/categories
# Expected: JSON array with 11 default categories

curl http://localhost:3000/api/lemnisca
# Expected: JSON object with empty Lemnisca profile
```

- [ ] **Step 4: Commit**

```bash
git add app/api/categories/ app/api/lemnisca/
git commit -m "feat: add categories and Lemnisca profile API routes"
```

---

### Task 11: Competitors API (CRUD)

**Files:**
- Create: `app/api/competitors/route.ts`, `app/api/competitors/[id]/route.ts`

- [ ] **Step 1: Implement GET list and POST create**

```ts
// app/api/competitors/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { generateCompetitorAnalysis } from '@/lib/llm/analysis';
import { scanForSignals } from '@/lib/llm/signals';

export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .order('date_added', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json();

  // 1. Insert competitor
  const { data: competitor, error } = await supabase
    .from('competitors')
    .insert({
      name: body.name,
      type: body.type,
      one_liner: body.one_liner,
      strategic_context: body.strategic_context,
      additional_context: body.additional_context,
      website_url: body.website_url,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Insert tracked sources if provided
  if (body.sources?.length > 0) {
    await supabase.from('competitor_sources').insert(
      body.sources.map((s: any) => ({
        competitor_id: competitor.id,
        url: s.url,
        source_label: s.source_label,
      }))
    );
  }

  // 3. Fetch Lemnisca profile for comparative analysis
  const { data: lemnisca } = await supabase
    .from('lemnisca_profile')
    .select('*')
    .single();

  // 4. Generate deep analysis (async, don't block response for too long)
  try {
    const { analysis } = await generateCompetitorAnalysis(
      competitor.name,
      competitor.website_url,
      competitor.additional_context,
      lemnisca!
    );

    await supabase.from('competitor_analyses').insert({
      competitor_id: competitor.id,
      analysis_json: analysis,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Analysis generation failed:', err);
  }

  // 5. Run initial signal scan
  try {
    const { data: sources } = await supabase
      .from('competitor_sources')
      .select('*')
      .eq('competitor_id', competitor.id);

    const scannedSignals = await scanForSignals([{
      competitor: competitor,
      trackedSources: sources || [],
      recentHeadlines: [],
    }]);

    if (scannedSignals.length > 0) {
      // Resolve category names to IDs
      const { data: categories } = await supabase
        .from('signal_categories')
        .select('id, name');

      const categoryMap = new Map(categories?.map((c) => [c.name, c.id]) || []);

      await supabase.from('signals').insert(
        scannedSignals.map((s) => ({
          competitor_id: s.competitor_id,
          headline: s.headline,
          category_id: categoryMap.get(s.category_name) || null,
          date_observed: s.date_observed,
          source_urls: s.source_urls,
          source_type: s.source_type,
          llm_summary: s.llm_summary,
          source: 'automated' as const,
          is_read: false,
        }))
      );
    }
  } catch (err) {
    console.error('Initial scan failed:', err);
  }

  return NextResponse.json(competitor, { status: 201 });
}
```

- [ ] **Step 2: Implement GET detail and DELETE**

```ts
// app/api/competitors/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();

  const { data: competitor, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !competitor) {
    return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
  }

  // Get latest analysis
  const { data: analysis } = await supabase
    .from('competitor_analyses')
    .select('*')
    .eq('competitor_id', params.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ ...competitor, analysis });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('competitors')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Verify**

```bash
curl http://localhost:3000/api/competitors
# Expected: empty array []
```

- [ ] **Step 4: Commit**

```bash
git add app/api/competitors/
git commit -m "feat: add competitors CRUD API with analysis and scan on create"
```

---

### Task 12: Competitor Sources API

**Files:**
- Create: `app/api/competitors/[id]/sources/route.ts`, `app/api/competitors/[id]/sources/[sourceId]/route.ts`

- [ ] **Step 1: Implement sources list and add**

```ts
// app/api/competitors/[id]/sources/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('competitor_sources')
    .select('*')
    .eq('competitor_id', params.id)
    .order('created_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const { url, source_label } = await request.json();

  const { data, error } = await supabase
    .from('competitor_sources')
    .insert({ competitor_id: params.id, url, source_label })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Implement source delete**

```ts
// app/api/competitors/[id]/sources/[sourceId]/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; sourceId: string } }
) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('competitor_sources')
    .delete()
    .eq('id', params.sourceId)
    .eq('competitor_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/competitors/
git commit -m "feat: add competitor sources API routes"
```

---

### Task 13: Signals API

**Files:**
- Create: `app/api/signals/route.ts`, `app/api/signals/[id]/route.ts`, `app/api/signals/[id]/comments/route.ts`, `app/api/signals/check-duplicate/route.ts`

- [ ] **Step 1: Implement signals list (with filters) and manual add**

```ts
// app/api/signals/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from('signals')
    .select('*, competitor:competitors(id, name, type), category:signal_categories(id, name)')
    .order('date_observed', { ascending: false })
    .order('created_at', { ascending: false });

  const competitorId = searchParams.get('competitor_id');
  const categoryId = searchParams.get('category_id');
  const isRead = searchParams.get('is_read');
  const isFlagged = searchParams.get('is_flagged');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const limit = searchParams.get('limit');

  if (competitorId) query = query.eq('competitor_id', competitorId);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (isRead !== null && isRead !== undefined) query = query.eq('is_read', isRead === 'true');
  if (isFlagged === 'true') query = query.eq('is_flagged', true);
  if (dateFrom) query = query.gte('date_observed', dateFrom);
  if (dateTo) query = query.lte('date_observed', dateTo);
  if (limit) query = query.limit(parseInt(limit));

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('signals')
    .insert({
      competitor_id: body.competitor_id,
      headline: body.headline,
      category_id: body.category_id,
      date_observed: body.date_observed || new Date().toISOString().split('T')[0],
      source_urls: body.source_urls || [],
      source_type: body.source_type,
      llm_summary: body.llm_summary || null,
      strategic_note: body.strategic_note || null,
      source: 'manual',
      is_read: true, // Manual signals are marked read
    })
    .select('*, competitor:competitors(id, name, type), category:signal_categories(id, name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Implement signal update (PATCH)**

```ts
// app/api/signals/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const body = await request.json();

  // Only allow specific fields to be updated
  const allowedFields: Record<string, any> = {};
  if ('is_flagged' in body) allowedFields.is_flagged = body.is_flagged;
  if ('is_read' in body) allowedFields.is_read = body.is_read;
  if ('feedback' in body) allowedFields.feedback = body.feedback;
  if ('strategic_note' in body) allowedFields.strategic_note = body.strategic_note;

  allowedFields.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('signals')
    .update(allowedFields)
    .eq('id', params.id)
    .select('*, competitor:competitors(id, name, type), category:signal_categories(id, name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 3: Implement signal comments**

```ts
// app/api/signals/[id]/comments/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('signal_comments')
    .select('*')
    .eq('signal_id', params.id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceClient();
  const { content } = await request.json();

  const { data, error } = await supabase
    .from('signal_comments')
    .insert({ signal_id: params.id, content })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 4: Implement duplicate check**

```ts
// app/api/signals/check-duplicate/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { checkDuplicateSignal } from '@/lib/llm/duplicate';

export async function POST(request: Request) {
  const { headline, competitor_id } = await request.json();
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from('signals')
    .select('*')
    .eq('competitor_id', competitor_id)
    .order('date_observed', { ascending: false })
    .limit(50);

  const result = await checkDuplicateSignal(headline, existing || []);
  return NextResponse.json(result);
}
```

- [ ] **Step 5: Verify**

```bash
curl http://localhost:3000/api/signals
# Expected: empty array []

curl http://localhost:3000/api/categories
# Expected: 11 categories with IDs
```

- [ ] **Step 6: Commit**

```bash
git add app/api/signals/
git commit -m "feat: add signals API with filters, PATCH, comments, and duplicate check"
```

---

### Task 14: LLM-powered API routes (analyze, scan, patterns, landscape, cron)

**Files:**
- Create: `lib/services/scan.ts`, `app/api/analyze/[competitor_id]/route.ts`, `app/api/scan/route.ts`, `app/api/patterns/route.ts`, `app/api/landscape/route.ts`, `app/api/cron/scan/route.ts`, `app/api/signals/heatmap/route.ts`

- [ ] **Step 1: Extract shared scan logic into `lib/services/scan.ts`**

This function is imported by both `/api/scan/route.ts` and `/api/cron/scan/route.ts` — no internal fetch().

```ts
// lib/services/scan.ts
import { getServiceClient } from '@/lib/supabase/server';
import { scanForSignals } from '@/lib/llm/signals';

export async function runCompetitorScan(): Promise<{ newSignals: number }> {
  const supabase = getServiceClient();

  // Fetch all competitors with sources
  const { data: competitors } = await supabase.from('competitors').select('*');
  if (!competitors?.length) return { newSignals: 0 };

  const { data: categories } = await supabase.from('signal_categories').select('id, name');
  const categoryMap = new Map(categories?.map((c) => [c.name, c.id]) || []);

  // Build scan inputs with recent headlines for dedup
  const inputs = await Promise.all(
    competitors.map(async (competitor) => {
      const { data: sources } = await supabase
        .from('competitor_sources').select('*').eq('competitor_id', competitor.id);
      const { data: recentSignals } = await supabase
        .from('signals').select('headline').eq('competitor_id', competitor.id)
        .gte('date_observed', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
        .limit(50);
      return {
        competitor,
        trackedSources: sources || [],
        recentHeadlines: recentSignals?.map((s) => s.headline) || [],
      };
    })
  );

  const scannedSignals = await scanForSignals(inputs);

  if (scannedSignals.length > 0) {
    await supabase.from('signals').insert(
      scannedSignals.map((s) => ({
        competitor_id: s.competitor_id,
        headline: s.headline,
        category_id: categoryMap.get(s.category_name) || null,
        date_observed: s.date_observed,
        source_urls: s.source_urls,
        source_type: s.source_type,
        llm_summary: s.llm_summary,
        source: 'automated' as const,
        is_read: false,
      }))
    );
  }

  return { newSignals: scannedSignals.length };
}
```

- [ ] **Step 2: Implement POST /api/analyze/[competitor_id]**

Fetches competitor + Lemnisca profile, calls `generateCompetitorAnalysis`, inserts new analysis row. Returns the analysis.

- [ ] **Step 3: Implement POST /api/scan using shared scan service**

```ts
// app/api/scan/route.ts
import { NextResponse } from 'next/server';
import { runCompetitorScan } from '@/lib/services/scan';

export async function POST() {
  const result = await runCompetitorScan();
  return NextResponse.json(result);
}
```

- [ ] **Step 4: Implement GET /api/patterns**

Fetches signals from last 30 days with competitor names and category names. Calls `generatePatternSummary`. Returns markdown text.

- [ ] **Step 5: Implement POST /api/landscape**

Fetches all competitors + latest analyses + Lemnisca profile. Accepts optional `customAxes` in body. Calls `generateLandscapeData`. Returns landscape JSON.

- [ ] **Step 6: Implement GET /api/cron/scan using shared scan service (NO internal fetch)**

```ts
// app/api/cron/scan/route.ts
import { NextResponse } from 'next/server';
import { runCompetitorScan } from '@/lib/services/scan';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runCompetitorScan();
  return NextResponse.json(result);
}
```

- [ ] **Step 7: Implement GET /api/signals/heatmap (server-side aggregation)**

Returns aggregated signal counts grouped by competitor and week. The client does NOT aggregate — keeps the landing page lightweight.

```ts
// app/api/signals/heatmap/route.ts
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = getServiceClient();

  // Get signals from last 8 weeks with competitor info
  const eightWeeksAgo = new Date(Date.now() - 56 * 86400000).toISOString().split('T')[0];

  const { data: signals, error } = await supabase
    .from('signals')
    .select('competitor_id, date_observed, competitor:competitors(name)')
    .gte('date_observed', eightWeeksAgo)
    .order('date_observed', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by competitor + week
  const weekMap = new Map<string, number>();
  const result: { competitor_id: string; competitor_name: string; week: string; count: number }[] = [];

  for (const signal of signals || []) {
    const d = new Date(signal.date_observed);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = `${signal.competitor_id}:${weekStart.toISOString().split('T')[0]}`;

    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1);
  }

  for (const [key, count] of weekMap) {
    const [competitor_id, week] = key.split(':');
    const signal = (signals || []).find((s) => s.competitor_id === competitor_id);
    result.push({
      competitor_id,
      competitor_name: (signal?.competitor as any)?.name || '',
      week,
      count,
    });
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 8: Verify**

```bash
curl http://localhost:3000/api/patterns
# Expected: pattern summary text (may say "no signals yet")

curl http://localhost:3000/api/signals/heatmap
# Expected: empty array [] (no signals yet)
```

- [ ] **Step 9: Commit**

```bash
git add lib/services/ app/api/analyze/ app/api/scan/ app/api/patterns/ app/api/landscape/ app/api/cron/ app/api/signals/heatmap/
git commit -m "feat: add LLM-powered API routes with shared scan service and heatmap endpoint"
```

---

## Chunk 4: Core UI Components

### Task 15: Shared UI components

**Files:**
- Create: `components/shared/CategoryTag.tsx`, `components/shared/LoadingState.tsx`, `components/shared/ConfirmDialog.tsx`

- [ ] **Step 1: Create CategoryTag**

Color-coded badge component. Each category gets a distinct muted color. Props: `name: string`, `size?: 'sm' | 'md'`.

Color map:
- Fundraising → emerald
- Hiring → blue
- Leadership → purple
- Partnership → amber
- Launch → rose
- Pilot/Customer → cyan
- Plant/Infrastructure → orange
- Positioning → indigo
- Regulatory/IP → yellow
- Media/PR → pink
- Litigation → red
- Default → slate

- [ ] **Step 2: Create LoadingState**

Skeleton loader / shimmer component. Props: `variant?: 'card' | 'text' | 'full'`. Uses animated pulse with dark theme colors.

- [ ] **Step 3: Create ConfirmDialog**

Modal dialog for destructive actions. Props: `open`, `title`, `message`, `onConfirm`, `onCancel`, `confirmLabel`, `variant?: 'danger' | 'default'`. Overlay + centered card.

- [ ] **Step 4: Commit**

```bash
git add components/shared/
git commit -m "feat: add shared UI components (CategoryTag, LoadingState, ConfirmDialog)"
```

---

### Task 16: Signal components (SignalCard, FeedbackButtons, SignalFeed)

**Files:**
- Create: `components/signals/FeedbackButtons.tsx`, `components/signals/SignalCard.tsx`, `components/signals/SignalFeed.tsx`

- [ ] **Step 1: Create FeedbackButtons**

Thumbs up/down + flag toggle. Optimistic updates via PATCH /api/signals/[id]. Props: `signal: Signal`, `onUpdate: (signal: Signal) => void`.

- [ ] **Step 2: Create SignalCard**

Individual signal display card. Shows: competitor name, category tag, headline, date, source type, flag status, read/unread styling (bold for unread, muted for read). Includes FeedbackButtons. Click marks as read via PATCH. Expandable to show llm_summary and strategic_note.

- [ ] **Step 3: Create SignalFeed**

Fetches signals from API. Renders list of SignalCards. Unread signals highlighted (left border accent, bolder text). Supports filter props: `competitorId`, `categoryId`. Includes loading skeleton state.

- [ ] **Step 4: Verify**

Import SignalFeed into `app/dashboard/page.tsx`. Should render empty state or skeleton loader.

- [ ] **Step 5: Commit**

```bash
git add components/signals/
git commit -m "feat: add signal feed components (SignalCard, FeedbackButtons, SignalFeed)"
```

---

### Task 17: Signal form and comments

**Files:**
- Create: `components/signals/SignalForm.tsx`, `components/signals/SignalComments.tsx`, `components/signals/DuplicatePrompt.tsx`

- [ ] **Step 1: Create SignalForm**

Manual signal logging form. Fields: competitor (dropdown from API), category (dropdown from API), headline (text), source URL (text, optional), source type (dropdown), strategic note (textarea, optional). On submit: calls POST /api/signals/check-duplicate first, then either shows DuplicatePrompt or submits to POST /api/signals.

- [ ] **Step 2: Create DuplicatePrompt**

Modal showing the existing similar signal. Options: "Keep both" or "Replace existing". Calls appropriate API action.

- [ ] **Step 3: Create SignalComments**

Expandable comment thread on a signal. Lists existing comments. Input field to add new comment. Calls GET/POST /api/signals/[id]/comments.

- [ ] **Step 4: Commit**

```bash
git add components/signals/
git commit -m "feat: add signal form, duplicate prompt, and comments components"
```

---

### Task 18: Heatmap and Pattern Summary components

**Files:**
- Create: `components/heatmap/ActivityHeatmap.tsx`, `components/patterns/PatternSummary.tsx`

- [ ] **Step 1: Create ActivityHeatmap**

Custom SVG/HTML grid. Rows = competitors, columns = last 8 weeks. Cell intensity = signal count mapped to gradient (dark bg → muted → vibrant accent). Fetches pre-aggregated data from GET /api/signals/heatmap (server-side aggregation, NOT client-side). Horizontal scroll on mobile. Tooltip on hover showing competitor name + count.

- [ ] **Step 2: Create PatternSummary**

Fetches GET /api/patterns. Renders markdown text in a styled card. Loading skeleton while generating. Auto-fetches on mount.

- [ ] **Step 3: Commit**

```bash
git add components/heatmap/ components/patterns/
git commit -m "feat: add activity heatmap and pattern summary components"
```

---

### Task 19: Landing page (Dashboard home)

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Assemble landing page with parallel data fetching**

On page load, fetch three endpoints simultaneously using Promise.all:
- `GET /api/signals?limit=50` (signal feed)
- `GET /api/patterns` (LLM pattern summary)
- `GET /api/signals/heatmap` (pre-aggregated heatmap data)

Each section renders independently with its own loading skeleton while its data loads. Never sequential — always parallel.

Wire up all components:
1. Top: ActivityHeatmap (data from /api/signals/heatmap)
2. Middle: PatternSummary (data from /api/patterns)
3. Below: "Refresh feed" button (calls POST /api/scan, then refetches all three)
4. Main: SignalFeed (unread first, data from /api/signals)
5. Manual signal form (collapsible or slide-out panel)

Layout: responsive grid. Heatmap and patterns side by side on desktop, stacked on mobile.

**Important:** All LLM-powered operations (scan, patterns) show a proper loading indicator. The UI must never hang without feedback during multi-second LLM calls. Use loading spinners with descriptive text (e.g., "Scanning for new signals...", "Analyzing patterns...").

- [ ] **Step 2: Verify**

1. Run `npm run dev`, log in
2. Dashboard loads with all sections
3. Empty states shown for no data
4. Loading skeletons appear during data fetch

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: build landing page with heatmap, patterns, signal feed, and manual entry"
```

---

## Chunk 5: Competitor Views

### Task 20: Competitor list page

**Files:**
- Create: `components/competitors/CompetitorCard.tsx`
- Modify: `app/dashboard/competitors/page.tsx`

- [ ] **Step 1: Create CompetitorCard**

Card showing: name, type badge (direct/indirect), one-liner, date added, signal count (fetched). Links to `/dashboard/competitors/[id]`. Hover effect with subtle border highlight.

- [ ] **Step 2: Build competitor list page**

Fetches GET /api/competitors. Grid of CompetitorCards. "Add competitor" button linking to /dashboard/competitors/add. Empty state with prompt to add first competitor. Loading skeleton.

- [ ] **Step 3: Commit**

```bash
git add components/competitors/CompetitorCard.tsx app/dashboard/competitors/page.tsx
git commit -m "feat: build competitor list page with cards"
```

---

### Task 21: Add competitor form

**Files:**
- Create: `components/competitors/AddCompetitorForm.tsx`
- Modify: `app/dashboard/competitors/add/page.tsx`

- [ ] **Step 1: Create AddCompetitorForm**

Fields: name (required), type (direct/indirect toggle), website URL, one-liner, strategic context (textarea), additional context (textarea). Tracked sources section: repeatable rows with URL + label dropdown (linkedin/twitter/blog/careers/crunchbase/other). Add/remove source rows.

Submit calls POST /api/competitors. Shows loading state during analysis generation ("Generating analysis and scanning for signals..."). On success, redirects to competitor profile.

- [ ] **Step 2: Wire into add page**

- [ ] **Step 3: Verify**

Fill form, submit with a real company name. Should create competitor, generate analysis, find signals. Redirects to profile page.

- [ ] **Step 4: Commit**

```bash
git add components/competitors/AddCompetitorForm.tsx app/dashboard/competitors/add/page.tsx
git commit -m "feat: build add competitor form with tracked sources"
```

---

### Task 22: Competitor profile page

**Files:**
- Create: `components/competitors/AnalysisSection.tsx`, `components/competitors/CompetitorProfile.tsx`, `components/competitors/CompetitorSources.tsx`, `components/competitors/CompetitorTimeline.tsx`, `components/landscape/PositioningMap.tsx`
- Modify: `app/dashboard/competitors/[id]/page.tsx`

- [ ] **Step 1: Create AnalysisSection**

Collapsible section component. Props: `title`, `content` (string or JSX), `defaultOpen?: boolean`. Animated expand/collapse. Chevron rotation on toggle. All sections collapsed by default.

- [ ] **Step 2: Create CompetitorProfile**

Container that renders all analysis sections from the analysis_json:
- Company Overview
- Product / Technology
- SWOT (render strengths/weaknesses/opportunities/threats as styled lists)
- Market Positioning
- Funding & Investors
- Go-to-Market
- Customers / Pilots / Partnerships
- Infrastructure & Manufacturing
- Leadership & Team
- Threat Assessment
- **Landscape Position Chart** — renders a small PositioningMap (reuse from Task 25) showing this competitor's position relative to others, using the `landscape_position` data from `analysis_json`. Uses the fixed default axes "Technology Readiness" vs "Commercial Traction". This is a required feature per PRD View 2.

"Refresh analysis" button calls POST /api/analyze/[id]. Shows loading indicator with descriptive text ("Regenerating analysis...") during the multi-second LLM call.

- [ ] **Step 3: Create CompetitorSources**

Manage tracked sources. Lists current sources with delete button. Form to add new source (URL + label). Calls competitor sources API.

- [ ] **Step 4: Create CompetitorTimeline**

Signal timeline filtered to this competitor. Uses SignalFeed with `competitorId` filter. Chronological signal cards.

- [ ] **Step 5: Wire into profile page**

Fetch competitor with GET /api/competitors/[id]. Render CompetitorProfile (including landscape position chart) + CompetitorSources + CompetitorTimeline. Delete button with ConfirmDialog. Loading state.

**Note:** The PositioningMap component is created in Task 25 but is needed here. Build it early in Task 22 as a shared component, then reuse it in Task 25's landscape page.

- [ ] **Step 6: Verify**

Navigate to a competitor profile. All analysis sections render and collapse/expand including landscape position chart. Sources manageable. Signal timeline shows. Refresh analysis button works with loading indicator.

- [ ] **Step 7: Commit**

```bash
git add components/competitors/ app/dashboard/competitors/
git commit -m "feat: build competitor profile page with analysis, sources, and timeline"
```

---

## Chunk 6: Secondary Views

### Task 23: Lemnisca profile page

**Files:**
- Create: `components/lemnisca/LemniscaProfileForm.tsx`
- Modify: `app/dashboard/lemnisca/page.tsx`

- [ ] **Step 1: Create LemniscaProfileForm**

Editable form with fields: description, current_stage, differentiators, technology_focus, market_positioning, funding_status, team_strengths, strategic_priorities. All textareas. Fetches current profile on mount. Save button calls PUT /api/lemnisca. Success toast/indicator.

- [ ] **Step 2: Wire into page**

- [ ] **Step 3: Commit**

```bash
git add components/lemnisca/ app/dashboard/lemnisca/page.tsx
git commit -m "feat: build Lemnisca profile editor page"
```

---

### Task 24: Category filter page

**Files:**
- Modify: `app/dashboard/categories/page.tsx`

- [ ] **Step 1: Build category filter page**

Fetches all categories from GET /api/categories. Renders as clickable pills/tabs. Selecting a category fetches signals filtered by that category via GET /api/signals?category_id=X. Renders filtered SignalFeed below. "Add category" button with inline form. Empty state per category.

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/categories/page.tsx
git commit -m "feat: build category filter page"
```

---

### Task 25: Competitive landscape page

**Files:**
- Create: `components/landscape/PositioningMap.tsx`, `components/landscape/CustomAxisInput.tsx`
- Modify: `app/dashboard/landscape/page.tsx`

- [ ] **Step 1: Create PositioningMap**

Quadrant chart using Recharts ScatterChart or custom SVG. Plots entities on x/y axes (0-100 scale). Lemnisca rendered as special marker (different color/shape). Labels on each point. Axis labels from landscape data. Responsive sizing.

- [ ] **Step 2: Create CustomAxisInput**

Text input for custom axis prompt. Submit button. Sends custom axes to POST /api/landscape.

- [ ] **Step 3: Build landscape page**

On mount: calls POST /api/landscape to generate default positioning. Renders PositioningMap + CustomAxisInput. Loading state during generation. Can regenerate with custom axes.

- [ ] **Step 4: Commit**

```bash
git add components/landscape/ app/dashboard/landscape/page.tsx
git commit -m "feat: build competitive landscape page with positioning maps"
```

---

### Task 26: Mobile responsiveness polish

**Files:**
- Modify: `components/shared/Navigation.tsx`, various component files

- [ ] **Step 1: Sidebar → bottom tab bar on mobile**

Navigation component: `md:` breakpoint switches from sidebar to fixed bottom bar. Icons only on mobile, 56px height. All touch targets ≥ 44px.

- [ ] **Step 2: Responsive adjustments**

- Signal cards: full width, stacked vertically on mobile
- Heatmap: horizontal scroll container on small screens
- Competitor profile: full-width accordions
- Forms: full-screen on mobile (or close to it)
- Landscape chart: scales down, pinch-to-zoom via touch events

- [ ] **Step 3: Verify**

Test at 375px, 768px, and 1440px widths. All views usable at each breakpoint.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add mobile responsive layouts (bottom nav, stacked cards, scroll heatmap)"
```

---

### Task 27: Final polish — loading states, empty states, micro-interactions

**Files:**
- Modify: various component files

- [ ] **Step 1: Loading states**

Ensure all data-fetching views show skeleton loaders:
- Signal feed: skeleton signal cards (3-4 placeholder cards with shimmer)
- Competitor list: skeleton competitor cards
- Profile: skeleton sections
- Pattern summary: text skeleton
- Landscape: chart skeleton

- [ ] **Step 2: Empty states**

Add helpful empty states:
- No competitors: "Add your first competitor to get started" with CTA button
- No signals: "No signals yet. Add competitors or run a scan."
- No signals in category: "No signals in this category yet."
- No analysis: "Analysis not yet generated. Click Refresh to generate."

- [ ] **Step 3: Micro-interactions**

- Hover effects on cards (subtle border color change)
- Smooth transitions on collapsible sections (max-height transition)
- Fade-in on data load (opacity transition)
- Button press states
- Optimistic UI updates on feedback/flag toggles

- [ ] **Step 4: Verify**

Walk through all views checking: loading → content transitions, empty states, hover effects, toggle animations.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add loading skeletons, empty states, and micro-interactions"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1: Foundation | 1-5 | Next.js project, DB schema, auth, dashboard layout |
| 2: LLM Service Layer | 6-9 | All 5 Gemini LLM functions |
| 3: API Routes | 10-14 | All 15+ API endpoints |
| 4: Core UI | 15-19 | Shared components, signal feed, landing page |
| 5: Competitor Views | 20-22 | Competitor list, add form, profile page |
| 6: Secondary Views | 23-27 | Lemnisca, categories, landscape, mobile, polish |

**Total: 27 tasks, ~80 steps**

Each chunk produces working, testable software. Commits after every task.
