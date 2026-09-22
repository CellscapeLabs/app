"use client";
/*
 * Biology concept: Limiting factors in photosynthesis — the leaf disk flotation assay
 * Leaf disks infiltrated with bicarbonate solution sink. As photosynthesis makes O₂, gas
 * collects in the leaf tissue and the disks float; faster photosynthesis → faster floating.
 * The rate model follows real plant physiology:
 *   - The slowest input limits the rate (Blackman): rate = min(light term, CO₂ term) × temperature
 *   - Chlorophyll absorbs red and blue light well and green light poorly
 *   - Calvin-cycle enzymes have a temperature optimum (~30 °C) and denature above ~40 °C
 *   - Cellular respiration keeps consuming O₂, so with the lamp off disks never float
 * Interactions: sliders for light intensity, CO₂ and temperature; a light-colour picker and lamp
 * switch; Run trial animates 20 simulated minutes (bubbles rise, disks float) and plots floating
 * disks over time. Up to four trials stay on the graph and in the trial log for comparison.
 * Challenges tick off automatically when a matching trial is run, then reveal an explanation.
 */

import { useEffect, useRef, useState } from "react";
import { VIZ_FRAME } from "@/components/visualizations/vizChrome";

// ─── Model ────────────────────────────────────────────────────────────────────
export type LightColor = "white" | "red" | "blue" | "green";

export interface LabSettings {
  light:  number;   // 0–100 %
  co2:    number;   // 0–100 %
  temp:   number;   // °C, 5–50
  color:  LightColor;
  lampOn: boolean;
}

const ABSORPTION: Record<LightColor, number> = { white: 0.85, red: 0.9, blue: 0.95, green: 0.2 };
const COLOR_HEX:  Record<LightColor, string> = { white: "#fde68a", red: "#f87171", blue: "#60a5fa", green: "#4ade80" };

const RESPIRATION = 0.06;          // O₂ used by the leaf regardless of light
const O2_PER_MINUTE = 0.3;         // scales net rate → accumulated O₂ per simulated minute
const SIM_MINUTES = 20;
const MS_PER_SIM_MINUTE = 600;
const DISKS = 10;

function r3(n: number) { return Math.round(n * 1000) / 1000; }

function lightTerm(s: LabSettings) {
  const effective = s.lampOn ? (s.light / 100) * ABSORPTION[s.color] : 0;
  return r3(1 - Math.exp(-3.2 * effective));
}
function co2Term(s: LabSettings) {
  const c = s.co2 / 100;
  return r3(Math.min(1, (1.3 * c) / (c + 0.3)));
}
function tempTerm(s: LabSettings) {
  const bell = Math.exp(-(((s.temp - 30) / 13) ** 2));
  const denature = s.temp > 40 ? Math.max(0, 1 - (s.temp - 40) / 8) : 1;
  return r3(bell * denature);
}

export function photosynthesisRate(s: LabSettings) {
  return r3(Math.min(lightTerm(s), co2Term(s)) * tempTerm(s));
}

export function limitingFactor(s: LabSettings): string {
  const L = lightTerm(s), Cc = co2Term(s), T = tempTerm(s);
  if (!s.lampOn) return "Light (lamp is off)";
  if (s.light === 0) return "Light (0% intensity)";
  if (T < 0.55) return s.temp > 30 ? "Temperature (too hot)" : "Temperature (too cold)";
  if (Math.min(L, Cc) > 0.9) return "None — close to maximum";
  if (s.color === "green" && L < Cc) return "Light (green is poorly absorbed)";
  return L < Cc ? "Light" : "CO₂";
}

/** Net O₂ accumulated after t simulated minutes. */
function oxygenAt(rate: number, minutes: number) {
  return Math.max(0, (rate - RESPIRATION) * O2_PER_MINUTE * minutes);
}

// Each disk needs a slightly different amount of O₂ to float (fixed, so SSR matches the client)
const THRESHOLDS = Array.from({ length: DISKS }, (_, i) => r3(0.9 + i * 0.2 + ((i * 7) % 3) * 0.05));

