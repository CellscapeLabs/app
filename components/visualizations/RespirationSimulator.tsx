"use client";
/*
 * Biology concept: Cellular respiration as a connected pipeline — what happens when a step breaks
 * Glycolysis → Krebs cycle → electron transport chain (ETC) → ATP synthase, with fermentation as
 * the fallback. Each intervention acts on a real mechanism, and its effects propagate:
 *   - No O₂: nothing accepts electrons at complex IV, so the ETC stops → NADH can't be recycled
 *     to NAD⁺ → Krebs stalls → pyruvate is fermented, which regenerates NAD⁺ for glycolysis (2 ATP)
 *   - Cyanide: blocks complex IV — same outcome as no O₂ even though O₂ is present
 *   - DNP (uncoupler): H⁺ leaks across the inner membrane, bypassing ATP synthase → the ETC races,
 *     O₂ use rises, the gradient collapses, and energy is released as heat instead of ATP
 *   - Oligomycin: blocks ATP synthase → H⁺ can't flow back, the gradient maxes out, and the ETC
 *     backs up almost to a stop
 * Interactions: four toggle switches and a reset. The pathway map animates flow along each step
 * in proportion to its activity and marks blocked steps; meters show ATP per glucose, O₂ use,
 * H⁺ gradient, CO₂, heat and lactate; a "What's happening" list explains the chain of effects.
 * Three challenges tick off when the student finds a matching condition.
 */

import { useState } from "react";

// ─── Model ────────────────────────────────────────────────────────────────────
export interface Interventions {
  oxygen:     boolean;
  cyanide:    boolean;
  dnp:        boolean;
  oligomycin: boolean;
}

export interface PipelineState {
  glycolysis:   number;   // activity, 0–1
  fermentation: number;
  krebs:        number;
  etc:          number;   // 0–1.5 (uncoupled chain runs faster than normal)
  synthase:     number;
  gradient:     number;   // H⁺ gradient, 0–1
  atp:          number;   // ATP per glucose
  o2Use:        number;   // relative to normal (1)
  heat:         number;   // 0–1
}

const NORMAL: Interventions = { oxygen: true, cyanide: false, dnp: false, oligomycin: false };

export function simulate(t: Interventions): PipelineState {
  const acceptor = t.oxygen && !t.cyanide;
  const etc = !acceptor ? 0 : t.dnp ? 1.5 : t.oligomycin ? 0.1 : 1;
  const gradient = !acceptor ? 0.05 : t.dnp ? 0.1 : t.oligomycin ? 1 : 0.65;
  const synthase = t.oligomycin ? 0 : t.dnp ? 0.15 : etc;
  const synthaseAtp = t.oligomycin ? 0 : t.dnp ? 3 : 32 * etc;
  const krebs = Math.min(1, etc);
  const fermentation = 1 - krebs;
  return {
    glycolysis: 1,
    fermentation,
    krebs,
    etc,
    synthase,
    gradient,
    atp: Math.round(2 + 2 * krebs + synthaseAtp),
    o2Use: etc,
    heat: t.dnp && acceptor ? 1 : 0.15,
  };
}

function explain(t: Interventions, s: PipelineState): string[] {
  const out: string[] = [];
  const acceptor = t.oxygen && !t.cyanide;
  if (!t.cyanide && t.oxygen && !t.dnp && !t.oligomycin) {
    return ["Everything is running. O₂ accepts electrons at the end of the chain, the H⁺ gradient drives ATP synthase, and one glucose yields about 36 ATP."];
  }
  if (!t.oxygen) out.push("With no O₂ to accept electrons at complex IV, the electron transport chain stops.");
  else if (t.cyanide) out.push("Cyanide blocks complex IV. O₂ is there, but electrons can't reach it — so the chain stops anyway.");
  if (acceptor && t.dnp) out.push("DNP makes the inner membrane leak H⁺. The gradient collapses without passing through ATP synthase, so the chain races and burns O₂ — but the energy escapes as heat.");
  if (acceptor && t.oligomycin && !t.dnp) out.push("Oligomycin blocks ATP synthase. H⁺ can't flow back, the gradient maxes out, and the chain backs up until it barely moves.");
  if (acceptor && t.oligomycin && t.dnp) out.push("ATP synthase is blocked too, so the racing chain makes no ATP at all.");
  if (s.krebs < 0.5) out.push("NADH can't unload its electrons, so NAD⁺ runs out and the Krebs cycle stalls — CO₂ output drops.");
  if (s.fermentation > 0.5) out.push("Pyruvate is diverted into fermentation, which recycles NAD⁺ so glycolysis can keep making its 2 ATP. Lactate builds up.");
  return out;
}

