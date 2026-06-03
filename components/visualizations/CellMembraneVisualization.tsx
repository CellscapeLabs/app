"use client";
// Biology concept: Cell membrane — phospholipid bilayer structure and membrane transport
// Interactions: Tab through four views — Bilayer Structure, Simple Diffusion, Facilitated
// Diffusion, and Active Transport (Na⁺/K⁺ pump). Each view animates molecules moving across
// the membrane to illustrate concentration gradients and energy requirements.

import { useState, createContext, useContext } from "react";
import { motion, AnimatePresence, useAnimationFrame } from "framer-motion";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  headHydro: "#06b6d4",     // cyan — hydrophilic phosphate heads
  tailHydro: "#f9a8d4",     // pink — hydrophobic fatty-acid tails
  protein:   "#8b5cf6",     // violet — membrane proteins
  channel:   "#a78bfa",     // light violet — channel proteins
  pump:      "#f59e0b",     // amber — Na/K pump
  sodium:    "#3b82f6",     // blue — Na⁺ ions
  potassium: "#10b981",     // emerald — K⁺ ions
  glucose:   "#f97316",     // orange — glucose molecules
  oxygen:    "#64748b",     // slate — O₂
};

// ─── Layout constants ─────────────────────────────────────────────────────────
// All four views share the same viewBox and bilayer geometry.

const W    = 560;
const H    = 320;
const midY = H / 2;            // 160  — bilayer centre
const outerTopY = midY - 34;   // 126  — upper head row y
const outerBotY = midY + 34;   // 194  — lower head row y

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "bilayer" | "simple" | "facilitated" | "active";

interface Tab {
  id: TabId;
  label: string;
  subtitle: string;
  accent: string;
  accentBg: string;
  description: string;
  keyPoints: string[];
}

// ─── Shared active-tab context ────────────────────────────────────────────────
// Both CellMembraneViewer and CellMembranePanel consume this so clicking a tab
// in either component keeps the other in sync.

interface CellMembraneCtxValue {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
}

const CellMembraneCtx = createContext<CellMembraneCtxValue | null>(null);

function useCellMembrane(): CellMembraneCtxValue {
  const ctx = useContext(CellMembraneCtx);
  if (!ctx) throw new Error("Must be inside CellMembraneProvider");
  return ctx;
}

// ─── Region labels (shared across views) ─────────────────────────────────────
// Small EXTRACELLULAR / INTRACELLULAR badges for transport views.

function RegionLabels({ fontSize = 11 }: { fontSize?: number }) {
  return (
    <>
      <text x={10} y={20} fontSize={fontSize} fontWeight={700} fill="#94a3b8"
        fontFamily="system-ui, sans-serif" letterSpacing={1}>EXTRACELLULAR</text>
      <text x={10} y={H - 8} fontSize={fontSize} fontWeight={700} fill="#94a3b8"
        fontFamily="system-ui, sans-serif" letterSpacing={1}>INTRACELLULAR</text>
    </>
  );
}

// ─── Phospholipid bilayer base ────────────────────────────────────────────────
// Draws the two leaflets of phospholipids only — no proteins.
// Pass skipXPositions to leave gaps where transmembrane proteins will be drawn on top.