function floatingCount(rate: number, minutes: number) {
  const o2 = oxygenAt(rate, minutes);
  return THRESHOLDS.filter((th) => o2 >= th).length;
}

/** Simulated minutes until half the disks float, or null if it doesn't happen in the run. */
function et50(rate: number) {
  const perMin = (rate - RESPIRATION) * O2_PER_MINUTE;
  if (perMin <= 0) return null;
  const t = THRESHOLDS[DISKS / 2 - 1] / perMin;
  return t <= SIM_MINUTES ? Math.round(t * 10) / 10 : null;
}

// ─── Trials ───────────────────────────────────────────────────────────────────
interface Trial {
  id:       number;
  settings: LabSettings;
  rate:     number;
  color:    string;
}

const TRIAL_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"] as const;
const MAX_TRIALS = 4;

const DEFAULTS: LabSettings = { light: 70, co2: 60, temp: 25, color: "white", lampOn: true };

// ─── Challenges ───────────────────────────────────────────────────────────────
const CHALLENGES: { id: string; prompt: string; done: (t: Trial) => boolean; reveal: string }[] = [
  {
    id: "limiting",
    prompt: "Run a trial with bright light (80%+) but very little CO₂ (20% or less).",
    done: (t) => t.settings.lampOn && t.settings.light >= 80 && t.settings.co2 <= 20,
    reveal: "Extra light didn't help: CO₂ was the limiting factor. The Calvin cycle can only fix carbon as fast as CO₂ arrives, so the light reactions' ATP and NADPH pile up unused.",
  },
  {
    id: "green",
    prompt: "Run a trial under green light.",
    done: (t) => t.settings.lampOn && t.settings.color === "green" && t.settings.light > 0,
    reveal: "Chlorophyll a and b absorb red and blue light strongly but reflect most green — that's why leaves look green. Less absorbed light means fewer excited electrons and slower photosynthesis.",
  },
  {
    id: "hot",
    prompt: "Run a trial at 44 °C or hotter.",
    done: (t) => t.settings.temp >= 44,
    reveal: "Enzymes like RuBisCO have an optimum temperature. Above it, they start to denature — their shape changes and the active site stops working, so the rate crashes.",
  },
  {
    id: "dark",
    prompt: "Run a trial with the lamp switched off.",
    done: (t) => !t.settings.lampOn,
    reveal: "No light means no ATP or NADPH from the light reactions, so the Calvin cycle stalls too. The leaf still respires, using up O₂ — so the disks stay sunk.",
  },
];

// ─── Beaker scene ─────────────────────────────────────────────────────────────
const DISK_X = [58, 84, 110, 136, 162, 71, 97, 123, 149, 175];