// ─── Challenges ───────────────────────────────────────────────────────────────
const CHALLENGES: { id: string; prompt: string; test: (t: Interventions, s: PipelineState) => boolean; reveal: string }[] = [
  {
    id: "stop-with-o2",
    prompt: "Stop the electron transport chain while oxygen is still available.",
    test: (t, s) => t.oxygen && s.etc === 0,
    reveal: "Cyanide binds complex IV, the enzyme that hands electrons to O₂. Cells suffocate even with oxygen all around — which is why cyanide is so lethal.",
  },
  {
    id: "more-o2-less-atp",
    prompt: "Make the cell use MORE oxygen while making LESS ATP.",
    test: (_t, s) => s.o2Use > 1 && s.atp < 36,
    reveal: "An uncoupler like DNP disconnects the chain from ATP synthase. Electrons flow faster than ever, but the H⁺ gradient leaks away as heat. DNP was once sold as a diet pill — it caused deadly overheating.",
  },
  {
    id: "max-gradient",
    prompt: "Push the H⁺ gradient to its maximum.",
    test: (_t, s) => s.gradient >= 1,
    reveal: "With ATP synthase blocked, H⁺ has nowhere to go. The gradient builds until pumping H⁺ against it is too hard — so the chain slows down. That back-pressure is how ATP supply is matched to demand.",
  },
];

// ─── Pathway map ──────────────────────────────────────────────────────────────
const COL = {
  glucose: "#eab308", glycolysis: "#10b981", ferment: "#f97316", krebs: "#f59e0b",
  etc: "#8b5cf6", synthase: "#10b981", hplus: "#f43f5e", o2: "#0ea5e9", idle: "#e4e4e7",
};

function Flow({ d, activity, color, width = 3 }: { d: string; activity: number; color: string; width?: number }) {
  const on = activity > 0.02;
  return (
    <g>
      <path d={d} fill="none" stroke={COL.idle} strokeWidth={width} strokeLinecap="round" />
      {on && (
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
          strokeDasharray="6 4" className="animate-flow"
          style={{ animationDuration: `${(1.4 / Math.min(1.5, activity)).toFixed(2)}s` }}
          opacity={Math.min(1, 0.35 + 0.65 * activity)} />
      )}
    </g>
  );
}

function Block({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="white" stroke="#e11d48" strokeWidth={2.5} />
      <path d={`M ${x - 4} ${y - 4} L ${x + 4} ${y + 4} M ${x + 4} ${y - 4} L ${x - 4} ${y + 4}`} stroke="#e11d48" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

function Box({ x, y, w, h, label, sub, color, activity }: {
  x: number; y: number; w: number; h: number; label: string; sub?: string; color: string; activity: number;
}) {
  const on = activity > 0.02;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8}
        fill={on ? color : "#fafafa"} fillOpacity={on ? 0.12 + 0.18 * Math.min(1, activity) : 1}
        stroke={on ? color : "#d4d4d8"} strokeWidth={1.8} />
      <text x={x} y={sub ? y - 1 : y + 4} textAnchor="middle" fontSize={10} fontWeight={800}
        fill={on ? "#27272a" : "#a1a1aa"} fontFamily="system-ui">{label}</text>
      {sub && (
        <text x={x} y={y + 11} textAnchor="middle" fontSize={8} fontWeight={600}
          fill={on ? "#52525b" : "#a1a1aa"} fontFamily="system-ui">{sub}</text>
      )}
    </g>
  );
}