function BilayerBase({ skipXPositions = [] }: { skipXPositions?: number[] }) {
  const innerTopY = midY - 4;
  const innerBotY = midY + 4;

  const phospholipids: { x: number }[] = [];
  const step = 28;
  for (let x = 14; x < W - 14; x += step) {
    if (!skipXPositions.includes(x)) phospholipids.push({ x });
  }

  return (
    <>
      {/* Hydrophobic core shading */}
      <rect x={0} y={innerTopY} width={W} height={innerBotY - innerTopY}
        fill={C.tailHydro} fillOpacity={0.06} />

      {phospholipids.map(({ x }, i) => (
        <g key={i}>
          {/* Upper leaflet */}
          <circle cx={x} cy={outerTopY} r={7} fill={C.headHydro} fillOpacity={0.85} />
          <line x1={x - 3} y1={outerTopY + 7} x2={x - 3} y2={innerTopY}
            stroke={C.tailHydro} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={x + 3} y1={outerTopY + 7} x2={x + 3} y2={innerTopY}
            stroke={C.tailHydro} strokeWidth={2.5} strokeLinecap="round" />

          {/* Lower leaflet */}
          <circle cx={x} cy={outerBotY} r={7} fill={C.headHydro} fillOpacity={0.85} />
          <line x1={x - 3} y1={outerBotY - 7} x2={x - 3} y2={innerBotY}
            stroke={C.tailHydro} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={x + 3} y1={outerBotY - 7} x2={x + 3} y2={innerBotY}
            stroke={C.tailHydro} strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
    </>
  );
}

// ─── Tab 1: Bilayer Structure ─────────────────────────────────────────────────
// Phospholipid step = 28, heads at x = 14, 42, 70 … 546.
// Proteins sit at midpoints between adjacent head pairs:
//   Left  x=252 — midpoint between heads at 238 and 266.
//   Right x=364 — midpoint between heads at 350 and 378.
// Drawn BEFORE the bilayer so the adjacent head circles render on top (≈3 px overlap),
// giving the tight "embedded in the bilayer" appearance without removing any lipids.

const BILAYER_PROTEINS = [{ x: 252 }, { x: 364 }];

function BilayerView() {
  const annotationX = 364;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Phospholipid bilayer diagram">
      {/* Extracellular region shading */}
      <rect x={0} y={0} width={W} height={outerTopY - 7}
        fill={C.headHydro} fillOpacity={0.04} />
      {/* Intracellular region shading */}
      <rect x={0} y={outerBotY + 7} width={W} height={H - outerBotY - 7}
        fill="#8b5cf6" fillOpacity={0.03} />

      {/* Proteins behind the bilayer — heads render on top, pressing against the protein sides */}
      {BILAYER_PROTEINS.map(({ x }, i) => (
        <g key={i} opacity={0.85}>
          {/* Full bar: y=102 to y=218 — 24 px above upper heads, 24 px below lower heads */}
          <rect x={x - 10} y={midY - 58} width={20} height={116} rx={6}
            fill={C.protein} fillOpacity={0.18} stroke={C.protein} strokeWidth={2} />
          {/* Transmembrane zone overlay — slightly denser across the bilayer core */}
          <rect x={x - 10} y={outerTopY} width={20} height={outerBotY - outerTopY}
            fill={C.protein} fillOpacity={0.12} />
        </g>
      ))}

      {/* Bilayer drawn after proteins — heads overlap protein edges by ~3 px */}
      <BilayerBase />

      {/* ── EXTRACELLULAR / INTRACELLULAR — large region labels ── */}
      <rect x={0} y={0} width={160} height={28}
        fill={C.headHydro} fillOpacity={0.12} />
      <text x={8} y={20} fontSize={14} fontWeight={800} fill="#0e7490"
        fontFamily="system-ui, sans-serif" letterSpacing={0.5}>EXTRACELLULAR</text>

      <rect x={0} y={H - 28} width={160} height={28}
        fill="#8b5cf6" fillOpacity={0.10} />
      <text x={8} y={H - 9} fontSize={14} fontWeight={800} fill="#6d28d9"
        fontFamily="system-ui, sans-serif" letterSpacing={0.5}>INTRACELLULAR</text>

      {/* ── Hydrophilic head annotation ── */}
      {/* Points at the head at x=70 — well left of both proteins (nearest is at x=252) */}
      <line x1={70} y1={outerTopY - 7} x2={52} y2={outerTopY - 32}
        stroke={C.headHydro} strokeWidth={1.2} opacity={0.8} />
      <text x={4} y={outerTopY - 40} fontSize={13} fontWeight={700} fill={C.headHydro}
        fontFamily="system-ui, sans-serif">Hydrophilic head</text>
      <text x={4} y={outerTopY - 25} fontSize={11} fill={C.headHydro} opacity={0.8}
        fontFamily="system-ui, sans-serif">(phosphate — loves water)</text>

      {/* ── Hydrophobic tails annotation ── */}
      {/* Label sits BELOW the bilayer (intracellular space). Arrow points UP into the tail zone.
          x=35 is between phospholipid columns at x=14 and x=42, so no head circle blocks the path. */}
      <line x1={40} y1={225} x2={35} y2={193}
        stroke="#db2777" strokeWidth={1.2} opacity={0.8} />
      <polygon points="35,181 29,193 41,193" fill="#db2777" fillOpacity={0.75} />
      <text x={4} y={236} fontSize={13} fontWeight={700} fill="#db2777"
        fontFamily="system-ui, sans-serif">Hydrophobic tails</text>
      <text x={4} y={251} fontSize={11} fill="#db2777" opacity={0.8}
        fontFamily="system-ui, sans-serif">(fatty acids — repel water)</text>

      {/* ── Membrane protein annotation ── */}
      {/* Leader from top-right corner of the right protein bar up to label */}
      <line x1={annotationX + 11} y1={midY - 58} x2={annotationX + 28} y2={midY - 76}
        stroke={C.protein} strokeWidth={1.2} opacity={0.8} />
      <text x={annotationX + 30} y={midY - 82} fontSize={13} fontWeight={700} fill={C.protein}
        fontFamily="system-ui, sans-serif">Membrane protein</text>
      <text x={annotationX + 30} y={midY - 67} fontSize={11} fill={C.protein} opacity={0.8}
        fontFamily="system-ui, sans-serif">(fluid mosaic model)</text>

      {/* ── 7 nm thickness bracket (far right) ── */}
      <line x1={W - 22} y1={outerTopY} x2={W - 22} y2={outerBotY}
        stroke="#94a3b8" strokeWidth={1.5} />
      <line x1={W - 26} y1={outerTopY} x2={W - 18} y2={outerTopY}
        stroke="#94a3b8" strokeWidth={1.5} />
      <line x1={W - 26} y1={outerBotY} x2={W - 18} y2={outerBotY}
        stroke="#94a3b8" strokeWidth={1.5} />
      <text x={W - 16} y={midY + 5} fontSize={11} fill="#94a3b8"
        fontFamily="system-ui, sans-serif">~7nm</text>
    </svg>
  );
}

// ─── Animated molecule particle ───────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  startY: number;
  endY: number;
  delay: number;
  duration: number;
  color: string;
  label: string;
  radius: number;
}

function MoleculeParticle({ p, progress }: { p: Particle; progress: number }) {
  const y = p.startY + (p.endY - p.startY) * progress;
  const opacity = progress < 0.05 ? progress / 0.05 : progress > 0.92 ? (1 - progress) / 0.08 : 1;
  return (
    <g opacity={opacity}>
      <circle cx={p.x} cy={y} r={p.radius} fill={p.color} fillOpacity={0.9} />
      <text x={p.x} y={y + 4} textAnchor="middle" fontSize={9} fontWeight={700}
        fill="white" fontFamily="system-ui, sans-serif">{p.label}</text>
    </g>
  );
}

// ─── Tab 2: Simple Diffusion ──────────────────────────────────────────────────
// Small non-polar molecules (O₂, CO₂) pass directly through lipid tails.
// High → low concentration gradient; no protein or energy needed.

function SimpleDiffusionView() {
  const particles: Particle[] = [
    { id: 1, x: 100, startY: 42,  endY: 278, delay: 0,    duration: 2.4, color: C.oxygen, label: "O₂",  radius: 11 },
    { id: 2, x: 200, startY: 48,  endY: 272, delay: 0.6,  duration: 2.2, color: C.oxygen, label: "O₂",  radius: 11 },
    { id: 3, x: 320, startY: 44,  endY: 276, delay: 1.1,  duration: 2.5, color: C.oxygen, label: "O₂",  radius: 11 },
    { id: 4, x: 440, startY: 40,  endY: 280, delay: 0.3,  duration: 2.3, color: C.oxygen, label: "O₂",  radius: 11 },
    { id: 5, x: 152, startY: 36,  endY: 284, delay: 1.5,  duration: 2.6, color: C.oxygen, label: "CO₂", radius: 12 },
    { id: 6, x: 380, startY: 46,  endY: 274, delay: 0.9,  duration: 2.1, color: C.oxygen, label: "CO₂", radius: 12 },
  ];

  const [progresses, setProgresses] = useState<number[]>(particles.map(() => 0));
  useAnimationFrame((t) => {
    const s = t / 1000;
    setProgresses(particles.map((p) => {
      const cycle = (s - p.delay + 100 * p.duration) % p.duration / p.duration;
      return Math.max(0, Math.min(1, cycle));
    }));
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Simple diffusion diagram">
      <defs>
        <linearGradient id="gradSimple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.oxygen} stopOpacity={0.14} />
          <stop offset="44%"  stopColor={C.oxygen} stopOpacity={0.02} />
          <stop offset="56%"  stopColor={C.oxygen} stopOpacity={0.01} />
          <stop offset="100%" stopColor={C.oxygen} stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#gradSimple)" />

      <BilayerBase />
      <RegionLabels fontSize={11} />

      {/* "No energy" badge — top right, clear of region label */}
      <rect x={W - 122} y={8} width={114} height={28} rx={14}
        fill="#f0fdf4" stroke="#86efac" strokeWidth={1.5} />
      <text x={W - 65} y={27} textAnchor="middle" fontSize={12} fontWeight={700} fill="#16a34a"
        fontFamily="system-ui, sans-serif">No ATP needed</text>

      {/* Concentration labels — right side, clear of badge above */}
      <text x={W - 12} y={65} textAnchor="end" fontSize={13} fontWeight={700}
        fill={C.oxygen} fontFamily="system-ui, sans-serif">HIGH concentration</text>
      <text x={W - 12} y={H - 28} textAnchor="end" fontSize={12} fontWeight={600}
        fill={C.oxygen} opacity={0.55} fontFamily="system-ui, sans-serif">LOW concentration</text>

      {/* Particles */}
      {particles.map((p, i) => (
        <MoleculeParticle key={p.id} p={p} progress={progresses[i]} />
      ))}

      {/* Direction arrow — center bottom zone, above INTRACELLULAR label */}
      <text x={W / 2} y={midY + 80} textAnchor="middle" fontSize={12} fontWeight={600}
        fill={C.oxygen} opacity={0.7} fontFamily="system-ui, sans-serif">
        ↓ diffusion (high → low)
      </text>
    </svg>
  );
}

// ─── Tab 3: Facilitated Diffusion ─────────────────────────────────────────────
// Polar molecules (glucose) pass via channel/carrier proteins. Still passive — no ATP.

function FacilitatedDiffusionView() {
  // Channel proteins — taller so pore mouths poke out beyond head rows
  const channels = [{ x: 140 }, { x: 280 }, { x: 420 }];

  const particles: Particle[] = [
    { id: 1, x: 140, startY: 38,  endY: 282, delay: 0,   duration: 2.8, color: C.glucose, label: "G", radius: 12 },
    { id: 2, x: 280, startY: 42,  endY: 278, delay: 0.8, duration: 2.6, color: C.glucose, label: "G", radius: 12 },
    { id: 3, x: 420, startY: 36,  endY: 284, delay: 1.4, duration: 3.0, color: C.glucose, label: "G", radius: 12 },
  ];

  const [progresses, setProgresses] = useState<number[]>(particles.map(() => 0));
  useAnimationFrame((t) => {
    const s = t / 1000;
    setProgresses(particles.map((p) => {
      const cycle = (s - p.delay + 100 * p.duration) % p.duration / p.duration;
      return Math.max(0, Math.min(1, cycle));
    }));
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Facilitated diffusion diagram">
      <defs>
        <linearGradient id="gradFacil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.glucose} stopOpacity={0.1} />
          <stop offset="46%"  stopColor={C.glucose} stopOpacity={0.01} />
          <stop offset="100%" stopColor={C.glucose} stopOpacity={0.03} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#gradFacil)" />

      <BilayerBase />
      <RegionLabels fontSize={11} />

      {/* Channel proteins — ry=42 so pore openings extend past head rows */}
      {channels.map(({ x }, i) => (
        <g key={i}>
          <ellipse cx={x} cy={midY} rx={13} ry={42}
            fill={C.channel} fillOpacity={0.22} stroke={C.channel} strokeWidth={2} />
          {/* Extracellular mouth */}
          <ellipse cx={x} cy={midY - 40} rx={8} ry={6}
            fill={C.channel} fillOpacity={0.18} stroke={C.channel} strokeWidth={1.5} />
          {/* Intracellular mouth */}
          <ellipse cx={x} cy={midY + 40} rx={8} ry={6}
            fill={C.channel} fillOpacity={0.18} stroke={C.channel} strokeWidth={1.5} />
          {/* Hydrophilic pore */}
          <line x1={x} y1={midY - 38} x2={x} y2={midY + 38}
            stroke={C.channel} strokeWidth={5} strokeOpacity={0.12} />
        </g>
      ))}

      {/* Particles — above proteins so they're visible passing through */}
      {particles.map((p, i) => (
        <MoleculeParticle key={p.id} p={p} progress={progresses[i]} />
      ))}

      {/* Concentration labels — left side, under region label */}
      <text x={12} y={65} fontSize={13} fontWeight={700}
        fill={C.glucose} fontFamily="system-ui, sans-serif">HIGH [glucose]</text>
      <text x={12} y={H - 28} fontSize={12} fontWeight={600}
        fill={C.glucose} opacity={0.55} fontFamily="system-ui, sans-serif">LOW [glucose]</text>

      {/* Channel protein label — right side, pointing at centre channel */}
      {/* Leader from centre channel right edge (280+13=293) to label */}
      <line x1={293} y1={midY - 40} x2={330} y2={midY - 62}
        stroke={C.channel} strokeWidth={1.2} opacity={0.8} />
      <text x={333} y={midY - 68} fontSize={13} fontWeight={700} fill={C.channel}
        fontFamily="system-ui, sans-serif">Channel protein</text>
      <text x={333} y={midY - 53} fontSize={11} fill={C.channel} opacity={0.8}
        fontFamily="system-ui, sans-serif">(e.g. GLUT transporter)</text>

      {/* "No energy" badge — top right */}
      <rect x={W - 122} y={8} width={114} height={28} rx={14}
        fill="#f0fdf4" stroke="#86efac" strokeWidth={1.5} />
      <text x={W - 65} y={27} textAnchor="middle" fontSize={12} fontWeight={700} fill="#16a34a"
        fontFamily="system-ui, sans-serif">No ATP needed</text>

      {/* Glucose legend — bottom right, above INTRACELLULAR label */}
      <circle cx={W - 108} cy={H - 12} r={10} fill={C.glucose} fillOpacity={0.9} />
      <text x={W - 108} y={H - 8} textAnchor="middle" fontSize={8} fontWeight={700}
        fill="white" fontFamily="system-ui, sans-serif">G</text>
      <text x={W - 94} y={H - 8} fontSize={11} fill="#64748b"
        fontFamily="system-ui, sans-serif">= Glucose</text>
    </svg>
  );
}

// ─── Tab 4: Active Transport — Na⁺/K⁺ Pump ───────────────────────────────────
// Pump exports 3 Na⁺ (intracellular → extracellular) and imports 2 K⁺ (extracellular → intracellular)
// per ATP hydrolysed — both against their concentration gradients.

type PumpPhase = "bind-na" | "phosphorylate" | "release-na" | "bind-k" | "dephosphorylate" | "release-k";

// Each phase is 2.5 s. A 0.5 s pause at the start of each animated phase lets students
// read the label before movement begins. Static phases (phosphorylate, dephosphorylate)
// simply hold their state for the full 2.5 s.
const PUMP_PHASES: { id: PumpPhase; label: string; duration: number }[] = [
  { id: "bind-na",         label: "① Na⁺ ions bind from inside the cell",     duration: 2.5 },
  { id: "phosphorylate",   label: "② ATP splits — energy powers a shape change", duration: 2.5 },
  { id: "release-na",      label: "③ Na⁺ released to the outside of the cell",  duration: 2.5 },
  { id: "bind-k",          label: "④ K⁺ ions bind from outside the cell",       duration: 2.5 },
  { id: "dephosphorylate", label: "⑤ Phosphate released — pump resets",         duration: 2.5 },
  { id: "release-k",       label: "⑥ K⁺ released to the inside of the cell",    duration: 2.5 },
];

const TOTAL_CYCLE = PUMP_PHASES.reduce((s, p) => s + p.duration, 0);
const ANIM_PAUSE  = 0.5; // seconds held at start before ions move

function ActiveTransportView() {
  const pumpX   = W / 2;
  const PUMP_RY = 44; // pump top at midY-44=116, bottom at midY+44=204

  const [cycleT,   setCycleT]   = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);

  useAnimationFrame((t) => {
    const ct = (t / 1000) % TOTAL_CYCLE;
    let acc = 0, idx = 0;
    for (let i = 0; i < PUMP_PHASES.length; i++) {
      acc += PUMP_PHASES[i].duration;
      if (ct < acc) { idx = i; break; }
    }
    setCycleT(ct);
    setPhaseIdx(idx);
  });

  // Progress within a phase, with a leading pause so students can read the label first.
  function phaseP(idx: number) {
    const start = PUMP_PHASES.slice(0, idx).reduce((s, p) => s + p.duration, 0);
    const elapsed = cycleT - start;
    if (elapsed < ANIM_PAUSE) return 0;
    return Math.max(0, Math.min(1, (elapsed - ANIM_PAUSE) / (PUMP_PHASES[idx].duration - ANIM_PAUSE)));
  }

  // Pump opens toward extracellular (top) while Na⁺ exits and K⁺ enters (phases 2–4)
  const pumpOpenTop = phaseIdx >= 2 && phaseIdx <= 4;

  const naBindP    = phaseIdx === 0 ? phaseP(0) : 0; // Na⁺ entering from inside
  const naReleaseP = phaseIdx === 2 ? phaseP(2) : 0; // Na⁺ exiting to outside
  const kBindP     = phaseIdx === 3 ? phaseP(3) : 0; // K⁺ entering from outside
  const kReleaseP  = phaseIdx === 5 ? phaseP(5) : 0; // K⁺ exiting to inside

  // Staggered ion helper: returns per-ion progress [0,1] with a small stagger delay
  function ionP(base: number, i: number, stagger: number) {
    const d = i * stagger;
    return Math.max(0, Math.min(1, (base - d) / Math.max(0.01, 1 - d)));
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" aria-label="Na-K pump active transport diagram">
      <BilayerBase />
      <RegionLabels fontSize={11} />

      {/* Ion concentration labels — extracellular (top) and intracellular (bottom) */}
      <text x={pumpX + 50} y={62} fontSize={12} fontWeight={700}
        fill={C.sodium} fontFamily="system-ui, sans-serif">High [Na⁺]</text>
      <text x={pumpX + 50} y={78} fontSize={11} fontWeight={600}
        fill={C.potassium} opacity={0.7} fontFamily="system-ui, sans-serif">Low [K⁺]</text>
      <text x={pumpX + 50} y={midY + 58} fontSize={12} fontWeight={700}
        fill={C.potassium} fontFamily="system-ui, sans-serif">High [K⁺]</text>
      <text x={pumpX + 50} y={midY + 74} fontSize={11} fontWeight={600}
        fill={C.sodium} opacity={0.7} fontFamily="system-ui, sans-serif">Low [Na⁺]</text>

      {/* ATP badge */}
      <rect x={8} y={30} width={116} height={28} rx={14}
        fill="#fef2f2" stroke="#fca5a5" strokeWidth={1.5} />
      <text x={66} y={49} textAnchor="middle" fontSize={12} fontWeight={700} fill="#dc2626"
        fontFamily="system-ui, sans-serif">ATP required</text>

      {/* Pump body */}
      <ellipse cx={pumpX} cy={midY} rx={26} ry={PUMP_RY}
        fill={C.pump} fillOpacity={0.18} stroke={C.pump} strokeWidth={2.5} />

      {/* Conformational opening — top or bottom depending on phase */}
      {pumpOpenTop ? (
        <ellipse cx={pumpX} cy={midY - PUMP_RY + 3} rx={11} ry={7}
          fill={C.pump} fillOpacity={0.28} stroke={C.pump} strokeWidth={1.5} />
      ) : (
        <ellipse cx={pumpX} cy={midY + PUMP_RY - 3} rx={11} ry={7}
          fill={C.pump} fillOpacity={0.28} stroke={C.pump} strokeWidth={1.5} />
      )}

      {/* Pump annotation — label sits above the membrane (outerTopY=126), well clear of the bilayer */}
      <line x1={pumpX - 26} y1={midY} x2={pumpX - 62} y2={midY - 72}
        stroke={C.pump} strokeWidth={1.2} opacity={0.8} />
      <text x={pumpX - 64} y={midY - 78} fontSize={13} fontWeight={700} fill={C.pump}
        textAnchor="end" fontFamily="system-ui, sans-serif">Na⁺/K⁺ ATPase</text>
      <text x={pumpX - 64} y={midY - 63} fontSize={11} fill={C.pump} opacity={0.8}
        textAnchor="end" fontFamily="system-ui, sans-serif">3 Na⁺ out, 2 K⁺ in per ATP</text>
      <text x={pumpX} y={midY + 6} textAnchor="middle" fontSize={14} fontWeight={900}
        fill={C.pump} fontFamily="system-ui, sans-serif">P</text>

      {/* ── Phase 0: Na⁺ rising from intracellular into pump bottom ── */}
      {naBindP > 0 && [0, 1, 2].map((i) => {
        const p  = ionP(naBindP, i, 0.18);
        const iy = (midY + PUMP_RY + 62) - p * (PUMP_RY + 44); // 264 → 176
        const ix = pumpX + (i - 1) * 18;
        return (
          <g key={i} opacity={Math.min(p * 5 + 0.15, 1)}>
            <circle cx={ix} cy={iy} r={10} fill={C.sodium} fillOpacity={0.9} />
            <text x={ix} y={iy + 4} textAnchor="middle" fontSize={9} fontWeight={700}
              fill="white" fontFamily="system-ui, sans-serif">Na⁺</text>
          </g>
        );
      })}

      {/* ── Phase 1: Na⁺ held inside pump (static) ── */}
      {phaseIdx === 1 && [0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={pumpX + (i - 1) * 18} cy={midY + 20} r={10}
            fill={C.sodium} fillOpacity={0.9} />
          <text x={pumpX + (i - 1) * 18} y={midY + 24} textAnchor="middle" fontSize={9}
            fontWeight={700} fill="white" fontFamily="system-ui, sans-serif">Na⁺</text>
        </g>
      ))}

      {/* ── Phase 2: Na⁺ ejected to extracellular (upward from pump top) ── */}
      {naReleaseP > 0 && [0, 1, 2].map((i) => {
        const p  = ionP(naReleaseP, i, 0.18);
        const iy = (midY - PUMP_RY) - p * 84; // 116 → 32
        const ix = pumpX + (i - 1) * 22;
        return p > 0.01 ? (
          <g key={i} opacity={Math.min(p * 5, 1)}>
            <circle cx={ix} cy={iy} r={10} fill={C.sodium} fillOpacity={0.9} />
            <text x={ix} y={iy + 4} textAnchor="middle" fontSize={9} fontWeight={700}
              fill="white" fontFamily="system-ui, sans-serif">Na⁺</text>
          </g>
        ) : null;
      })}

      {/* ── Phase 3: K⁺ descending from extracellular into pump top ── */}
      {kBindP > 0 && [0, 1].map((i) => {
        const p  = ionP(kBindP, i, 0.22);
        const iy = (midY - PUMP_RY - 62) + p * (PUMP_RY + 44); // 54 → 142
        const ix = pumpX + (i === 0 ? -14 : 14);
        return (
          <g key={i} opacity={Math.min(p * 5 + 0.15, 1)}>
            <circle cx={ix} cy={iy} r={10} fill={C.potassium} fillOpacity={0.9} />
            <text x={ix} y={iy + 4} textAnchor="middle" fontSize={9} fontWeight={700}
              fill="white" fontFamily="system-ui, sans-serif">K⁺</text>
          </g>
        );
      })}

      {/* ── Phase 4: K⁺ held inside pump (static) ── */}
      {phaseIdx === 4 && [0, 1].map((i) => (
        <g key={i}>
          <circle cx={pumpX + (i === 0 ? -14 : 14)} cy={midY - 20} r={10}
            fill={C.potassium} fillOpacity={0.9} />
          <text x={pumpX + (i === 0 ? -14 : 14)} y={midY - 16} textAnchor="middle"
            fontSize={9} fontWeight={700} fill="white" fontFamily="system-ui, sans-serif">K⁺</text>
        </g>
      ))}

      {/* ── Phase 5: K⁺ released to intracellular (downward from pump bottom) ── */}
      {kReleaseP > 0 && [0, 1].map((i) => {
        const p  = ionP(kReleaseP, i, 0.25);
        const iy = (midY + PUMP_RY) + p * 84; // 204 → 288
        const ix = pumpX + (i === 0 ? -14 : 14);
        return p > 0.01 ? (
          <g key={i} opacity={Math.min(p * 5, 1)}>
            <circle cx={ix} cy={iy} r={10} fill={C.potassium} fillOpacity={0.9} />
            <text x={ix} y={iy + 4} textAnchor="middle" fontSize={9} fontWeight={700}
              fill="white" fontFamily="system-ui, sans-serif">K⁺</text>
          </g>
        ) : null;
      })}

      {/* Phase indicator strip */}
      <rect x={4} y={H - 36} width={W - 8} height={32} rx={6}
        fill="#fffbeb" stroke="#fde68a" strokeWidth={1} />
      <text x={W / 2} y={H - 15} textAnchor="middle" fontSize={12} fontWeight={600}
        fill="#92400e" fontFamily="system-ui, sans-serif">
        {PUMP_PHASES[phaseIdx].label}
      </text>
    </svg>
  );
}

// ─── Tab metadata ─────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  {
    id: "bilayer",
    label: "Bilayer",
    subtitle: "Phospholipid Structure",
    accent: C.headHydro,
    accentBg: "rgba(6,182,212,0.07)",
    description: "The cell membrane is a phospholipid bilayer — two sheets of phospholipid molecules arranged tail-to-tail. The hydrophilic (water-loving) phosphate heads face outward toward aqueous environments, while the hydrophobic (water-fearing) fatty-acid tails face inward, forming an oily core that blocks most polar molecules.",
    keyPoints: [
      "Each phospholipid has a polar, charged head and two non-polar fatty-acid tails",
      "The bilayer is ~7 nm thick and fluid at body temperature",
      "Membrane proteins float in the bilayer — the fluid mosaic model (Singer & Nicolson, 1972)",
      "Cholesterol is embedded between phospholipids, regulating membrane fluidity",
    ],
  },
  {
    id: "simple",
    label: "Simple Diffusion",
    subtitle: "Passive — No ATP",
    accent: C.oxygen,
    accentBg: "rgba(100,116,139,0.07)",
    description: "Small, non-polar molecules (O₂, CO₂, ethanol, steroid hormones) dissolve directly into the lipid core and diffuse across the bilayer — no protein needed. Movement always follows the concentration gradient: from high to low concentration until equilibrium is reached.",
    keyPoints: [
      "Requires no energy (ATP) — driven by concentration gradient",
      "Only works for small, non-polar or lipid-soluble molecules",
      "Rate is proportional to the concentration gradient (Fick's first law)",
      "Examples: O₂ entering a cell, CO₂ leaving during respiration",
    ],
  },
  {
    id: "facilitated",
    label: "Facilitated Diffusion",
    subtitle: "Passive — Protein Channel",
    accent: C.channel,
    accentBg: "rgba(167,139,250,0.07)",
    description: "Polar molecules (glucose, amino acids) and ions (Na⁺, K⁺, Cl⁻) cannot cross the oily bilayer core on their own. Membrane channel proteins and carrier proteins provide a hydrophilic tunnel. Movement still flows down the concentration gradient — no ATP consumed.",
    keyPoints: [
      "Still passive — no energy input, gradient drives movement",
      "Channel proteins form pores (e.g. aquaporins for water, ion channels)",
      "Carrier proteins bind and change shape to shuttle molecules across",
      "Example: GLUT1 transporter moves glucose into red blood cells",
    ],
  },
  {
    id: "active",
    label: "Active Transport",
    subtitle: "Active — ATP Required",
    accent: C.pump,
    accentBg: "rgba(245,158,11,0.07)",
    description: "Some molecules must be moved against their concentration gradient — from low to high concentration. This requires energy from ATP hydrolysis. The Na⁺/K⁺ pump is the canonical example: it uses one ATP to export 3 Na⁺ ions out of the cell and import 2 K⁺ ions in, maintaining the resting membrane potential essential for nerve and muscle function.",
    keyPoints: [
      "Moves solutes against the concentration gradient — requires ATP",
      "Na⁺/K⁺ ATPase exports 3 Na⁺ and imports 2 K⁺ per ATP hydrolysed",
      "Net charge movement creates the cell's resting membrane potential (−70 mV in neurons)",
      "Accounts for ~25–40% of a cell's total energy budget",
    ],
  },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

