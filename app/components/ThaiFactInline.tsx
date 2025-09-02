'use client';

import React from 'react';

type Fact = { fact: string; category: string; difficulty: string };

export default function ThaiFactInline({ className = '' }: { className?: string }) {
  const [fact, setFact] = React.useState<Fact | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const fetchFact = () => {
      fetch('/api/thai-facts/random')
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data) => {
          if (!cancelled) setFact({ fact: data.fact, category: data.category, difficulty: data.difficulty });
        })
        .catch(() => {});
    };

    fetchFact();
    const id = setInterval(fetchFact, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!fact) return null;

  const badgeColor =
    fact.difficulty === 'beginner' ? 'text-green-400' : fact.difficulty === 'intermediate' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className={`mt-4 text-center ${className}`}>
      <div className="text-xs text-gray-500 mb-1">Thai fact</div>
      <div className="inline-block bg-[#1A1A1A] rounded-lg px-4 py-3 border border-[#333] text-left max-w-md">
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
          <span className="capitalize">{fact.category}</span>
          <span className="text-gray-600">•</span>
          <span className={`capitalize font-medium ${badgeColor}`}>{fact.difficulty}</span>
        </div>
        <div className="text-sm text-gray-200">{fact.fact}</div>
      </div>
    </div>
  );
}


