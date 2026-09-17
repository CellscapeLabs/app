// Small static UI sketches for the "How a lesson works" cards on the home page.
// Decorative only — each mirrors a real interaction used in the lessons.

export function ExploreMockup() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col justify-center gap-3 px-6">
      <div className="flex justify-between text-[10px] font-semibold text-zinc-400">
        <span>Prophase</span><span className="text-zinc-900">Metaphase</span><span>Anaphase</span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-200">
        <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-emerald-500" />
        <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-500 bg-white shadow" />
      </div>
      <div className="text-center text-[10px] font-semibold uppercase tracking-widest text-zinc-400">drag to scrub</div>
    </div>
  );
}

export function PredictMockup() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col justify-center gap-1.5 px-6">
      <div className="mb-1 text-[11px] font-semibold text-zinc-800">What separates in anaphase?</div>
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-900">✓ Sister chromatids</div>
      <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-400">Homologous pairs</div>
      <div className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-400">Centrosomes</div>
    </div>
  );
}

export function ExperimentMockup() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 120" className="h-full w-full px-4">
      {[20, 50, 80].map((y) => <line key={y} x1={24} y1={y} x2={188} y2={y} stroke="#f1f5f9" />)}
      <line x1={24} y1={100} x2={188} y2={100} stroke="#cbd5e1" />
      <line x1={24} y1={14} x2={24} y2={100} stroke="#cbd5e1" />
      <path d="M 24 100 H 58 V 88 H 72 V 74 H 84 V 60 H 98 V 44 H 112 V 30 H 128 V 20 H 188" fill="none" stroke="#10b981" strokeWidth={3} strokeLinejoin="round" />
      <path d="M 24 100 H 100 V 92 H 124 V 82 H 146 V 72 H 170 V 62 H 188" fill="none" stroke="#3b82f6" strokeWidth={3} strokeLinejoin="round" />
      <text x={106} y={116} textAnchor="middle" fontSize={8} fill="#94a3b8" fontFamily="system-ui">time</text>
    </svg>
  );
}
