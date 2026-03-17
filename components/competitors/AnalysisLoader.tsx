'use client';

import { useState, useEffect } from 'react';

const facts = [
  'Analyzing competitor web presence and digital footprint...',
  'Scanning funding databases and investor networks...',
  'Evaluating product-market positioning signals...',
  'Cross-referencing patent filings and IP landscape...',
  'Mapping leadership team backgrounds and expertise...',
  'Reviewing press releases and media coverage...',
  'Assessing go-to-market strategy indicators...',
  'Identifying strategic partnerships and collaborations...',
  'Evaluating manufacturing and infrastructure capacity...',
  'Generating SWOT analysis relative to Lemnisca...',
  'Mapping competitive landscape positioning...',
  'Synthesizing threat assessment and strategic outlook...',
];

export default function AnalysisLoader({ competitorName }: { competitorName: string }) {
  const [factIndex, setFactIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % facts.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
      {/* Animated spinner */}
      <div className="relative mb-6">
        <div className="w-16 h-16 border-[3px] border-border rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-[3px] border-transparent border-t-accent rounded-full animate-spin" />
        <div className="absolute inset-2 w-12 h-12 border-[3px] border-transparent border-b-cyan-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-text mb-2">
        Generating Analysis
      </h3>
      <p className="text-sm text-text-dim mb-6">
        Deep-diving into <span className="text-accent font-medium">{competitorName}</span>
      </p>

      {/* Rotating fact */}
      <div className="h-12 flex items-center">
        <p
          className={`text-sm text-text-muted text-center max-w-md transition-opacity duration-300 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {facts[factIndex]}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>
    </div>
  );
}
