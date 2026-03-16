'use client';

import type { AnalysisJSON } from '@/lib/types';
import AnalysisSection from './AnalysisSection';
import PositioningMap from '@/components/landscape/PositioningMap';

export default function CompetitorProfile({
  analysis,
  competitorName,
  onRefresh,
  refreshing,
}: {
  analysis: AnalysisJSON | null;
  competitorName: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  if (!analysis) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-text-muted">No analysis generated yet.</p>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="mt-3 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Generating...' : 'Generate Analysis'}
        </button>
      </div>
    );
  }

  const landscapeData = analysis.landscape_position
    ? {
        axes: {
          x: analysis.landscape_position.axes?.[0] || 'Technology Readiness',
          y: analysis.landscape_position.axes?.[1] || 'Commercial Traction',
        },
        entities: [
          {
            name: competitorName,
            x: analysis.landscape_position.position?.x || 50,
            y: analysis.landscape_position.position?.y || 50,
            isLemnisca: false,
          },
        ],
      }
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">Analysis</h2>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 text-sm font-medium bg-bg-card border border-border rounded-lg hover:border-border-light transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {refreshing && (
            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          )}
          {refreshing ? 'Regenerating...' : 'Refresh Analysis'}
        </button>
      </div>

      <AnalysisSection title="Company Overview">
        <p>{analysis.company_overview}</p>
      </AnalysisSection>

      <AnalysisSection title="Product & Technology">
        <p>{analysis.product_technology}</p>
      </AnalysisSection>

      <AnalysisSection title="SWOT Analysis">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-emerald-400 mb-2">Strengths</h4>
            <ul className="list-disc list-inside space-y-1">
              {analysis.swot.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-400 mb-2">Weaknesses</h4>
            <ul className="list-disc list-inside space-y-1">
              {analysis.swot.weaknesses.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-400 mb-2">Opportunities</h4>
            <ul className="list-disc list-inside space-y-1">
              {analysis.swot.opportunities.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-amber-400 mb-2">Threats</h4>
            <ul className="list-disc list-inside space-y-1">
              {analysis.swot.threats.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </AnalysisSection>

      <AnalysisSection title="Market Positioning">
        <p>{analysis.market_positioning}</p>
      </AnalysisSection>

      <AnalysisSection title="Funding & Investors">
        <p>{analysis.funding_investors}</p>
      </AnalysisSection>

      <AnalysisSection title="Go-to-Market">
        <p>{analysis.go_to_market}</p>
      </AnalysisSection>

      <AnalysisSection title="Customers / Pilots / Partnerships">
        <p>{analysis.customers_pilots_partnerships}</p>
      </AnalysisSection>

      <AnalysisSection title="Infrastructure & Manufacturing">
        <p>{analysis.infrastructure_manufacturing}</p>
      </AnalysisSection>

      <AnalysisSection title="Leadership & Team">
        <p>{analysis.leadership_team}</p>
      </AnalysisSection>

      <AnalysisSection title="Threat Assessment">
        <p>{analysis.threat_assessment}</p>
      </AnalysisSection>

      {landscapeData && (
        <AnalysisSection title="Landscape Position">
          <PositioningMap data={landscapeData} compact />
        </AnalysisSection>
      )}
    </div>
  );
}