import type React from "react";

export function CellMembraneProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>("bilayer");
  return (
    <CellMembraneCtx.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </CellMembraneCtx.Provider>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

export function CellMembraneViewer() {
  const { activeTab, setActiveTab } = useCellMembrane();
  const tab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Tab row */}
      <div className="grid grid-cols-4 border-b border-zinc-100">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-2.5 text-[11px] font-semibold leading-tight px-1 transition-colors ${
              activeTab === t.id
                ? "bg-zinc-900 text-white"
                : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Visualization area */}
      <div className="relative bg-gradient-to-br from-zinc-50 to-white">
        <div className="relative w-full" style={{ aspectRatio: "560 / 320" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {activeTab === "bilayer"     && <BilayerView />}
              {activeTab === "simple"      && <SimpleDiffusionView />}
              {activeTab === "facilitated" && <FacilitatedDiffusionView />}
              {activeTab === "active"      && <ActiveTransportView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-100 px-5 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          {tab.subtitle}
        </span>
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              aria-label={`View ${t.label}`}
              className={`h-2 rounded-full transition-all ${
                activeTab === t.id ? "w-6 bg-zinc-800" : "w-2 bg-zinc-300 hover:bg-zinc-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CellMembranePanel() {
  const { activeTab, setActiveTab } = useCellMembrane();
  const tab = TABS.find((t) => t.id === activeTab)!;
  const curIdx = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="p-5" style={{ background: tab.accentBg }}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: tab.accent }}>
              {tab.label}
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-zinc-900">{tab.subtitle}</h3>
          </div>
          <div className="flex shrink-0 gap-2">
            {curIdx > 0 && (
              <button onClick={() => setActiveTab(TABS[curIdx - 1].id)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">
                ← Prev
              </button>
            )}
            {curIdx < TABS.length - 1 && (
              <button onClick={() => setActiveTab(TABS[curIdx + 1].id)}
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700">
                Next →
              </button>
            )}
          </div>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-zinc-600">{tab.description}</p>
        <ul className="space-y-1.5">
          {tab.keyPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tab.accent }} />
              {pt}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-zinc-100 px-5 py-3">
        <div className="flex justify-center gap-1.5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} aria-label={`Go to ${t.label}`}
              className={`h-2 rounded-full transition-all ${
                activeTab === t.id ? "w-6 bg-zinc-800" : "w-2 bg-zinc-300 hover:bg-zinc-400"
              }`} />
          ))}
        </div>
      </div>
    </div>
  );
}
