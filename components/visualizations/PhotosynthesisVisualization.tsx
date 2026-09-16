"use client";
/*
 * Biology concept: Photosynthesis — Light Reactions & Calvin Cycle
 * Two-stage process that converts CO₂ + H₂O + light → glucose + O₂:
 *   Stage 1 Light Reactions (thylakoid membrane): H₂O split → O₂ released; electrons
 *     flow PS II → PS I → NADPH; H⁺ gradient drives ATP synthase → ATP
 *   Stage 2 Calvin Cycle (stroma): CO₂ fixed by RuBisCO → 3-PGA → G3P (using ATP +
 *     NADPH from stage 1); G3P regenerated to RuBP; 3 turns = 1 net G3P
 * Interactions: Drag right to advance through 8 stages, left to go back. Chloroplast
 *   cutaway keeps thylakoid (left) and stroma (right) always visible so the spatial
 *   separation stays clear. ATP and NADPH visually cross from thylakoid to stroma at
 *   stage 7 — the coupling handoff. A CO₂ molecule is tracked through the Calvin cycle.
 */

import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
} from "framer-motion";
import type React from "react";

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

// ─── Lerp helpers ─────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Interpolated state ───────────────────────────────────────────────────────
interface PSState {
  // Region highlights (0=off, 1=full)
  thylakoidHL: number;
  stromaHL:    number;

  // Light reactions visibility
  ps2Op:       number;
  ps1Op:       number;
  atpSynOp:    number;
  waterOp:     number;
  o2Op:        number;
  electronOp:  number;  // e⁻ flow path opacity
  hplusOp:     number;  // H⁺ ions in lumen
  nadphOp:     number;  // NADPH produced

  // ATP produced (light reactions)
  atpLRCount:  number;

  // Calvin cycle visibility
  rubiscoOp:   number;
  pgaOp:       number;
  g3pOp:       number;
  rupOp:       number;
  turnCount:   number;  // 0–3 turns of the cycle

  // Handoff — ATP/NADPH crossing from thylakoid to stroma (0=left, 1=right)
  handoffX:    number;
  handoffOp:   number;

  // CO₂ molecule tracker
  co2X:        number;
  co2Y:        number;
  co2Op:       number;
}

function lerpState(a: PSState, b: PSState, t: number): PSState {
  return {
    thylakoidHL: lerp(a.thylakoidHL, b.thylakoidHL, t),
    stromaHL:    lerp(a.stromaHL,    b.stromaHL,    t),
    ps2Op:       lerp(a.ps2Op,       b.ps2Op,       t),
    ps1Op:       lerp(a.ps1Op,       b.ps1Op,       t),
    atpSynOp:    lerp(a.atpSynOp,   b.atpSynOp,    t),
    waterOp:     lerp(a.waterOp,     b.waterOp,     t),
    o2Op:        lerp(a.o2Op,        b.o2Op,        t),
    electronOp:  lerp(a.electronOp,  b.electronOp,  t),
    hplusOp:     lerp(a.hplusOp,    b.hplusOp,     t),
    nadphOp:     lerp(a.nadphOp,    b.nadphOp,     t),
    atpLRCount:  lerp(a.atpLRCount,  b.atpLRCount,  t),
    rubiscoOp:   lerp(a.rubiscoOp,   b.rubiscoOp,   t),
    pgaOp:       lerp(a.pgaOp,       b.pgaOp,       t),
    g3pOp:       lerp(a.g3pOp,       b.g3pOp,       t),
    rupOp:       lerp(a.rupOp,       b.rupOp,       t),
    turnCount:   lerp(a.turnCount,   b.turnCount,   t),
    handoffX:    lerp(a.handoffX,    b.handoffX,    t),
    handoffOp:   lerp(a.handoffOp,  b.handoffOp,   t),
    co2X:        lerp(a.co2X,        b.co2X,        t),
    co2Y:        lerp(a.co2Y,        b.co2Y,        t),
    co2Op:       lerp(a.co2Op,       b.co2Op,       t),
  };
}

