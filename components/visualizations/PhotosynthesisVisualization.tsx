"use client";
/*
 * Biology concept: Photosynthesis — Light Reactions & Calvin Cycle
 * Two-stage process that converts CO₂ + H₂O + light → glucose + O₂:
 *   Stage 1 Light Reactions (thylakoid membrane): H₂O split → O₂ released; electrons
 *     flow PS II → PS I → NADPH; H⁺ gradient drives ATP synthase → ATP
 *   Stage 2 Calvin Cycle (stroma): CO₂ fixed by RuBisCO → 3-PGA → G3P (using ATP +
 *     NADPH from stage 1); G3P regenerated to RuBP; 3 turns = 1 net G3P
 * Interactions: Drag right to advance through 8 stages, left to go back (or ← → keys /
 *   stage tabs). Chloroplast cutaway keeps the thylakoid sac (left) and the Calvin cycle
 *   ring (right) always visible so the spatial separation stays clear; dashed rings mark
 *   the structure working in each stage. At stage 7 arrows carry ATP and NADPH across to
 *   the reduction step — the coupling handoff. A CO₂ molecule is tracked into RuBisCO.
 */

import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import type React from "react";
import { lerp, fadeLerp, q } from "@/lib/scrub";
import { PredictionPrompt, type Prediction } from "@/components/lessons/PredictionPrompt";
import { VIZ_FRAME } from "@/components/visualizations/vizChrome";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  chloroplast: "#16a34a",   // green-600 — outer chloroplast envelope
  thylakoid:   "#059669",   // emerald-600 — thylakoid membrane
  stroma:      "#d1fae5",   // emerald-100 — stroma background
  ps2:         "#7c3aed",   // violet-700 — Photosystem II
  ps1:         "#2563eb",   // blue-600 — Photosystem I
  atpSyn:      "#dc2626",   // red-600 — ATP synthase
  electron:    "#1e293b",   // slate-900 — electron
  hplus:       "#f43f5e",   // rose-500 — H⁺ ions
  atp:         "#10b981",   // emerald-500 — ATP
  nadph:       "#3b82f6",   // blue-500 — NADPH
  water:       "#60a5fa",   // blue-400 — H₂O
  oxygen:      "#94a3b8",   // slate-400 — O₂
  co2:         "#f97316",   // orange-500 — CO₂ / molecule tracker
  rubisco:     "#a16207",   // yellow-700 — RuBisCO enzyme
  pga:         "#fb923c",   // orange-400 — 3-PGA
  g3p:         "#eab308",   // yellow-500 — G3P
  rup:         "#84cc16",   // lime-500 — RuBP
};

// ─── Interpolated state ───────────────────────────────────────────────────────
// Structures (photosystems, ATP synthase, RuBisCO, cycle intermediates) are always
// drawn at full strength; stages switch processes and molecules fully on or off,
// and emphasis rings show which structure is working.
interface PSState {
  // Region highlights (0=off, 1=full) — fills, blended linearly
  thylakoidHL: number;
  stromaHL:    number;

  // Light reactions
  photon1Op:   number;  // light hitting PS II
  photon2Op:   number;  // light hitting PS I
  waterOp:     number;  // H₂O split → O₂
  electronOp:  number;  // e⁻ flow PS II → PS I
  hplusOp:     number;  // H⁺ ions in lumen
  nadphOp:     number;  // NADPH produced
  atpOp:       number;  // ATP produced
  synthFlowOp: number;  // H⁺ flowing through ATP synthase
  ps2Emph:     number;
  ps1Emph:     number;
  synthEmph:   number;

  // Calvin cycle
  rubiscoEmph: number;
  fixArcOp:    number;  // RuBP + CO₂ → 3-PGA
  redArcOp:    number;  // 3-PGA → G3P
  regenArcOp:  number;  // G3P → RuBP
  outputOp:    number;  // G3P → glucose
  handoffOp:   number;  // ATP + NADPH carried to the Calvin cycle
  turnOp:      number;
  turnCount:   number;

  // CO₂ molecule tracker
  co2X:        number;
  co2Y:        number;
  co2Op:       number;
}

const LINEAR_KEYS = new Set<keyof PSState>(["thylakoidHL", "stromaHL", "turnCount", "co2X", "co2Y"]);

