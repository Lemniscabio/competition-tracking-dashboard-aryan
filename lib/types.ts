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
  key_facts?: {
    founded_year: string | null;
    headquarters: string | null;
    employee_count: string | null;
    total_funding: string | null;
    latest_round: string | null;
    key_investors: string[] | null;
  };
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

export interface HeatmapEntry {
  competitor_id: string;
  competitor_name: string;
  week: string;
  count: number;
}