// ─── Keyframes (8 stages) ────────────────────────────────────────────────────
// SVG viewBox: 0 0 500 300
// Chloroplast ellipse: cx=250 cy=150 rx=230 ry=130
// Thylakoid membrane: horizontal band, y=130–170, left half (x=30–250)
// Stroma: right half + above/below thylakoid on left (x=250–470)
// Dividing line at x=250 (center)

const KF: PSState[] = [
  // 0 — Chloroplast overview (everything quiet)
  { thylakoidHL:0,    stromaHL:0,
    ps2Op:0.3,        ps1Op:0.3,        atpSynOp:0.3,
    waterOp:0.3,      o2Op:0,           electronOp:0,     hplusOp:0,   nadphOp:0,
    atpLRCount:0,
    rubiscoOp:0.3,    pgaOp:0,          g3pOp:0,          rupOp:0.3,   turnCount:0,
    handoffX:0,       handoffOp:0,
    co2X:60,          co2Y:60,          co2Op:0.6 },

  // 1 — Light absorption + water splitting (PS II activated)
  { thylakoidHL:0.8,  stromaHL:0,
    ps2Op:1,          ps1Op:0.3,        atpSynOp:0.3,
    waterOp:1,        o2Op:1,           electronOp:0,     hplusOp:0.4, nadphOp:0,
    atpLRCount:0,
    rubiscoOp:0.2,    pgaOp:0,          g3pOp:0,          rupOp:0.2,   turnCount:0,
    handoffX:0,       handoffOp:0,
    co2X:60,          co2Y:60,          co2Op:0.6 },

  // 2 — Electron transport chain (PS II → plastoquinone → cyt b6f → plastocyanin)
  { thylakoidHL:1,    stromaHL:0,
    ps2Op:1,          ps1Op:0.6,        atpSynOp:0.4,
    waterOp:0.8,      o2Op:0.8,         electronOp:1,     hplusOp:0.8, nadphOp:0,
    atpLRCount:0,
    rubiscoOp:0.2,    pgaOp:0,          g3pOp:0,          rupOp:0.2,   turnCount:0,
    handoffX:0,       handoffOp:0,
    co2X:60,          co2Y:60,          co2Op:0.6 },

  // 3 — PS I + NADPH production
  { thylakoidHL:0.9,  stromaHL:0.2,
    ps2Op:0.7,        ps1Op:1,          atpSynOp:0.5,
    waterOp:0.6,      o2Op:0.6,         electronOp:0.8,   hplusOp:1,   nadphOp:1,
    atpLRCount:0,
    rubiscoOp:0.2,    pgaOp:0,          g3pOp:0,          rupOp:0.2,   turnCount:0,
    handoffX:0,       handoffOp:0,
    co2X:60,          co2Y:60,          co2Op:0.6 },

  // 4 — Chemiosmosis → ATP (ATP synthase spins)
  { thylakoidHL:0.7,  stromaHL:0.3,
    ps2Op:0.5,        ps1Op:0.7,        atpSynOp:1,
    waterOp:0.5,      o2Op:0.5,         electronOp:0.5,   hplusOp:0.6, nadphOp:1,
    atpLRCount:3,
    rubiscoOp:0.2,    pgaOp:0,          g3pOp:0,          rupOp:0.2,   turnCount:0,
    handoffX:0,       handoffOp:0,
    co2X:60,          co2Y:60,          co2Op:0.6 },

  // 5 — Calvin cycle opens (CO₂ enters, RuBisCO fixes it)
  { thylakoidHL:0.3,  stromaHL:0.9,
    ps2Op:0.3,        ps1Op:0.3,        atpSynOp:0.5,
    waterOp:0.3,      o2Op:0.3,         electronOp:0.2,   hplusOp:0.3, nadphOp:0.7,
    atpLRCount:3,
    rubiscoOp:1,      pgaOp:0.5,        g3pOp:0,          rupOp:0.6,   turnCount:1,
    handoffX:0,       handoffOp:0,
    co2X:290,         co2Y:110,         co2Op:1 },

  // 6 — Reduction: 3-PGA + ATP + NADPH → G3P (handoff moment)
  { thylakoidHL:0.2,  stromaHL:1,
    ps2Op:0.2,        ps1Op:0.2,        atpSynOp:0.4,
    waterOp:0.2,      o2Op:0.2,         electronOp:0.1,   hplusOp:0.2, nadphOp:0.4,
    atpLRCount:3,
    rubiscoOp:0.8,    pgaOp:1,          g3pOp:0.8,        rupOp:0.5,   turnCount:2,
    handoffX:1,       handoffOp:1,
    co2X:340,         co2Y:150,         co2Op:1 },

  // 7 — Regeneration + output (G3P exits, RuBP regenerated, 3 turns done)
  { thylakoidHL:0.15, stromaHL:0.8,
    ps2Op:0.2,        ps1Op:0.2,        atpSynOp:0.3,
    waterOp:0.2,      o2Op:0.2,         electronOp:0.1,   hplusOp:0.2, nadphOp:0.3,
    atpLRCount:3,
    rubiscoOp:0.6,    pgaOp:0.6,        g3pOp:1,          rupOp:1,     turnCount:3,
    handoffX:1,       handoffOp:0.5,
    co2X:400,         co2Y:200,         co2Op:0.8 },
];