function lerpState(a: PSState, b: PSState, t: number): PSState {
  const out = { ...a };
  (Object.keys(a) as (keyof PSState)[]).forEach((k) => {
    out[k] = LINEAR_KEYS.has(k) ? lerp(a[k], b[k], t) : fadeLerp(a[k], b[k], t);
  });
  return out;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────
// viewBox 0 0 500 300. Chloroplast is a rounded oblong (y 48–274) so section titles
// sit in clear space above it. Left half: thylakoid sac. Right half: Calvin cycle.
const TX1 = 36, TX2 = 236;       // thylakoid sac x span
const TY1 = 132, TY2 = 156;      // membrane band (stroma side on top)
const LY2 = 204;                 // bottom of lumen
const PS2X = 78, PS1X = 158, ATSX = 212;

const CYC_X = 366, CYC_Y = 158, CYC_R = 60;
const RUBISCO = { x: CYC_X,         y: CYC_Y - CYC_R };
const PGA     = { x: CYC_X - CYC_R, y: CYC_Y };
const G3P     = { x: CYC_X,         y: CYC_Y + CYC_R };
const RUBP    = { x: CYC_X + CYC_R, y: CYC_Y };
const CO2_WAIT  = { x: 452, y: 74 };
const CO2_FIXED = { x: 420, y: 76 };

// Counter-clockwise arc along the cycle ring, from one angle (degrees, SVG coords) to a smaller one
function cycleArc(fromDeg: number, toDeg: number) {
  const pt = (d: number) => {
    const a = (d * Math.PI) / 180;
    return `${q(CYC_X + CYC_R * Math.cos(a))},${q(CYC_Y + CYC_R * Math.sin(a))}`;
  };
  return `M ${pt(fromDeg)} A ${CYC_R},${CYC_R} 0 0,0 ${pt(toDeg)}`;
}
const ARC_FIX   = cycleArc(-120, -160);   // RuBisCO → 3-PGA
const ARC_RED   = cycleArc(160, 112);     // 3-PGA → G3P
const ARC_REGEN = cycleArc(68, 20);       // G3P → RuBP
const ARC_ENTER = cycleArc(-20, -60);     // RuBP → RuBisCO

const HPLUS_POS = [
  { x: 114, y: 174 }, { x: 136, y: 191 }, { x: 158, y: 174 }, { x: 180, y: 191 },
] as const;

// ─── Keyframes (8 stages) ────────────────────────────────────────────────────
const OFF: PSState = {
  thylakoidHL: 0, stromaHL: 0,
  photon1Op: 0, photon2Op: 0, waterOp: 0, electronOp: 0, hplusOp: 0, nadphOp: 0, atpOp: 0, synthFlowOp: 0,
  ps2Emph: 0, ps1Emph: 0, synthEmph: 0,
  rubiscoEmph: 0, fixArcOp: 0, redArcOp: 0, regenArcOp: 0, outputOp: 0, handoffOp: 0, turnOp: 0, turnCount: 0,
  co2X: CO2_WAIT.x, co2Y: CO2_WAIT.y, co2Op: 1,
};

const KF: PSState[] = [
  // 0 — Chloroplast overview
  OFF,
  // 1 — Light absorption + water splitting (PS II)
  { ...OFF, thylakoidHL: 0.8, photon1Op: 1, waterOp: 1, ps2Emph: 1 },
  // 2 — Electron transport chain PS II → PS I, H⁺ pumped into lumen
  { ...OFF, thylakoidHL: 1, photon1Op: 1, waterOp: 1, electronOp: 1, hplusOp: 1 },
  // 3 — PS I + NADPH
  { ...OFF, thylakoidHL: 1, photon1Op: 1, photon2Op: 1, waterOp: 1, electronOp: 1, hplusOp: 1, nadphOp: 1, ps1Emph: 1 },
  // 4 — Chemiosmosis → ATP
  { ...OFF, thylakoidHL: 1, photon1Op: 1, photon2Op: 1, waterOp: 1, electronOp: 1, hplusOp: 1, nadphOp: 1,
    atpOp: 1, synthFlowOp: 1, synthEmph: 1 },
  // 5 — Carbon fixation: CO₂ reaches RuBisCO
  { ...OFF, thylakoidHL: 0.2, stromaHL: 1, nadphOp: 1, atpOp: 1,
    rubiscoEmph: 1, fixArcOp: 1, turnOp: 1, turnCount: 1, co2X: CO2_FIXED.x, co2Y: CO2_FIXED.y },
  // 6 — Reduction: ATP + NADPH handed off, 3-PGA → G3P
  { ...OFF, thylakoidHL: 0.2, stromaHL: 1, nadphOp: 1, atpOp: 1,
    redArcOp: 1, handoffOp: 1, turnOp: 1, turnCount: 2, co2X: CO2_FIXED.x, co2Y: CO2_FIXED.y, co2Op: 0 },
  // 7 — Regeneration + output
  { ...OFF, thylakoidHL: 0.2, stromaHL: 1, nadphOp: 1, atpOp: 1,
    regenArcOp: 1, outputOp: 1, turnOp: 1, turnCount: 3, co2X: CO2_FIXED.x, co2Y: CO2_FIXED.y, co2Op: 0 },
];

// ─── Context ──────────────────────────────────────────────────────────────────
interface PSContextType {
  progress: number;
  mv:       MotionValue<number>;
  snapTo:   (target: number) => void;
}
const PSContext = createContext<PSContextType | null>(null);
function usePSContext() {
  const ctx = useContext(PSContext);
  if (!ctx) throw new Error("Must be inside PhotosynthesisProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PhotosynthesisProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const mv   = useMotionValue(0);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  // Springing between stages is decorative; reduced-motion users get the end state directly.
  const reduceMotion = useReducedMotion();
  useMotionValueEvent(mv, "change", (v) => setProgress(v));

  function snapTo(target: number) {
    anim.current?.stop();
    if (reduceMotion) { mv.set(target); return; }
    anim.current = animate(mv, target, { type: "spring", stiffness: 260, damping: 28 });
  }

  return (
    <PSContext.Provider value={{ progress, mv, snapTo }}>
      {children}
    </PSContext.Provider>
  );
}

// ─── Stage metadata ───────────────────────────────────────────────────────────
const STAGES = [
  {
    label: "Overview",
    heading: "The chloroplast: two stages, one goal",
    sub: "Thylakoid membrane (left) runs the light reactions. The stroma (right) runs the Calvin cycle. Both sides always visible — because the connection between them is the whole point.",
    location: "Chloroplast",
    inputs: "—",
    outputs: "—",
    note: "",
  },
  {
    label: "Light absorption",
    heading: "Photosystem II absorbs light, splits water",
    sub: "A photon energizes P680 in PS II. The energy is used to split H₂O → 2H⁺ + ½O₂ + 2e⁻. The oxygen is released — this is where the O₂ we breathe comes from.",
    location: "Thylakoid membrane",
    inputs: "H₂O, photons",
    outputs: "O₂, 2e⁻, 2H⁺",
    note: "AP tip: PS II is named by discovery order, not reaction order — it acts first.",
  },
  {
    label: "Electron transport",
    heading: "Electrons flow from PS II to PS I",
    sub: "Electrons move through plastoquinone → cytochrome b6f complex → plastocyanin. Each step pumps H⁺ into the thylakoid lumen, building up the gradient that will power ATP synthesis.",
    location: "Thylakoid membrane",
    inputs: "2e⁻ (from PS II)",
    outputs: "H⁺ gradient in lumen",
    note: "",
  },
  {
    label: "PS I + NADPH",
    heading: "Photosystem I re-energizes electrons → NADPH",
    sub: "A second photon re-energizes the electrons at P700 (PS I). They pass to ferredoxin, then NADP⁺ reductase, reducing NADP⁺ + H⁺ → NADPH. This NADPH is the reducing power the Calvin cycle needs.",
    location: "Thylakoid membrane",
    inputs: "2e⁻, NADP⁺, H⁺",
    outputs: "NADPH",
    note: "",
  },
  {
    label: "Chemiosmosis",
    heading: "H⁺ gradient spins ATP synthase → ATP",
    sub: "The H⁺ accumulated in the lumen flows back through ATP synthase (chemiosmosis), spinning the rotor and driving ATP production. Same mechanism as the mitochondrial ETC — different organelle, same physics.",
    location: "Thylakoid membrane",
    inputs: "H⁺ gradient, ADP + Pᵢ",
    outputs: "ATP",
    note: "AP tip: Light is NOT directly used to make ATP — the H⁺ gradient does the work.",
  },
  {
    label: "Carbon fixation",
    heading: "CO₂ enters the stroma — RuBisCO fixes it",
    sub: "CO₂ from the air binds to RuBP (5C) via RuBisCO, forming an unstable 6C intermediate that immediately splits into two molecules of 3-phosphoglycerate (3-PGA). This is carbon fixation.",
    location: "Stroma",
    inputs: "CO₂ + RuBP (5C)",
    outputs: "2× 3-PGA (3C each)",
    note: "AP tip: RuBisCO is the most abundant enzyme on Earth. Remember its name.",
  },
  {
    label: "Reduction (handoff)",
    heading: "ATP + NADPH power 3-PGA → G3P",
    sub: "Each 3-PGA is phosphorylated by ATP, then reduced by NADPH → glyceraldehyde-3-phosphate (G3P). This is where the energy from the light reactions crosses into the Calvin cycle — the coupling at the heart of photosynthesis.",
    location: "Stroma",
    inputs: "3-PGA, ATP, NADPH",
    outputs: "G3P",
    note: "AP tip: This is why the Calvin cycle stops in the dark — it needs a steady supply of ATP and NADPH from the light reactions.",
  },
  {
    label: "Regeneration + output",
    heading: "G3P → RuBP (3 turns = 1 net G3P)",
    sub: "Most G3P is used to regenerate RuBP (using ATP), keeping the cycle running. 3 turns fix 3 CO₂ and produce 1 net G3P. 6 turns produce 1 glucose. G3P that exits can become glucose, starch, or fatty acids.",
    location: "Stroma",
    inputs: "G3P, ATP",
    outputs: "RuBP (cycle continues), 1 net G3P per 3 turns",
    note: "",
  },
] as const;

// ─── Small pieces ─────────────────────────────────────────────────────────────
function EmphasisRing({ x, y, w, h, op, color }: { x: number; y: number; w: number; h: number; op: number; color: string }) {
  if (op < 0.01) return null;
  return (
    <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={7}
      fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 2" opacity={op} />
  );
}

function Photon({ x, y, op }: { x: number; y: number; op: number }) {
  if (op < 0.01) return null;
  return (
    <g opacity={op}>
      <path d={`M ${x} ${y} l 6 7 l -4 6 l 8 7 l -4 6 l 8 8`}
        fill="none" stroke="#eab308" strokeWidth={2} strokeLinejoin="round" markerEnd="url(#ps-arr-light)" />
      <text x={x + 10} y={y + 2} fontSize={7} fontWeight={700} fill="#a16207" fontFamily="system-ui">light</text>
    </g>
  );
}

// ─── Full chloroplast cutaway diagram ─────────────────────────────────────────
function InterpolatedDiagram({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(progress, KF.length - 1));
  const fi = Math.min(Math.floor(clamped), KF.length - 2);
  const s  = lerpState(KF[fi], KF[fi + 1], clamped - fi);

  return (
    <svg viewBox="0 0 500 300" className="w-full h-full" aria-label="Photosynthesis diagram">
      <defs>
        {([
          ["ps-arr-e", C.electron], ["ps-arr-atp", C.atp], ["ps-arr-nadph", C.nadph], ["ps-arr-light", "#eab308"],
          ["ps-arr-h", C.hplus], ["ps-arr-cyc", "#9ca3af"], ["ps-arr-fix", C.rubisco], ["ps-arr-red", C.pga],
          ["ps-arr-regen", C.rup], ["ps-arr-g3p", C.g3p], ["ps-arr-water", C.water],
        ] as const).map(([id, fill]) => (
          <marker key={id} id={id} markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L0,8 L8,4 z" fill={fill} />
          </marker>
        ))}
      </defs>

      {/* ── Section titles, above the chloroplast ── */}
      <text x={136} y={22} textAnchor="middle" fontSize={8.5} fontWeight={700}
        fill={C.thylakoid} fontFamily="system-ui" letterSpacing="0.08em">LIGHT REACTIONS</text>
      <text x={136} y={35} textAnchor="middle" fontSize={7} fill="#6b7280" fontFamily="system-ui">thylakoid membrane</text>
      <text x={366} y={22} textAnchor="middle" fontSize={8.5} fontWeight={700}
        fill={C.thylakoid} fontFamily="system-ui" letterSpacing="0.08em">CALVIN CYCLE</text>
      <text x={366} y={35} textAnchor="middle" fontSize={7} fill="#6b7280" fontFamily="system-ui">stroma</text>

      {/* ── Chloroplast envelope ── */}
      <rect x={14} y={48} width={472} height={226} rx={56} fill="#ecfdf5" stroke={C.chloroplast} strokeWidth={3} />
      {s.stromaHL > 0.01 && (
        <rect x={14} y={48} width={472} height={226} rx={56} fill="#10b981" fillOpacity={s.stromaHL * 0.08} />
      )}

      {/* ── Divider between light reactions and Calvin cycle ── */}
      <line x1={250} y1={56} x2={250} y2={266} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />

      {/* ── Thylakoid sac: membrane band on top, lumen below ── */}
      <rect x={TX1} y={TY1} width={TX2 - TX1} height={LY2 - TY1} rx={10}
        fill="#a7f3d0" stroke={C.thylakoid} strokeWidth={1.5} />
      <rect x={TX1} y={TY1} width={TX2 - TX1} height={TY2 - TY1} rx={3}
        fill={C.thylakoid} fillOpacity={0.22 + s.thylakoidHL * 0.25} />
      <text x={136} y={216} textAnchor="middle" fontSize={7} fill={C.thylakoid} fontFamily="system-ui">thylakoid lumen</text>

      {/* ── Light ── */}
      <Photon x={40} y={70} op={s.photon1Op} />
      <Photon x={120} y={70} op={s.photon2Op} />

      {/* ── PS II ── */}
      <EmphasisRing x={PS2X - 13} y={TY1} w={26} h={TY2 - TY1} op={s.ps2Emph} color={C.ps2} />
      <rect x={PS2X - 13} y={TY1} width={26} height={TY2 - TY1} rx={4} fill={C.ps2} fillOpacity={0.88} />
      <text x={PS2X} y={TY1 - 17} textAnchor="middle" fontSize={8} fontWeight={700} fill={C.ps2} fontFamily="system-ui">PS II</text>
      <text x={PS2X} y={TY1 - 8} textAnchor="middle" fontSize={6} fill={C.ps2} fontFamily="system-ui" opacity={0.75}>P680</text>

      {/* ── PS I ── */}
      <EmphasisRing x={PS1X - 13} y={TY1} w={26} h={TY2 - TY1} op={s.ps1Emph} color={C.ps1} />
      <rect x={PS1X - 13} y={TY1} width={26} height={TY2 - TY1} rx={4} fill={C.ps1} fillOpacity={0.88} />
      <text x={PS1X} y={TY1 - 17} textAnchor="middle" fontSize={8} fontWeight={700} fill={C.ps1} fontFamily="system-ui">PS I</text>
      <text x={PS1X} y={TY1 - 8} textAnchor="middle" fontSize={6} fill={C.ps1} fontFamily="system-ui" opacity={0.75}>P700</text>

      {/* ── ATP synthase (spans the membrane) ── */}
      <EmphasisRing x={ATSX - 6} y={TY1 - 10} w={12} h={TY2 - TY1 + 20} op={s.synthEmph} color={C.atpSyn} />
      <rect x={ATSX - 6} y={TY1 - 10} width={12} height={TY2 - TY1 + 20} rx={5} fill={C.atpSyn} fillOpacity={0.88} />
      <text x={ATSX} y={227} textAnchor="middle" fontSize={7} fontWeight={700} fill={C.atpSyn} fontFamily="system-ui">ATP synthase</text>
      <line x1={ATSX} y1={220} x2={ATSX} y2={TY2 + 14} stroke={C.atpSyn} strokeWidth={0.75} opacity={0.5} />

      {/* ── Water splitting (lumen side of PS II) ── */}
      {s.waterOp > 0.01 && (
        <g opacity={s.waterOp} fontFamily="system-ui">
          <circle cx={56} cy={184} r={11} fill={C.water} fillOpacity={0.9} />
          <text x={56} y={187} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">H₂O</text>
          <line x1={66} y1={176} x2={PS2X - 4} y2={TY2 + 4} stroke={C.water} strokeWidth={1.5} markerEnd="url(#ps-arr-water)" />
          <circle cx={92} cy={188} r={10} fill={C.oxygen} fillOpacity={0.9} />
          <text x={92} y={191} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">O₂</text>
          <line x1={PS2X + 2} y1={TY2 + 4} x2={88} y2={177} stroke={C.oxygen} strokeWidth={1.5} markerEnd="url(#ps-arr-cyc)" />
        </g>
      )}

      {/* ── Electron flow PS II → PS I, inside the membrane ── */}
      {s.electronOp > 0.01 && (
        <g opacity={s.electronOp}>
          <line x1={PS2X + 15} y1={(TY1 + TY2) / 2} x2={PS1X - 16} y2={(TY1 + TY2) / 2}
            stroke={C.electron} strokeWidth={2} strokeDasharray="5 3" markerEnd="url(#ps-arr-e)" />
          <text x={(PS2X + PS1X) / 2} y={TY1 - 5} textAnchor="middle" fontSize={8} fontWeight={700}
            fill={C.electron} fontFamily="system-ui">e⁻</text>
        </g>
      )}

      {/* ── H⁺ accumulated in the lumen ── */}
      {s.hplusOp > 0.01 && HPLUS_POS.map((p, i) => (
        <g key={i} opacity={s.hplusOp}>
          <circle cx={p.x} cy={p.y} r={8} fill={C.hplus} fillOpacity={0.85} />
          <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize={7} fontWeight={700} fill="white" fontFamily="system-ui">H⁺</text>
        </g>
      ))}
      {s.synthFlowOp > 0.01 && (
        <line x1={ATSX - 16} y1={194} x2={ATSX - 8} y2={TY2 + 6} opacity={s.synthFlowOp}
          stroke={C.hplus} strokeWidth={1.75} markerEnd="url(#ps-arr-h)" />
      )}

      {/* ── NADPH (stroma side of PS I) ── */}
      {s.nadphOp > 0.01 && (
        <g opacity={s.nadphOp} fontFamily="system-ui">
          <line x1={PS1X + 13} y1={TY1 - 3} x2={182} y2={102} stroke={C.nadph} strokeWidth={1.5} markerEnd="url(#ps-arr-nadph)" />
          <circle cx={188} cy={86} r={15} fill={C.nadph} fillOpacity={0.92} />
          <text x={188} y={89} textAnchor="middle" fontSize={7} fontWeight={700} fill="white">NADPH</text>
        </g>
      )}

      {/* ── ATP (stroma side of ATP synthase) ── */}
      {s.atpOp > 0.01 && (
        <g opacity={s.atpOp} fontFamily="system-ui">
          <circle cx={228} cy={98} r={12} fill={C.atp} fillOpacity={0.92} />
          <text x={228} y={101} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white">ATP</text>
        </g>
      )}

      {/* ── Calvin cycle ring (always visible) ── */}
      {[ARC_FIX, ARC_RED, ARC_REGEN, ARC_ENTER].map((d) => (
        <path key={d} d={d} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 3"
          markerEnd="url(#ps-arr-cyc)" opacity={0.6} />
      ))}
      {s.fixArcOp > 0.01 && (
        <path d={ARC_FIX} fill="none" stroke={C.rubisco} strokeWidth={2.5} markerEnd="url(#ps-arr-fix)" opacity={s.fixArcOp} />
      )}
      {s.redArcOp > 0.01 && (
        <path d={ARC_RED} fill="none" stroke={C.pga} strokeWidth={2.5} markerEnd="url(#ps-arr-red)" opacity={s.redArcOp} />
      )}
      {s.regenArcOp > 0.01 && (
        <path d={ARC_REGEN} fill="none" stroke={C.rup} strokeWidth={2.5} markerEnd="url(#ps-arr-regen)" opacity={s.regenArcOp} />
      )}

      {/* ── Handoff: ATP + NADPH carried across to the reduction step ── */}
      {s.handoffOp > 0.01 && (
        <g opacity={s.handoffOp}>
          <path d="M 203 82 C 258 50, 272 150, 302 196" fill="none" stroke={C.nadph} strokeWidth={2} markerEnd="url(#ps-arr-nadph)" />
          <path d="M 240 100 C 268 106, 262 214, 310 213" fill="none" stroke={C.atp} strokeWidth={2} markerEnd="url(#ps-arr-atp)" />
          <text x={292} y={236} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#166534" fontFamily="system-ui">ATP + NADPH</text>
        </g>
      )}

      {/* ── Cycle intermediates ── */}
      <EmphasisRing x={RUBISCO.x - 30} y={RUBISCO.y - 15} w={60} h={30} op={s.rubiscoEmph} color={C.rubisco} />
      <ellipse cx={RUBISCO.x} cy={RUBISCO.y} rx={30} ry={15} fill={C.rubisco} fillOpacity={0.9} />
      <text x={RUBISCO.x} y={RUBISCO.y + 3} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white" fontFamily="system-ui">RuBisCO</text>

      <circle cx={PGA.x} cy={PGA.y} r={16} fill={C.pga} fillOpacity={0.9} />
      <text x={PGA.x} y={PGA.y - 1} textAnchor="middle" fontSize={7} fontWeight={700} fill="white" fontFamily="system-ui">3-PGA</text>
      <text x={PGA.x} y={PGA.y + 8} textAnchor="middle" fontSize={6} fill="white" fontFamily="system-ui">(3C)</text>

      <circle cx={G3P.x} cy={G3P.y} r={16} fill={C.g3p} fillOpacity={0.92} />
      <text x={G3P.x} y={G3P.y - 1} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#1a1a1a" fontFamily="system-ui">G3P</text>
      <text x={G3P.x} y={G3P.y + 8} textAnchor="middle" fontSize={6} fill="#333" fontFamily="system-ui">(3C)</text>

      <circle cx={RUBP.x} cy={RUBP.y} r={17} fill={C.rup} fillOpacity={0.9} />
      <text x={RUBP.x} y={RUBP.y - 1} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="white" fontFamily="system-ui">RuBP</text>
      <text x={RUBP.x} y={RUBP.y + 8} textAnchor="middle" fontSize={6} fill="white" fontFamily="system-ui">(5C)</text>

      {/* ── Output: G3P → glucose ── */}
      {s.outputOp > 0.01 && (
        <g opacity={s.outputOp}>
          <line x1={G3P.x + 13} y1={G3P.y + 10} x2={G3P.x + 34} y2={G3P.y + 28}
            stroke={C.g3p} strokeWidth={2} markerEnd="url(#ps-arr-g3p)" />
          <text x={G3P.x + 40} y={G3P.y + 34} fontSize={8} fontWeight={700} fill="#a16207" fontFamily="system-ui">glucose</text>
        </g>
      )}

      {/* ── Turn counter ── */}
      {s.turnOp > 0.01 && (
        <g opacity={s.turnOp} fontFamily="system-ui">
          <rect x={262} y={56} width={74} height={26} rx={8} fill="#f0fdf4" stroke="#bbf7d0" strokeWidth={1} />
          <text x={299} y={67} textAnchor="middle" fontSize={8} fontWeight={700} fill="#166534">
            Turn {Math.min(Math.max(Math.round(s.turnCount), 1), 3)} / 3
          </text>
          <text x={299} y={77} textAnchor="middle" fontSize={6.5} fill="#16a34a">3 CO₂ → 1 net G3P</text>
        </g>
      )}

      {/* ── CO₂ molecule tracker ── */}
      {s.co2Op > 0.01 && (
        <g opacity={s.co2Op}>
          <circle cx={s.co2X} cy={s.co2Y} r={12} fill={C.co2} fillOpacity={0.92} />
          <text x={s.co2X} y={s.co2Y + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill="white" fontFamily="system-ui">CO₂</text>
        </g>
      )}

      {/* ── Overall equation ── */}
      <text x={250} y={292} textAnchor="middle" fontSize={7.5} fill="#9ca3af" fontFamily="system-ui">
        6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂
      </text>
    </svg>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────
export function PhotosynthesisViewer() {
  const { progress, mv, snapTo } = usePSContext();
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startP   = useRef(0);

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    startP.current = mv.get();
    mv.stop();
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const raw = startP.current + dx / 90;
    mv.set(Math.max(0, Math.min(raw, KF.length - 1)));
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    snapTo(Math.round(mv.get()));
  }

  const stage = Math.round(Math.max(0, Math.min(progress, KF.length - 1)));

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") { e.preventDefault(); snapTo(Math.min(KF.length - 1, stage + 1)); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); snapTo(Math.max(0, stage - 1)); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className={`${VIZ_FRAME} select-none`}>
      {/* Stage tabs */}
      <div className="flex border-b border-zinc-100 overflow-x-auto scrollbar-hide">
        {STAGES.map((s, i) => (
          <button
            key={i}
            onClick={() => snapTo(i)}
            aria-label={`Go to stage ${i + 1}: ${s.label}`}
            aria-current={stage === i ? "step" : undefined}
            className={`shrink-0 px-3 py-2.5 text-xs font-semibold transition-colors ${
              stage === i
                ? "border-b-2 border-emerald-500 text-emerald-700 bg-emerald-50"
                : "text-zinc-600 hover:text-zinc-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* SVG drag area */}
      <div
        className="aspect-[5/3] cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <InterpolatedDiagram progress={progress} />
      </div>

      {/* Drag hint */}
      <p className="py-2 text-center text-xs text-zinc-600">
        Drag left/right, use arrow keys, or click a tab to explore
      </p>
    </div>
  );
}

// ─── Info panel ───────────────────────────────────────────────────────────────
// ─── Predictions — asked on a stage, answered by the next one ────────────────
const PREDICTIONS: Partial<Record<number, Prediction>> = {
  0: {
    question: "Plants release O₂. Which molecule do you think that oxygen comes from?",
    options: ["CO₂", "Glucose", "Water"],
    correct: 2,
    explanation: "PS II splits water to replace the electrons it loses, releasing O₂. The oxygen atoms from CO₂ end up in sugar, not in the air.",
  },
  2: {
    question: "Electrons reaching PS I have lost energy. What re-energizes them?",
    options: ["A second photon absorbed by PS I", "ATP from ATP synthase", "The Calvin cycle"],
    correct: 0,
    explanation: "PS I absorbs its own photon, boosting the electrons high enough to reduce NADP⁺ to NADPH.",
  },
  3: {
    question: "H⁺ has piled up inside the thylakoid. How will the chloroplast use that gradient?",
    options: ["H⁺ combines with O₂ to form water", "H⁺ flows back out through ATP synthase, making ATP", "H⁺ is fed directly into the Calvin cycle"],
    correct: 1,
    explanation: "Like water through a turbine, H⁺ rushing through ATP synthase spins it and powers ATP production — chemiosmosis.",
  },
  4: {
    question: "What will the Calvin cycle need from the light reactions?",
    options: ["O₂ and water", "Glucose", "ATP and NADPH"],
    correct: 2,
    explanation: "ATP supplies energy and NADPH supplies high-energy electrons to turn fixed carbon into sugar.",
  },
  6: {
    question: "If the lamp switched off right now, what would happen to the Calvin cycle?",
    options: ["It would keep going — it doesn’t use light", "It would stop once ATP and NADPH ran out", "It would speed up"],
    correct: 1,
    explanation: "It doesn’t absorb light itself, but it depends on ATP and NADPH from the light reactions. Try it in the leaf disk lab above.",
  },
};

export function PhotosynthesisPanel() {
  const { progress, snapTo } = usePSContext();
  const stage = Math.round(Math.max(0, Math.min(progress, KF.length - 1)));
  const s = STAGES[stage];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const prediction = PREDICTIONS[stage];

  return (
    <div className={`${VIZ_FRAME} p-6 space-y-4`}>
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
          {s.location}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">{s.heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">{s.sub}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Inputs</div>
          <div className="text-sm font-semibold text-zinc-700">{s.inputs}</div>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">Outputs</div>
          <div className="text-sm font-semibold text-zinc-700">{s.outputs}</div>
        </div>
      </div>

      {s.note && (
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-zinc-700">{s.note}</p>
        </div>
      )}

      {prediction && (
        <PredictionPrompt key={stage} {...prediction} selected={answers[stage]}
          onSelect={(i) => setAnswers((prev) => ({ ...prev, [stage]: i }))}
          onContinue={() => snapTo(Math.min(KF.length - 1, stage + 1))} />
      )}
    </div>
  );
}

// ─── Emblem (lesson card thumbnail) ──────────────────────────────────────────
// A sunlit leaf giving off O₂ bubbles.
export function PhotosynthesisEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -2 120 106" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ps-emb-leaf" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
      </defs>

      {/* Sun and light rays */}
      <g stroke="#facc15" strokeWidth={2} strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line key={deg} x1={20} y1={9} x2={20} y2={4} transform={`rotate(${deg} 20 18)`} />
        ))}
      </g>
      <circle cx={20} cy={18} r={7} fill="#fde047" stroke="#facc15" strokeWidth={1.5} />
      <g stroke="#facc15" strokeWidth={1.5} strokeDasharray="3 3" strokeLinecap="round" opacity={0.8}>
        <line x1={31} y1={25} x2={43} y2={35} />
        <line x1={27} y1={30} x2={35} y2={42} />
      </g>

      {/* Leaf, tilted up toward the light */}
      <g transform="rotate(-25 62 50)">
        <line x1={4} y1={50} x2={16} y2={50} stroke="#15803d" strokeWidth={3} strokeLinecap="round" />
        <path d="M 15 50 C 35 22, 80 18, 106 50 C 80 80, 35 78, 15 50 Z" fill="url(#ps-emb-leaf)" />
        <line x1={15} y1={50} x2={104} y2={50} stroke="#dcfce7" strokeWidth={1.6} strokeLinecap="round" opacity={0.9} />
        <g stroke="#dcfce7" strokeWidth={1} strokeLinecap="round" opacity={0.75} fill="none">
          {[34, 52, 70, 86].map((x) => (
            <g key={x}>
              <path d={`M ${x} 50 Q ${x + 8} 42, ${x + 15} ${x < 80 ? 32 : 38}`} />
              <path d={`M ${x} 50 Q ${x + 8} 58, ${x + 15} ${x < 80 ? 68 : 62}`} />
            </g>
          ))}
        </g>
      </g>

      {/* O₂ bubbles rising off the leaf */}
      <g fill="#e0f2fe" stroke="#38bdf8" strokeWidth={1.2}>
        <circle cx={104} cy={12} r={4.5} />
        <circle cx={112} cy={24} r={3} />
        <circle cx={95} cy={4} r={2.5} />
      </g>
    </svg>
  );
}