function Beaker({ settings, rate, minutes, running }: { settings: LabSettings; rate: number; minutes: number; running: boolean }) {
  const o2 = oxygenAt(rate, minutes);
  const lightStrength = settings.lampOn ? settings.light / 100 : 0;
  const beam = COLOR_HEX[settings.color];
  const netPositive = rate > RESPIRATION;

  return (
    <svg viewBox="0 0 240 190" className="h-full w-full" role="img"
      aria-label={`Beaker with ${DISKS} leaf disks, ${floatingCount(rate, minutes)} floating`}>
      {/* Lamp + light beam */}
      <g>
        <rect x={4} y={34} width={18} height={34} rx={4} fill="#475569" />
        <path d="M 22 38 L 34 30 L 34 72 L 22 64 Z" fill="#64748b" />
        <circle cx={31} cy={51} r={6} fill={settings.lampOn ? beam : "#cbd5e1"} />
        {lightStrength > 0 && (
          <path d="M 34 30 L 192 24 L 192 172 L 34 72 Z" fill={beam} opacity={0.12 + lightStrength * 0.3} />
        )}
        <text x={13} y={84} textAnchor="middle" fontSize={8} fontWeight={700} fill="#64748b" fontFamily="system-ui">
          {settings.lampOn ? `${settings.light}%` : "off"}
        </text>
      </g>

      {/* Beaker */}
      <rect x={42} y={46} width={150} height={128} fill="#e0f2fe" opacity={0.7} />
      <path d="M 40 30 V 170 Q 40 176 46 176 H 188 Q 194 176 194 170 V 30"
        fill="none" stroke="#94a3b8" strokeWidth={2.5} />
      <line x1={42} y1={46} x2={192} y2={46} stroke="#7dd3fc" strokeWidth={1.5} />
      <text x={200} y={50} fontSize={7} fill="#64748b" fontFamily="system-ui">surface</text>

      {/* Leaf disks */}
      {DISK_X.map((x, i) => {
        const lift = Math.max(0, Math.min(1, (o2 - THRESHOLDS[i]) / 0.25));
        const sunkY = 162 - (i >= 5 ? 12 : 0);
        const floatY = i >= 5 ? 61 : 53;
        const y = sunkY + (floatY - sunkY) * lift;
        // O₂ bubbles rise from disks that are still photosynthesizing below the surface
        const bubbles = running && netPositive && lift < 1
          ? [0, 1, 2].map((k) => {
              const phase = (minutes * (0.6 + rate) + i * 0.37 + k / 3) % 1;
              return { cy: y - 6 - phase * (y - 56), op: 1 - phase, key: k };
            })
          : [];
        return (
          <g key={i}>
            {bubbles.map((b) => (
              <circle key={b.key} cx={x + (b.key - 1) * 3} cy={r3(b.cy)} r={1.8}
                fill="white" stroke="#38bdf8" strokeWidth={0.8} opacity={r3(b.op)} />
            ))}
            <ellipse cx={x} cy={r3(y)} rx={10} ry={3.5}
              fill={lift >= 1 ? "#22c55e" : "#15803d"} stroke="#14532d" strokeWidth={0.8} />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Graph ────────────────────────────────────────────────────────────────────
const GX0 = 34, GX1 = 290, GY0 = 150, GY1 = 14;
const gx = (min: number) => GX0 + (min / SIM_MINUTES) * (GX1 - GX0);
const gy = (n: number) => GY0 - (n / DISKS) * (GY0 - GY1);

function stepPath(rate: number, untilMinutes: number) {
  let d = `M ${gx(0)} ${gy(0)}`;
  let prev = 0;
  for (let m = 0; m <= untilMinutes + 1e-9; m += 0.25) {
    const n = floatingCount(rate, m);
    if (n !== prev) { d += ` H ${r3(gx(m))} V ${r3(gy(n))}`; prev = n; }
  }
  return `${d} H ${r3(gx(Math.min(untilMinutes, SIM_MINUTES)))}`;
}

function FloatGraph({ trials, runningId, minutes }: { trials: Trial[]; runningId: number | null; minutes: number }) {
  return (
    <svg viewBox="0 0 300 180" className="h-full w-full" role="img"
      aria-label="Graph of floating leaf disks over time for each trial">
      {/* Grid + axes */}
      {[0, 5, 10, 15, 20].map((m) => (
        <g key={m}>
          <line x1={gx(m)} y1={GY1} x2={gx(m)} y2={GY0} stroke="#f1f5f9" />
          <text x={gx(m)} y={GY0 + 12} textAnchor="middle" fontSize={8} fill="#94a3b8" fontFamily="system-ui">{m}</text>
        </g>
      ))}
      {[0, 5, 10].map((n) => (
        <g key={n}>
          <line x1={GX0} y1={gy(n)} x2={GX1} y2={gy(n)} stroke={n === 5 ? "#e2e8f0" : "#f1f5f9"} strokeDasharray={n === 5 ? "3 3" : undefined} />
          <text x={GX0 - 6} y={gy(n) + 3} textAnchor="end" fontSize={8} fill="#94a3b8" fontFamily="system-ui">{n}</text>
        </g>
      ))}
      <line x1={GX0} y1={GY0} x2={GX1} y2={GY0} stroke="#94a3b8" />
      <line x1={GX0} y1={GY1} x2={GX0} y2={GY0} stroke="#94a3b8" />
      <text x={(GX0 + GX1) / 2} y={176} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="#64748b" fontFamily="system-ui">Time (minutes)</text>
      <text x={10} y={(GY0 + GY1) / 2} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="#64748b" fontFamily="system-ui"
        transform={`rotate(-90 10 ${(GY0 + GY1) / 2})`}>Disks floating</text>

      {trials.map((t) => (
        <path key={t.id} d={stepPath(t.rate, t.id === runningId ? minutes : SIM_MINUTES)}
          fill="none" stroke={t.color} strokeWidth={2.5} strokeLinejoin="round"
          opacity={runningId === null || t.id === runningId ? 1 : 0.45} />
      ))}
      {trials.length === 0 && (
        <text x={(GX0 + GX1) / 2} y={(GY0 + GY1) / 2} textAnchor="middle" fontSize={9} fill="#a1a1aa" fontFamily="system-ui">
          Run a trial to plot results
        </text>
      )}
    </svg>
  );
}

// ─── Controls ─────────────────────────────────────────────────────────────────
function Slider({ id, label, value, min, max, unit, disabled, onChange }: {
  id: string; label: string; value: number; min: number; max: number; unit: string; disabled: boolean; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-zinc-700">{label}</label>
        <span className="text-sm font-bold tabular-nums text-zinc-900">{value}{unit}</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-600 disabled:opacity-40" />
    </div>
  );
}

// ─── LeafDiskLab ──────────────────────────────────────────────────────────────
export function LeafDiskLab() {
  const [settings, setSettings] = useState<LabSettings>(DEFAULTS);
  const [trials, setTrials]     = useState<Trial[]>([]);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [minutes, setMinutes]   = useState(0);
  const [showingResult, setShowingResult] = useState(false);  // last run stays visible until settings change
  const nextId = useRef(1);

  const running = runningId !== null;
  const liveRate = photosynthesisRate(settings);
  const shownTrial = trials.find((t) => t.id === runningId) ?? trials[trials.length - 1];
  const showTrial = (running || showingResult) && shownTrial;
  const sceneSettings = showTrial ? shownTrial.settings : settings;
  const sceneRate = showTrial ? shownTrial.rate : liveRate;
  const sceneMinutes = running ? minutes : showTrial ? SIM_MINUTES : 0;

  // Animate the running trial
  useEffect(() => {
    if (runningId === null) return;
    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      const m = Math.min(SIM_MINUTES, (now - start) / MS_PER_SIM_MINUTE);
      setMinutes(m);
      if (m < SIM_MINUTES) frame = requestAnimationFrame(tick);
      else { setRunningId(null); setShowingResult(true); }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [runningId]);

  function update<K extends keyof LabSettings>(key: K, value: LabSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setShowingResult(false);
  }

  function runTrial() {
    const id = nextId.current++;
    const trial: Trial = { id, settings, rate: liveRate, color: TRIAL_COLORS[(id - 1) % TRIAL_COLORS.length] };
    setTrials((ts) => [...ts, trial].slice(-MAX_TRIALS));
    setMinutes(0);
    setRunningId(id);
  }

  function clearTrials() {
    setTrials([]);
    setRunningId(null);
    setMinutes(0);
    setShowingResult(false);
  }

  const floating = floatingCount(sceneRate, sceneMinutes);
  const completed = new Set(CHALLENGES.filter((c) => trials.some((t) => t.id !== runningId && c.done(t))).map((c) => c.id));

  return (
    <div className={VIZ_FRAME}>
      <div className="grid gap-0 lg:grid-cols-[3fr_2fr]">

        {/* Scene */}
        <div className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-4 lg:border-b-0 lg:border-r">
          <div className="relative w-full" style={{ aspectRatio: "240 / 190" }}>
            <Beaker settings={sceneSettings} rate={sceneRate} minutes={sceneMinutes} running={running} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-semibold text-zinc-600">
              {running
                ? `Minute ${Math.floor(minutes)} of ${SIM_MINUTES}`
                : showTrial ? `Trial ${shownTrial.id} finished · ${SIM_MINUTES} min` : "Ready"}
            </span>
            <span className="font-bold tabular-nums text-emerald-700" aria-live="polite">
              {floating} / {DISKS} disks floating
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 p-5">
          <Slider id="lab-light" label="Light intensity" value={settings.light} min={0} max={100} unit="%"
            disabled={running} onChange={(v) => update("light", v)} />
          <Slider id="lab-co2" label="CO₂ (bicarbonate)" value={settings.co2} min={0} max={100} unit="%"
            disabled={running} onChange={(v) => update("co2", v)} />
          <Slider id="lab-temp" label="Temperature" value={settings.temp} min={5} max={50} unit=" °C"
            disabled={running} onChange={(v) => update("temp", v)} />

          <div>
            <div className="mb-1.5 text-sm font-semibold text-zinc-700" id="lab-color-label">Light color</div>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="lab-color-label">
              {(["white", "red", "blue", "green"] as const).map((c) => (
                <button key={c} onClick={() => update("color", c)} disabled={running} aria-pressed={settings.color === c}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition disabled:opacity-40 ${
                    settings.color === c ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}>
                  <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: COLOR_HEX[c] }} />
                  {c}
                </button>
              ))}
              <button onClick={() => update("lampOn", !settings.lampOn)} disabled={running} aria-pressed={!settings.lampOn}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                  settings.lampOn ? "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50" : "border-zinc-900 bg-zinc-900 text-white"
                }`}>
                {settings.lampOn ? "Lamp on" : "Lamp off"}
              </button>
            </div>
          </div>

          {/* Live readouts */}
          <div className="rounded-xl bg-zinc-50 p-3">
            <div className="mb-1 flex items-baseline justify-between text-xs font-bold uppercase tracking-wider text-zinc-600">
              <span>Photosynthesis rate</span>
              <span className="tabular-nums text-zinc-700">{Math.round(liveRate * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round(liveRate * 100)}%` }} />
            </div>
            <div className="mt-2 text-xs text-zinc-700">
              Limiting factor: <span className="font-bold text-zinc-800">{limitingFactor(settings)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={runTrial} disabled={running}
              className="flex-1 rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">
              {running ? "Running…" : "▶ Run trial"}
            </button>
            <button onClick={clearTrials} disabled={trials.length === 0}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4 border-t border-zinc-100 p-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-bold text-zinc-900">Floating disks over time</h3>
          <div className="w-full" style={{ aspectRatio: "300 / 180" }}>
            <FloatGraph trials={trials} runningId={runningId} minutes={minutes} />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold text-zinc-900">Trial log</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-zinc-50 text-left font-semibold uppercase tracking-wider text-zinc-600">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Light</th>
                  <th className="px-3 py-2">CO₂</th>
                  <th className="px-3 py-2">Temp</th>
                  <th className="px-3 py-2">Time to 5 floating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trials.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-zinc-600">No trials yet</td></tr>
                )}
                {trials.map((t) => {
                  const done = t.id !== runningId;
                  const e = et50(t.rate);
                  return (
                    <tr key={t.id}>
                      <td className="px-3 py-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: t.color }} />
                        <span className="ml-1.5 font-semibold text-zinc-700">{t.id}</span>
                      </td>
                      <td className="px-3 py-2 capitalize text-zinc-600">
                        {t.settings.lampOn ? `${t.settings.light}% ${t.settings.color}` : "off"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{t.settings.co2}%</td>
                      <td className="px-3 py-2 text-zinc-600">{t.settings.temp} °C</td>
                      <td className="px-3 py-2 font-bold text-zinc-800">
                        {!done ? "…" : e === null ? `> ${SIM_MINUTES} min` : `${e} min`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">Shorter time = faster photosynthesis. The graph keeps your last {MAX_TRIALS} trials.</p>
        </div>
      </div>

      {/* Challenges */}
      <div className="border-t border-zinc-100 bg-zinc-50/60 p-5">
        <h3 className="mb-3 text-sm font-bold text-zinc-900">
          Challenges <span className="font-semibold text-zinc-600">· {completed.size} / {CHALLENGES.length}</span>
        </h3>
        <ul className="space-y-2">
          {CHALLENGES.map((c) => {
            const done = completed.has(c.id);
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