// ─── Context ──────────────────────────────────────────────────────────────────
interface PSContextType {
  progress: number;
  setProgress: (p: number) => void;
}
const PSContext = createContext<PSContextType>({ progress: 0, setProgress: () => {} });
function usePSContext() { return useContext(PSContext); }

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PhotosynthesisProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  return (
    <PSContext.Provider value={{ progress, setProgress }}>
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

// ─── H⁺ positions in thylakoid lumen ─────────────────────────────────────────
const HPLUS_POS = [
  { x: 62,  y: 188 },
  { x: 90,  y: 194 },
  { x: 120, y: 198 },
  { x: 152, y: 194 },
  { x: 184, y: 190 },
  { x: 214, y: 196 },
] as const;

// ─── Full chloroplast cutaway diagram ─────────────────────────────────────────
function InterpolatedDiagram({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(progress, KF.length - 1));
  const fi = Math.min(Math.floor(clamped), KF.length - 2);
  const t  = clamped - fi;
  const s  = lerpState(KF[fi], KF[Math.min(fi + 1, KF.length - 1)], t);

  // Layout constants
  const CX = 250, CY = 152;          // chloroplast center
  const TY1 = 145, TY2 = 170;        // thylakoid membrane band top/bottom
  const LY2 = 215;                    // bottom of lumen region
  const TX1 = 38,  TX2 = 242;        // thylakoid x span (left half)

  // Protein centers (embedded in membrane)
  const PS2X = 84;
  const PS1X = 175;
  const ATSX = 222;

  // Stroma (right half) element positions
  const RUBX = 335, RUBY = 118;
  const PGAX = 385, PGAY = 168;
  const G3PX = 420, G3PY = 210;
  const RUPX = 295, RUPY = 215;

  return (
    <svg viewBox="0 0 500 300" className="w-full h-full" aria-label="Photosynthesis diagram">
      <defs>
        <clipPath id="ps-outer">
          <ellipse cx={CX} cy={CY} rx={226} ry={128} />
        </clipPath>
        <clipPath id="ps-lumen">
          <rect x={TX1} y={TY2} width={TX2 - TX1} height={LY2 - TY2} />
        </clipPath>
        <marker id="ps-arr-e" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={C.electron} />
        </marker>
        <marker id="ps-arr-atp" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={C.atp} />
        </marker>
        <marker id="ps-arr-nadph" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={C.nadph} />
        </marker>
        <marker id="ps-arr-mol" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={C.rubisco} />
        </marker>
        <marker id="ps-arr-g3p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={C.g3p} />
        </marker>
      </defs>

      {/* ── Outer chloroplast envelope ── */}
      <ellipse cx={CX} cy={CY} rx={226} ry={128} fill="#ecfdf5" stroke={C.chloroplast} strokeWidth={3} />

      {/* ── Thylakoid lumen background (inside the thylakoid sac) ── */}
      <ellipse cx={CX} cy={CY} rx={226} ry={128} fill="#a7f3d0" clipPath="url(#ps-lumen)" />

      {/* ── Region highlight: thylakoid (light reactions active) ── */}
      {s.thylakoidHL > 0.01 && (
        <rect x={TX1} y={TY1} width={TX2 - TX1} height={TY2 - TY1}
          fill={C.thylakoid} fillOpacity={s.thylakoidHL * 0.38} rx={3}
          clipPath="url(#ps-outer)" />
      )}

      {/* ── Region highlight: stroma (Calvin cycle active) ── */}
      {s.stromaHL > 0.01 && (
        <ellipse cx={CX} cy={CY} rx={226} ry={128}
          fill="#10b981" fillOpacity={s.stromaHL * 0.1} />
      )}

      {/* ── Thylakoid membrane band ── */}
      <rect x={TX1} y={TY1} width={TX2 - TX1} height={TY2 - TY1}
        fill={C.thylakoid} fillOpacity={0.22}
        stroke={C.thylakoid} strokeWidth={1.5} rx={3} />

      {/* ── Divider between left (light rxns) and right (Calvin) ── */}
      <line x1={250} y1={26} x2={250} y2={276}
        stroke="#d1d5db" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />

      {/* ── Section labels ── */}
      <text x={130} y={37} textAnchor="middle" fontSize={8.5} fontWeight={700}
        fill="#059669" fontFamily="system-ui" letterSpacing="0.08em">LIGHT REACTIONS</text>
      <text x={130} y={49} textAnchor="middle" fontSize={7} fill="#6b7280" fontFamily="system-ui">thylakoid membrane</text>
      <text x={368} y={37} textAnchor="middle" fontSize={8.5} fontWeight={700}
        fill="#059669" fontFamily="system-ui" letterSpacing="0.08em">CALVIN CYCLE</text>
      <text x={368} y={49} textAnchor="middle" fontSize={7} fill="#6b7280" fontFamily="system-ui">stroma</text>
      <text x={130} y={208} textAnchor="middle" fontSize={7} fill="#059669" fontFamily="system-ui" opacity={0.6}>lumen</text>

      {/* ── H₂O splitting below PS II ── */}
      {s.waterOp > 0.01 && (
        <g opacity={s.waterOp}>
          <circle cx={PS2X - 4} cy={203} r={11} fill={C.water} fillOpacity={0.85} />
          <text x={PS2X - 4} y={207} textAnchor="middle" fontSize={8} fontWeight={700}
            fill="white" fontFamily="system-ui">H₂O</text>
          <line x1={PS2X - 4} y1={192} x2={PS2X - 4} y2={TY2 + 2}
            stroke={C.water} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.65} />
        </g>
      )}

      {/* ── O₂ released above PS II ── */}
      {s.o2Op > 0.01 && (
        <g opacity={s.o2Op}>
          <circle cx={PS2X - 28} cy={119} r={11} fill={C.oxygen} fillOpacity={0.85} />
          <text x={PS2X - 28} y={123} textAnchor="middle" fontSize={8} fontWeight={700}
            fill="white" fontFamily="system-ui">O₂</text>
          <line x1={PS2X - 8} y1={TY1 - 1} x2={PS2X - 26} y2={131}
            stroke={C.oxygen} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.5} />
        </g>
      )}

      {/* ── PS II protein ── */}
      <g opacity={s.ps2Op}>
        <rect x={PS2X - 13} y={TY1} width={26} height={TY2 - TY1}
          rx={4} fill={C.ps2} fillOpacity={0.88} />
        <text x={PS2X} y={TY1 - 5} textAnchor="middle" fontSize={8} fontWeight={700}
          fill={C.ps2} fontFamily="system-ui">PS II</text>
        <text x={PS2X} y={TY1 - 14} textAnchor="middle" fontSize={6} fill="#7c3aed"
          fontFamily="system-ui" opacity={0.75}>P680</text>
      </g>

      {/* ── Electron transport: PS II → PS I (arc through lumen) ── */}
      {s.electronOp > 0.01 && (
        <g opacity={s.electronOp}>
          <path d={`M ${PS2X} ${TY2 + 3} C ${PS2X + 22} ${192}, ${PS1X - 22} ${192}, ${PS1X} ${TY2 + 3}`}
            fill="none" stroke={C.electron} strokeWidth={2}
            strokeDasharray="5 3" markerEnd="url(#ps-arr-e)" />
          <text x={(PS2X + PS1X) / 2} y={199} textAnchor="middle" fontSize={7.5}
            fontWeight={700} fill={C.electron} fontFamily="system-ui">e⁻</text>
        </g>
      )}

      {/* ── PS I protein ── */}
      <g opacity={s.ps1Op}>
        <rect x={PS1X - 13} y={TY1} width={26} height={TY2 - TY1}
          rx={4} fill={C.ps1} fillOpacity={0.88} />
        <text x={PS1X} y={TY1 - 5} textAnchor="middle" fontSize={8} fontWeight={700}
          fill={C.ps1} fontFamily="system-ui">PS I</text>
        <text x={PS1X} y={TY1 - 14} textAnchor="middle" fontSize={6} fill="#1d4ed8"
          fontFamily="system-ui" opacity={0.75}>P700</text>
      </g>

      {/* ── PS I → NADPH (stroma side) ── */}
      {s.nadphOp > 0.01 && (
        <g opacity={s.nadphOp}>
          <path d={`M ${PS1X + 2} ${TY1 - 1} C ${PS1X + 16} ${116}, 228 ${106}, 240 ${102}`}
            fill="none" stroke={C.nadph} strokeWidth={1.5}
            strokeDasharray="4 2" markerEnd="url(#ps-arr-nadph)" />
          <circle cx={244} cy={98} r={14} fill={C.nadph} fillOpacity={0.9} />
          <text x={244} y={96} textAnchor="middle" fontSize={7} fontWeight={700}
            fill="white" fontFamily="system-ui">NADPH</text>
          <text x={244} y={105} textAnchor="middle" fontSize={5.5} fill="white"
            fontFamily="system-ui" opacity={0.85}>→ stroma</text>
        </g>
      )}

      {/* ── H⁺ ions accumulated in lumen ── */}
      {s.hplusOp > 0.01 && HPLUS_POS.map((p, i) => (
        <g key={i} opacity={s.hplusOp * (0.55 + 0.45 * ((i % 3) / 3))}>
          <circle cx={p.x} cy={p.y} r={8} fill={C.hplus} fillOpacity={0.82} />
          <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={7} fontWeight={700}
            fill="white" fontFamily="system-ui">H⁺</text>
        </g>
      ))}

      {/* ── ATP synthase (spans lumen → stroma through membrane) ── */}
      <g opacity={s.atpSynOp}>
        <rect x={ATSX - 6} y={TY1 - 16} width={12} height={TY2 - TY1 + 26}
          rx={5} fill={C.atpSyn} fillOpacity={0.88} />
        <text x={ATSX} y={TY1 - 20} textAnchor="middle" fontSize={6.5} fontWeight={700}
          fill={C.atpSyn} fontFamily="system-ui">ATP</text>
        <text x={ATSX} y={TY1 - 11} textAnchor="middle" fontSize={6.5} fontWeight={700}
          fill={C.atpSyn} fontFamily="system-ui">synthase</text>
      </g>
      {s.atpLRCount > 0.1 && (
        <g opacity={Math.min(s.atpLRCount / 2, 1)}>
          <circle cx={ATSX + 19} cy={TY1 - 14} r={12} fill={C.atp} fillOpacity={0.9} />
          <text x={ATSX + 19} y={TY1 - 10} textAnchor="middle" fontSize={8} fontWeight={700}
            fill="white" fontFamily="system-ui">ATP</text>
        </g>
      )}

      {/* ── Handoff: ATP + NADPH cross midline into stroma ── */}
      {s.handoffOp > 0.01 && (
        <g opacity={s.handoffOp}>
          <path d={`M 244 100 C 249 100, 255 110, ${260 + s.handoffX * 42} 114`}
            fill="none" stroke={C.nadph} strokeWidth={2}
            markerEnd="url(#ps-arr-nadph)" />
          <path d={`M ${ATSX + 19} ${TY1 - 2} C ${ATSX + 32} ${TY1 + 12}, 255 ${TY1 + 18}, ${260 + s.handoffX * 42} ${TY1 + 22}`}
            fill="none" stroke={C.atp} strokeWidth={2}
            markerEnd="url(#ps-arr-atp)" />
          {s.handoffX > 0.45 && (
            <text x={270 + s.handoffX * 42} y={TY1 + 20} fontSize={7.5} fontWeight={700}
              fill={C.atp} fontFamily="system-ui">ATP</text>
          )}
        </g>
      )}

      {/* ── RuBP (5C, enters RuBisCO) ── */}
      <g opacity={s.rupOp}>
        <circle cx={RUPX} cy={RUPY} r={17} fill={C.rup} fillOpacity={0.88} />
        <text x={RUPX} y={RUPY - 2} textAnchor="middle" fontSize={7.5} fontWeight={700}
          fill="white" fontFamily="system-ui">RuBP</text>
        <text x={RUPX} y={RUPY + 8} textAnchor="middle" fontSize={6} fill="white" fontFamily="system-ui">(5C)</text>
        <path d={`M ${RUPX + 12} ${RUPY - 10} C ${RUPX + 38} ${RUPY - 58}, ${RUBX - 22} ${RUBY + 22}, ${RUBX - 18} ${RUBY + 11}`}
          fill="none" stroke={C.rup} strokeWidth={1.5}
          strokeDasharray="4 2" markerEnd="url(#ps-arr-g3p)" opacity={0.55} />
      </g>

      {/* ── RuBisCO (carbon fixation enzyme) ── */}
      <g opacity={s.rubiscoOp}>
        <ellipse cx={RUBX} cy={RUBY} rx={30} ry={17} fill={C.rubisco} fillOpacity={0.88} />
        <text x={RUBX} y={RUBY - 2} textAnchor="middle" fontSize={7.5} fontWeight={700}
          fill="white" fontFamily="system-ui">RuBisCO</text>
        <text x={RUBX} y={RUBY + 8} textAnchor="middle" fontSize={6} fill="white"
          fontFamily="system-ui" opacity={0.85}>carbon fixation</text>
        <path d={`M ${RUBX + 18} ${RUBY + 8} C ${RUBX + 46} ${RUBY + 36}, ${PGAX - 22} ${PGAY - 28}, ${PGAX - 12} ${PGAY - 12}`}
          fill="none" stroke={C.rubisco} strokeWidth={1.5}
          strokeDasharray="3 2" markerEnd="url(#ps-arr-mol)" opacity={0.5} />
      </g>

      {/* ── 3-PGA ── */}
      <g opacity={s.pgaOp}>
        <circle cx={PGAX} cy={PGAY} r={15} fill={C.pga} fillOpacity={0.88} />
        <text x={PGAX} y={PGAY - 1} textAnchor="middle" fontSize={7.5} fontWeight={700}
          fill="white" fontFamily="system-ui">3-PGA</text>
        <text x={PGAX} y={PGAY + 9} textAnchor="middle" fontSize={6} fill="white" fontFamily="system-ui">(3C)</text>
        <path d={`M ${PGAX + 6} ${PGAY + 10} C ${PGAX + 22} ${PGAY + 38}, ${G3PX - 18} ${G3PY - 28}, ${G3PX - 12} ${G3PY - 13}`}
          fill="none" stroke={C.pga} strokeWidth={1.5}
          strokeDasharray="3 2" markerEnd="url(#ps-arr-mol)" opacity={0.5} />
      </g>

      {/* ── G3P ── */}
      <g opacity={s.g3pOp}>
        <circle cx={G3PX} cy={G3PY} r={15} fill={C.g3p} fillOpacity={0.92} />
        <text x={G3PX} y={G3PY - 1} textAnchor="middle" fontSize={7.5} fontWeight={700}
          fill="#1a1a1a" fontFamily="system-ui">G3P</text>
        <text x={G3PX} y={G3PY + 9} textAnchor="middle" fontSize={6} fill="#333" fontFamily="system-ui">(3C)</text>
        {/* Exit: 1 G3P → glucose */}
        <path d={`M ${G3PX + 12} ${G3PY - 5} C ${G3PX + 34} ${G3PY - 22}, ${G3PX + 50} ${G3PY - 30}, ${G3PX + 56} ${G3PY - 40}`}
          fill="none" stroke={C.g3p} strokeWidth={1.5}
          markerEnd="url(#ps-arr-g3p)" opacity={0.65} />
        {s.turnCount > 2.5 && (
          <text x={G3PX + 62} y={G3PY - 44} fontSize={7} fontWeight={700}
            fill={C.g3p} fontFamily="system-ui">→ glucose</text>
        )}
        {/* Regeneration: G3P → RuBP */}
        <path d={`M ${G3PX - 12} ${G3PY + 7} C ${G3PX - 58} ${G3PY + 32}, ${RUPX + 32} ${RUPY + 26}, ${RUPX + 15} ${RUPY + 9}`}
          fill="none" stroke={C.g3p} strokeWidth={1.5}
          strokeDasharray="4 2" markerEnd="url(#ps-arr-g3p)" opacity={0.42} />
      </g>

      {/* ── Turn counter ── */}
      {s.turnCount > 0.1 && (
        <g>
          <rect x={302} y={248} width={88} height={28} rx={8}
            fill="#f0fdf4" stroke="#bbf7d0" strokeWidth={1} />
          <text x={346} y={260} textAnchor="middle" fontSize={8} fontWeight={700}
            fill="#166534" fontFamily="system-ui">Turn {Math.min(Math.round(s.turnCount), 3)} / 3</text>
          <text x={346} y={271} textAnchor="middle" fontSize={6.5} fill="#4ade80" fontFamily="system-ui">
            3 CO₂ → 1 net G3P
          </text>
        </g>
      )}

      {/* ── CO₂ molecule tracker ── */}
      {s.co2Op > 0.01 && (
        <g opacity={s.co2Op}>
          <circle cx={s.co2X} cy={s.co2Y} r={12} fill={C.co2} fillOpacity={0.92} />
          <text x={s.co2X} y={s.co2Y + 4} textAnchor="middle" fontSize={8} fontWeight={700}
            fill="white" fontFamily="system-ui">CO₂</text>
        </g>
      )}

      {/* ── Overall equation ── */}
      <text x={CX} y={291} textAnchor="middle" fontSize={7.5} fill="#9ca3af" fontFamily="system-ui">
        6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂
      </text>
    </svg>
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────
export function PhotosynthesisViewer() {
  const { progress, setProgress } = usePSContext();
  const dragging = useRef(false);
  const startX   = useRef(0);
  const startP   = useRef(0);
  const anim     = useRef<AnimationPlaybackControls | null>(null);
  const mv       = useMotionValue(0);

  useMotionValueEvent(mv, "change", (v) => setProgress(v));

  function snapTo(target: number) {
    anim.current?.stop();
    anim.current = animate(mv, target, { type: "spring", stiffness: 260, damping: 28 });
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    startP.current = mv.get();
    anim.current?.stop();
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
    <div className="rounded-2xl border border-zinc-100 bg-white overflow-hidden select-none">
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
                : "text-zinc-400 hover:text-zinc-700"
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
      <p className="py-2 text-center text-xs text-zinc-400">
        Drag left/right, use arrow keys, or click a tab to explore
      </p>
    </div>
  );
}

// ─── Info panel ───────────────────────────────────────────────────────────────
export function PhotosynthesisPanel() {
  const { progress } = usePSContext();
  const stage = Math.round(Math.max(0, Math.min(progress, KF.length - 1)));
  const s = STAGES[stage];

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-6 space-y-4">
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
          {s.location}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">{s.heading}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.sub}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Inputs</div>
          <div className="text-sm font-semibold text-zinc-700">{s.inputs}</div>
        </div>
        <div className="rounded-xl bg-zinc-50 px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Outputs</div>
          <div className="text-sm font-semibold text-zinc-700">{s.outputs}</div>
        </div>
      </div>

      {s.note && (
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-zinc-700">{s.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── Emblem (lesson card thumbnail) ──────────────────────────────────────────
export function PhotosynthesisEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      <ellipse cx={60} cy={40} rx={54} ry={34} fill="#d1fae5" stroke="#16a34a" strokeWidth={2} />
      <rect x={20} y={33} width={40} height={14} rx={4} fill="#059669" opacity={0.7} />
      <text x={60} y={44} textAnchor="middle" fontSize={9} fontWeight={800} fill="#065f46" fontFamily="system-ui">
        Photosynthesis
      </text>
    </svg>
  );
}