function PathwayMap({ t, s }: { t: Interventions; s: PipelineState }) {
  const acceptor = t.oxygen && !t.cyanide;
  const hplusCount = Math.round(s.gradient * 8);
  const MEM_X = 318;

  return (
    <svg viewBox="0 0 420 260" className="h-full w-full" role="img"
      aria-label={`Respiration pathway: ${s.atp} ATP per glucose`}>
      <defs>
        <marker id="rs-arr" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 z" fill="#a1a1aa" />
        </marker>
      </defs>

      {/* Compartments */}
      <text x={84} y={14} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#10b981" fontFamily="system-ui" letterSpacing={0.5}>CYTOPLASM</text>
      <rect x={150} y={22} width={262} height={230} rx={40} fill="#fffbeb" stroke="#f59e0b" strokeWidth={2} />
      <text x={220} y={14} textAnchor="middle" fontSize={8.5} fontWeight={700} fill="#d97706" fontFamily="system-ui" letterSpacing={0.5}>MITOCHONDRION</text>

      {/* Cytoplasm: glucose → glycolysis → pyruvate → (fermentation) */}
      <Flow d="M 84 42 V 64" activity={s.glycolysis} color={COL.glucose} />
      <Flow d="M 84 98 V 124" activity={s.glycolysis} color={COL.glycolysis} />
      <Flow d="M 84 152 V 186" activity={s.fermentation} color={COL.ferment} />
      <Flow d="M 114 138 H 182" activity={s.krebs} color={COL.krebs} />
      {/* NAD⁺ recycled by fermentation back to glycolysis */}
      <Flow d="M 36 206 C 18 206, 18 82, 34 82" activity={s.fermentation} color={COL.ferment} width={2} />
      {s.fermentation > 0.02 && (
        <text x={9} y={150} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#c2410c" fontFamily="system-ui"
          transform="rotate(-90 9 150)">NAD⁺ recycled</text>
      )}

      <g fontFamily="system-ui">
        <rect x={54} y={24} width={60} height={18} rx={9} fill={COL.glucose} fillOpacity={0.85} />
        <text x={84} y={37} textAnchor="middle" fontSize={9} fontWeight={800} fill="white">Glucose</text>
      </g>
      <Box x={84} y={81} w={96} h={34} label="Glycolysis" sub="+2 ATP" color={COL.glycolysis} activity={s.glycolysis} />
      <g fontFamily="system-ui">
        <rect x={54} y={128} width={60} height={20} rx={10} fill="#fb923c" fillOpacity={0.85} />
        <text x={84} y={142} textAnchor="middle" fontSize={9} fontWeight={800} fill="white">Pyruvate</text>
      </g>
      <Box x={84} y={206} w={96} h={34} label="Fermentation" sub="→ lactate" color={COL.ferment} activity={s.fermentation} />

      {/* Krebs cycle */}
      <Flow d="M 236 104 V 60" activity={s.krebs} color="#94a3b8" width={2} />
      <text x={236} y={52} textAnchor="middle" fontSize={9} fontWeight={800} fill={s.krebs > 0.02 ? "#64748b" : "#d4d4d8"} fontFamily="system-ui">CO₂</text>
      <circle cx={236} cy={138} r={32} fill={s.krebs > 0.02 ? COL.krebs : "#fafafa"} fillOpacity={s.krebs > 0.02 ? 0.12 + 0.18 * s.krebs : 1}
        stroke={s.krebs > 0.02 ? COL.krebs : "#d4d4d8"} strokeWidth={1.8} />
      <text x={236} y={136} textAnchor="middle" fontSize={10} fontWeight={800} fill={s.krebs > 0.02 ? "#27272a" : "#a1a1aa"} fontFamily="system-ui">Krebs</text>
      <text x={236} y={148} textAnchor="middle" fontSize={8} fontWeight={600} fill={s.krebs > 0.02 ? "#52525b" : "#a1a1aa"} fontFamily="system-ui">+2 ATP</text>

      {/* NADH → ETC */}
      <Flow d={`M 268 138 H ${MEM_X - 8}`} activity={s.etc} color={COL.etc} />
      <text x={290} y={131} textAnchor="middle" fontSize={8} fontWeight={700} fill="#7c3aed" fontFamily="system-ui">NADH</text>

      {/* Inner membrane with the electron transport chain */}
      <rect x={MEM_X - 5} y={40} width={10} height={196} rx={5} fill="#ddd6fe" />
      <Flow d={`M ${MEM_X} 60 V 176`} activity={s.etc} color={COL.etc} width={3.5} />
      {[["I", 70], ["III", 120], ["IV", 170]].map(([label, y]) => (
        <g key={label}>
          <rect x={MEM_X - 12} y={Number(y) - 10} width={24} height={20} rx={5}
            fill={s.etc > 0.02 ? COL.etc : "#e4e4e7"} fillOpacity={s.etc > 0.02 ? 0.9 : 1} />
          <text x={MEM_X} y={Number(y) + 3.5} textAnchor="middle" fontSize={8} fontWeight={800} fill="white" fontFamily="system-ui">{label}</text>
        </g>
      ))}
      <text x={MEM_X} y={34} textAnchor="middle" fontSize={8} fontWeight={700} fill="#7c3aed" fontFamily="system-ui">ETC</text>

      {/* O₂ as the final electron acceptor at complex IV */}
      <Flow d={`M 378 170 H ${MEM_X + 14}`} activity={acceptor ? Math.min(1, s.etc) : 0} color={COL.o2} />
      <text x={392} y={167} textAnchor="middle" fontSize={9} fontWeight={800} fill={t.oxygen ? "#0284c7" : "#d4d4d8"} fontFamily="system-ui">O₂</text>
      <text x={392} y={180} textAnchor="middle" fontSize={7} fill={t.oxygen ? "#64748b" : "#d4d4d8"} fontFamily="system-ui">→ H₂O</text>
      {!t.oxygen && <Block x={352} y={170} />}
      {t.oxygen && t.cyanide && <Block x={MEM_X} y={170} />}

      {/* H⁺ gradient in the intermembrane space */}
      {Array.from({ length: hplusCount }, (_, i) => (
        <g key={i}>
          <circle cx={346 + (i % 2) * 22} cy={62 + i * 11} r={6.5} fill={COL.hplus} fillOpacity={0.15} stroke={COL.hplus} strokeWidth={1} />
          <text x={346 + (i % 2) * 22} y={65 + i * 11} textAnchor="middle" fontSize={6.5} fontWeight={800} fill={COL.hplus} fontFamily="system-ui">H⁺</text>
        </g>
      ))}

      {/* DNP: H⁺ leaks straight through the membrane, releasing heat */}
      {t.dnp && acceptor && [96, 192].map((y) => (
        <g key={y}>
          <path d={`M ${MEM_X + 22} ${y} H ${MEM_X - 22}`} stroke={COL.hplus} strokeWidth={2} strokeDasharray="3 2"
            markerEnd="url(#rs-arr)" className="animate-flow" style={{ animationDuration: "0.6s" }} />
          <text x={MEM_X - 30} y={y + 3} textAnchor="end" fontSize={8} fontWeight={800} fill="#dc2626" fontFamily="system-ui">heat</text>
        </g>
      ))}

      {/* ATP synthase */}
      <Flow d={`M 372 214 H ${MEM_X + 12}`} activity={s.synthase} color={COL.hplus} />
      <circle cx={MEM_X} cy={214} r={11} fill={s.synthase > 0.02 ? COL.synthase : "#e4e4e7"} fillOpacity={0.9} />
      <rect x={MEM_X - 4} y={214} width={8} height={18} rx={3} fill={s.synthase > 0.02 ? COL.synthase : "#e4e4e7"} />
      <text x={MEM_X - 18} y={211} textAnchor="end" fontSize={8} fontWeight={700} fill="#047857" fontFamily="system-ui">ATP synthase</text>
      <text x={MEM_X - 18} y={223} textAnchor="end" fontSize={9} fontWeight={800}
        fill={s.synthase > 0.02 ? "#047857" : "#a1a1aa"} fontFamily="system-ui">
        +{Math.max(0, s.atp - 2 - Math.round(2 * s.krebs))} ATP
      </text>
      {t.oligomycin && <Block x={MEM_X} y={214} />}
    </svg>
  );
}

