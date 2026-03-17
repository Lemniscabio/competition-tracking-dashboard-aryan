'use client';

import type { AnalysisJSON } from '@/lib/types';
import AnalysisSection from './AnalysisSection';
import AnalysisLoader from './AnalysisLoader';
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
    if (refreshing) {
      return <AnalysisLoader competitorName={competitorName} />;
    }
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-text-muted">No analysis generated yet.</p>
        <button
          onClick={onRefresh}
          className="mt-3 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors"
        >
          Generate Analysis
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

      {refreshing && <AnalysisLoader competitorName={competitorName} />}

      <AnalysisSection title="Company Overview">
        <p>{analysis.company_overview}</p>
      </AnalysisSection>

      {analysis.key_facts && (
        <AnalysisSection title="Key Facts" defaultOpen={true}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {analysis.key_facts.founded_year && (
              <div className="bg-bg-elevated rounded-md p-3">
                <p className="text-xs text-text-dim mb-0.5">Founded</p>
                <p className="text-sm font-medium text-text">{analysis.key_facts.founded_year}</p>
              </div>
            )}
            {analysis.key_facts.headquarters && (
              <div className="bg-bg-elevated rounded-md p-3">
                <p className="text-xs text-text-dim mb-0.5">Headquarters</p>
                <p className="text-sm font-medium text-text">{analysis.key_facts.headquarters}</p>
              </div>
            )}
            {analysis.key_facts.employee_count && (
              <div className="bg-bg-elevated rounded-md p-3">
                <p className="text-xs text-text-dim mb-0.5">Employees</p>
                <p className="text-sm font-medium text-text">{analysis.key_facts.employee_count}</p>
              </div>
            )}
            {analysis.key_facts.total_funding && (
              <div className="bg-bg-elevated rounded-md p-3">
                <p className="text-xs text-text-dim mb-0.5">Total Funding</p>
                <p className="text-sm font-medium text-text">{analysis.key_facts.total_funding}</p>
              </div>
            )}
            {analysis.key_facts.latest_round && (
              <div className="bg-bg-elevated rounded-md p-3">
                <p className="text-xs text-text-dim mb-0.5">Latest Round</p>
                <p className="text-sm font-medium text-text">{analysis.key_facts.latest_round}</p>
              </div>
            )}
            {analysis.key_facts.key_investors && analysis.key_facts.key_investors.length > 0 && (
              <div className="bg-bg-elevated rounded-md p-3">
                <p className="text-xs text-text-dim mb-0.5">Key Investors</p>
                <p className="text-sm font-medium text-text">{analysis.key_facts.key_investors.join(', ')}</p>
              </div>
            )}
          </div>
        </AnalysisSection>
      )}

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

      {(analysis as any)?.source_urls && (analysis as any).source_urls.length > 0 && (
        <AnalysisSection title="Sources" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {(analysis as any).source_urls.map((url: string, i: number) => {
              let hostname = url;
              try { hostname = new URL(url).hostname; } catch {}
              return (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-bg-elevated border border-border rounded-md text-accent hover:border-accent/40 hover:bg-accent/5 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  {hostname}
                </a>
              );
            })}
          </div>
        </AnalysisSection>
      )}

      {landscapeData && (
        <AnalysisSection title="Landscape Position">
          <PositioningMap data={landscapeData} compact />
        </AnalysisSection>
      )}
    </div>
  );
}