// ─── Meters ───────────────────────────────────────────────────────────────────
function Meter({ label, value, max, display, color }: { label: string; value: number; max: number; display: string; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-zinc-500">{label}</span>
        <span className="font-bold tabular-nums text-zinc-800">{display}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100" role="meter" aria-label={label}
        aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={display}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function Toggle({ label, detail, on, onChange }: { label: string; detail: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
        on ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:bg-zinc-50"
      }`}>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-zinc-900" : "bg-zinc-300"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-zinc-900">{label}</span>
        <span className="block text-xs text-zinc-500">{detail}</span>
      </span>
    </button>
  );
}

// ─── RespirationSimulator ─────────────────────────────────────────────────────
export function RespirationSimulator() {
  const [t, setT] = useState<Interventions>(NORMAL);
  const [found, setFound] = useState<ReadonlySet<string>>(new Set());
  const s = simulate(t);

  function set<K extends keyof Interventions>(key: K, value: boolean) {
    const next = { ...t, [key]: value };
    const ns = simulate(next);
    setT(next);
    const hits = CHALLENGES.filter((c) => c.test(next, ns)).map((c) => c.id);
    if (hits.some((id) => !found.has(id))) setFound(new Set([...found, ...hits]));
  }

  const isNormal = !t.cyanide && t.oxygen && !t.dnp && !t.oligomycin;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[3fr_2fr]">
        {/* Map + meters */}
        <div className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-4 lg:border-b-0 lg:border-r">
          <div className="w-full" style={{ aspectRatio: "420 / 260" }}>
            <PathwayMap t={t} s={s} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
            <Meter label="ATP per glucose" value={s.atp} max={36} display={`${s.atp}`} color="#10b981" />
            <Meter label="O₂ use" value={s.o2Use} max={1.5} display={`${Math.round(s.o2Use * 100)}%`} color="#0ea5e9" />
            <Meter label="H⁺ gradient" value={s.gradient} max={1} display={s.gradient >= 1 ? "maxed" : s.gradient > 0.4 ? "normal" : "low"} color="#f43f5e" />
            <Meter label="CO₂ released" value={s.krebs} max={1} display={`${Math.round(s.krebs * 100)}%`} color="#94a3b8" />
            <Meter label="Heat" value={s.heat} max={1} display={s.heat > 0.5 ? "high" : "normal"} color="#dc2626" />
            <Meter label="Lactate" value={s.fermentation} max={1} display={s.fermentation > 0.5 ? "building up" : "none"} color="#f97316" />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-2.5 p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Change the conditions</h3>
            <button onClick={() => setT(NORMAL)} disabled={isNormal}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40">
              Reset
            </button>
          </div>
          <Toggle label="Oxygen available" detail="The final electron acceptor" on={t.oxygen} onChange={(v) => set("oxygen", v)} />
          <Toggle label="Add cyanide" detail="Poison that binds complex IV" on={t.cyanide} onChange={(v) => set("cyanide", v)} />
          <Toggle label="Add DNP" detail="Uncoupler — makes the membrane leak H⁺" on={t.dnp} onChange={(v) => set("dnp", v)} />
          <Toggle label="Add oligomycin" detail="Antibiotic that blocks ATP synthase" on={t.oligomycin} onChange={(v) => set("oligomycin", v)} />

          <div className="rounded-xl bg-zinc-50 p-3.5" aria-live="polite">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">What&apos;s happening</div>
            <ul className="space-y-1.5">
              {explain(t, s).map((line) => (
                <li key={line} className="flex gap-2 text-xs leading-relaxed text-zinc-700">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Challenges */}
      <div className="border-t border-zinc-100 bg-zinc-50/60 p-5">
        <h3 className="mb-3 text-sm font-bold text-zinc-900">
          Challenges <span className="font-semibold text-zinc-400">· {found.size} / {CHALLENGES.length}</span>
        </h3>
        <ul className="space-y-2">
          {CHALLENGES.map((c) => {
            const done = found.has(c.id);
            return (
              <li key={c.id} className={`rounded-xl border px-4 py-3 text-sm ${done ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white"}`}>
                <div className="flex items-start gap-2.5">
                  <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    done ? "bg-emerald-500 text-white" : "border border-zinc-300"
                  }`}>{done ? "✓" : ""}</span>
                  <div>
                    <p className={done ? "font-semibold text-emerald-900" : "text-zinc-700"}>
                      <span className="sr-only">{done ? "Completed: " : "Not yet done: "}</span>{c.prompt}
                    </p>
                    {done && <p className="mt-1 text-xs leading-relaxed text-emerald-800">{c.reveal}</p>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
