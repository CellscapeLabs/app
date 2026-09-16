"use client";
/*
 * Biology concept: Cellular Respiration — ATP Production
 * Three-stage breakdown of glucose (C₆H₁₂O₆) + O₂ → CO₂ + H₂O + ~36–38 ATP:
 *   Stage 1 Glycolysis (cytoplasm): glucose → 2 pyruvate, net 2 ATP, 2 NADH
 *   Stage 2 Krebs Cycle (mitochondrial matrix): pyruvate → CO₂, 2 ATP, 6 NADH, 2 FADH₂
 *   Stage 3 ETC (inner mitochondrial membrane): NADH/FADH₂ → H⁺ gradient → ~32 ATP via ATP synthase
 * Interactions: Drag right to advance stages, left to go back. The cell cross-section
 * transitions smoothly between compartments — cytoplasm lights up for glycolysis, the
 * matrix for Krebs, the inner membrane for ETC. Molecule icons and running totals update
 * continuously as you scrub.
 */

import { useState, useRef, createContext, useContext, useEffect } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
} from "framer-motion";
import type React from "react";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  cell:     "#10b981",   // emerald — outer cell membrane
  mito:     "#f59e0b",   // amber — mitochondrial outer membrane
  inner:    "#8b5cf6",   // violet — inner membrane / cristae
  glucose:  "#eab308",   // yellow
  pyruvate: "#f97316",   // orange
  acetyl:   "#fb923c",   // light orange
  co2:      "#94a3b8",   // slate
  atp:      "#10b981",   // emerald
  nadh:     "#3b82f6",   // blue
  fadh2:    "#8b5cf6",   // violet
  hplus:    "#f43f5e",   // rose
  electron: "#1e293b",   // dark
};

// ─── Lerp helpers ─────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Interpolated state ───────────────────────────────────────────────────────
interface CRState {
  // Region highlights (0 = off, 1 = full)
  cytoHL:    number;
  matrixHL:  number;
  membHL:    number;

  // Glucose molecule
  glucX:  number;
  glucOp: number;

  // Pyruvate × 2 (symmetric about CY)
  pyrX:  number;
  pyrDY: number;  // y-offset from center: one at CY-pyrDY, one at CY+pyrDY
  pyrOp: number;

  // Acetyl-CoA, CO₂, Krebs, ETC
  acetylOp:   number;
  co2Op:      number;
  krebsOp:    number;
  etcOp:      number;
  hplusOp:    number;

  // Running totals
  atpCount:   number;
  nadhCount:  number;
  fadh2Count: number;
}

function lerpState(a: CRState, b: CRState, t: number): CRState {
  return {
    cytoHL:    lerp(a.cytoHL,    b.cytoHL,    t),
    matrixHL:  lerp(a.matrixHL,  b.matrixHL,  t),
    membHL:    lerp(a.membHL,    b.membHL,    t),
    glucX:     lerp(a.glucX,     b.glucX,     t),
    glucOp:    lerp(a.glucOp,    b.glucOp,    t),
    pyrX:      lerp(a.pyrX,      b.pyrX,      t),
    pyrDY:     lerp(a.pyrDY,     b.pyrDY,     t),
    pyrOp:     lerp(a.pyrOp,     b.pyrOp,     t),
    acetylOp:  lerp(a.acetylOp,  b.acetylOp,  t),
    co2Op:     lerp(a.co2Op,     b.co2Op,     t),
    krebsOp:   lerp(a.krebsOp,   b.krebsOp,   t),
    etcOp:     lerp(a.etcOp,     b.etcOp,     t),
    hplusOp:   lerp(a.hplusOp,   b.hplusOp,   t),
    atpCount:  lerp(a.atpCount,  b.atpCount,  t),
    nadhCount: lerp(a.nadhCount, b.nadhCount, t),
    fadh2Count:lerp(a.fadh2Count,b.fadh2Count,t),
  };
}

// ─── Keyframes ────────────────────────────────────────────────────────────────
// Cell center: CX=200, CY=140
// Cell outer: rx=182, ry=126
// Mito outer: rx=118, ry=80  (center 200,140)
// Inner membrane: rx=86, ry=55

const CS: CRState[] = [
  // 0 — Glucose
  { cytoHL:0,    matrixHL:0,    membHL:0,
    glucX:38,    glucOp:1,
    pyrX:110,    pyrDY:28,      pyrOp:0,
    acetylOp:0,  co2Op:0,       krebsOp:0,   etcOp:0,   hplusOp:0,
    atpCount:0,  nadhCount:0,   fadh2Count:0 },
  // 1 — Glycolysis
  { cytoHL:1,    matrixHL:0,    membHL:0,
    glucX:75,    glucOp:0.18,
    pyrX:112,    pyrDY:28,      pyrOp:1,
    acetylOp:0,  co2Op:0,       krebsOp:0,   etcOp:0,   hplusOp:0,
    atpCount:2,  nadhCount:2,   fadh2Count:0 },
  // 2 — Krebs Cycle
  { cytoHL:0.15, matrixHL:1,    membHL:0,
    glucX:75,    glucOp:0,
    pyrX:132,    pyrDY:12,      pyrOp:0.28,
    acetylOp:1,  co2Op:1,       krebsOp:1,   etcOp:0,   hplusOp:0,
    atpCount:4,  nadhCount:8,   fadh2Count:2 },
  // 3 — ETC
  { cytoHL:0.08, matrixHL:0.2,  membHL:1,
    glucX:75,    glucOp:0,
    pyrX:132,    pyrDY:12,      pyrOp:0,
    acetylOp:0.18,co2Op:0.45,  krebsOp:0.28, etcOp:1,  hplusOp:1,
    atpCount:36, nadhCount:10,  fadh2Count:2 },
];

// ─── H⁺ positions in intermembrane space ─────────────────────────────────────
// Between inner (rx=86,ry=55) and outer (rx=118,ry=80) mito membranes, cx=200,cy=140
// Using midpoint radii rx≈102, ry≈67
const HPLUS_POS = [
  { x:302, y:140 }, { x:272, y: 93 }, { x:200, y: 73 }, { x:128, y: 93 },
  { x: 98, y:140 }, { x:128, y:187 }, { x:200, y:207 }, { x:272, y:187 },
] as const;

// ─── Molecule label ───────────────────────────────────────────────────────────
interface MolProps { cx: number; cy: number; r: number; color: string; label: string; sub?: string; op?: number; }
function Mol({ cx, cy, r, color, label, sub, op = 1 }: MolProps) {
  if (op < 0.01) return null;
  const fs = Math.max(7, r * 0.38);
  return (
    <g opacity={op}>
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.9} />
      <text x={cx} y={cy + (sub ? -2 : fs * 0.38)} textAnchor="middle"
        fontSize={fs} fontWeight={700} fill="white" fontFamily="system-ui" pointerEvents="none">{label}</text>
      {sub && (
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={7} fontWeight={500}
          fill="white" fontFamily="system-ui" pointerEvents="none">{sub}</text>
      )}
    </g>
  );
}

// ─── Interpolated cell diagram ────────────────────────────────────────────────
function InterpolatedDiagram({ progress, viewBox: vb = "0 0 400 280" }: { progress: number; viewBox?: string }) {
  const clamped = Math.max(0, Math.min(progress, CS.length - 1));
  const fi = Math.min(Math.floor(clamped), CS.length - 2);
  const t  = clamped - fi;
  const s  = lerpState(CS[fi], CS[Math.min(fi + 1, CS.length - 1)], t);

  const CX = 200;
  const CY = 140;
  const atp  = Math.round(s.atpCount);
  const nadh = Math.round(s.nadhCount);
  const fad  = Math.round(s.fadh2Count);

  // Krebs cycle: nearly-complete arc path (clockwise) centered at (CX, CY), r=38
  const KR = 38;
  const krebsArc = `M ${CX},${CY - KR} A ${KR},${KR} 0 1,1 ${CX - 1},${CY - KR}`;

  return (
    <svg viewBox={vb} className="w-full h-full" aria-label="Cellular respiration diagram">
      <defs>
        {/* Cytoplasm mask: inside cell, outside mito */}
        <mask id="cr-cyto-mask">
          <ellipse cx={CX} cy={CY} rx={182} ry={126} fill="white" />
          <ellipse cx={CX} cy={CY} rx={118} ry={80}  fill="black" />
        </mask>

        {/* Arrow markers */}
        <marker id="cr-arr-g" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={C.atp} />
        </marker>
        <marker id="cr-arr-e" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={C.electron} />
        </marker>
        <marker id="cr-arr-k" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={C.mito} />
        </marker>
        <marker id="cr-arr-co2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={C.co2} />
        </marker>
      </defs>

      {/* ── Cytoplasm highlight ── */}
      {s.cytoHL > 0.01 && (
        <rect x={0} y={0} width={400} height={280}
          fill="#10b981" fillOpacity={s.cytoHL * 0.1} mask="url(#cr-cyto-mask)" />
      )}

      {/* ── Cell outer membrane ── */}
      <ellipse cx={CX} cy={CY} rx={182} ry={126}
        fill="rgba(16,185,129,0.04)" stroke={C.cell} strokeWidth={2.5} strokeDasharray="10 5" />

      {/* ── Mitochondrion outer membrane ── */}
      <ellipse cx={CX} cy={CY} rx={118} ry={80}
        fill="rgba(245,158,11,0.05)" stroke={C.mito} strokeWidth={2} />

      {/* ── Matrix highlight ── */}
      {s.matrixHL > 0.01 && (
        <ellipse cx={CX} cy={CY} rx={86} ry={55}
          fill="#f59e0b" fillOpacity={s.matrixHL * 0.12} />
      )}

      {/* ── Inner membrane (cristae) ── */}
      <ellipse cx={CX} cy={CY} rx={86} ry={55}
        fill="none"
        stroke={C.inner}
        strokeWidth={lerp(1.5, 4, s.membHL)}
        strokeOpacity={lerp(0.35, 1, s.membHL)} />

      {/* ── Static region labels ── */}
      <text x={62}  y={62}  fontSize={10} fontWeight={700} fill={C.cell}
        fontFamily="system-ui" opacity={0.55} letterSpacing={0.5}>CYTOPLASM</text>
      <text x={148} y={72}  fontSize={9}  fontWeight={600} fill={C.mito}
        fontFamily="system-ui" opacity={0.6}>MITOCHONDRION</text>
      <text x={CX}  y={CY + 4} textAnchor="middle" fontSize={9} fontWeight={600}
        fill={C.inner} fontFamily="system-ui" opacity={lerp(0.35, 0.0, s.krebsOp)}>MATRIX</text>

      {/* ── Glucose molecule ── */}
      <Mol cx={s.glucX} cy={CY} r={22} color={C.glucose} label="C₆H₁₂O₆" sub="Glucose" op={s.glucOp} />

      {/* ── Glycolysis arrow (glucose → cell interior) ── */}
      {s.glucOp > 0.3 && (
        <line x1={s.glucX + 24} y1={CY} x2={s.glucX + 44} y2={CY}
          stroke={C.atp} strokeWidth={1.5} strokeDasharray="4 3"
          markerEnd="url(#cr-arr-g)" opacity={s.glucOp * 0.7} />
      )}

      {/* ── Pyruvate × 2 ── */}
      <Mol cx={s.pyrX} cy={CY - s.pyrDY} r={16} color={C.pyruvate} label="Pyr" sub="C₃" op={s.pyrOp} />
      <Mol cx={s.pyrX} cy={CY + s.pyrDY} r={16} color={C.pyruvate} label="Pyr" sub="C₃" op={s.pyrOp} />

      {/* ── Arrows from pyruvate into mitochondrion ── */}
      {s.pyrOp > 0.15 && s.pyrX > 118 && (
        <>
          <line x1={s.pyrX + 18} y1={CY - s.pyrDY} x2={s.pyrX + 38} y2={CY - s.pyrDY * 0.3}
            stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="3 3" markerEnd="url(#cr-arr-k)"
            opacity={s.pyrOp * 0.5} />
          <line x1={s.pyrX + 18} y1={CY + s.pyrDY} x2={s.pyrX + 38} y2={CY + s.pyrDY * 0.3}
            stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="3 3" markerEnd="url(#cr-arr-k)"
            opacity={s.pyrOp * 0.5} />
        </>
      )}

      {/* ── Acetyl-CoA × 2 in matrix ── */}
      <Mol cx={CX - 28} cy={CY - 14} r={13} color={C.acetyl} label="AcCoA" op={s.acetylOp} />
      <Mol cx={CX + 28} cy={CY + 14} r={13} color={C.acetyl} label="AcCoA" op={s.acetylOp} />

      {/* ── CO₂ bubbles drifting out of matrix ── */}
      {s.co2Op > 0.01 && (
        <>
          <Mol cx={CX - 50} cy={CY - 68} r={10} color={C.co2} label="CO₂" op={s.co2Op} />
          <Mol cx={CX}      cy={CY - 74} r={10} color={C.co2} label="CO₂" op={s.co2Op * 0.9} />
          <Mol cx={CX + 50} cy={CY - 68} r={10} color={C.co2} label="CO₂" op={s.co2Op * 0.8} />
          {/* Arrows from matrix to intermembrane space */}
          <line x1={CX - 50} y1={CY - 58} x2={CX - 50} y2={CY - 46}
            stroke={C.co2} strokeWidth={1} strokeDasharray="3 2" markerEnd="url(#cr-arr-co2)"
            opacity={s.co2Op * 0.6} />
          <line x1={CX} y1={CY - 64} x2={CX} y2={CY - 52}
            stroke={C.co2} strokeWidth={1} strokeDasharray="3 2" markerEnd="url(#cr-arr-co2)"
            opacity={s.co2Op * 0.6} />
        </>
      )}

      {/* ── Krebs cycle arc ── */}
      {s.krebsOp > 0.01 && (
        <g opacity={s.krebsOp}>
          <path d={krebsArc} fill="none" stroke={C.mito} strokeWidth={2.5} />
          {/* Clockwise arrowhead at the end of the arc (near top-right) */}
          <polygon
            points={`${CX - 1},${CY - KR} ${CX - 9},${CY - KR + 7} ${CX + 6},${CY - KR + 3}`}
            fill={C.mito} />
          {/* "Krebs Cycle" label in center */}
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize={9} fontWeight={800}
            fill={C.mito} fontFamily="system-ui">Krebs</text>
          <text x={CX} y={CY + 8} textAnchor="middle" fontSize={9} fontWeight={800}
            fill={C.mito} fontFamily="system-ui">Cycle</text>
        </g>
      )}

      {/* ── ETC: electron flow arrows around inner membrane ── */}
      {s.etcOp > 0.01 && (
        <g opacity={s.etcOp}>
          {/* Top → right (arrow at top pointing right) */}
          <line x1={186} y1={85} x2={214} y2={85}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />
          {/* Right → bottom (arrow at right pointing down) */}
          <line x1={286} y1={126} x2={286} y2={154}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />
          {/* Bottom → left (arrow at bottom pointing left) */}
          <line x1={214} y1={195} x2={186} y2={195}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />
          {/* Left → top (arrow at left pointing up) */}
          <line x1={114} y1={154} x2={114} y2={126}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />
          {/* "e⁻" label near right arrow */}
          <text x={296} y={143} fontSize={9} fontWeight={700} fill={C.electron} fontFamily="system-ui">e⁻</text>
          {/* ATP synthase badge at bottom of inner membrane */}
          <rect x={185} y={200} width={30} height={16} rx={8}
            fill={C.atp} fillOpacity={0.18} stroke={C.atp} strokeWidth={1.2} />
          <text x={200} y={212} textAnchor="middle" fontSize={8} fontWeight={800}
            fill={C.atp} fontFamily="system-ui">ATP-S</text>
          {/* H⁺ flow arrow downward through ATP synthase */}
          <line x1={200} y1={170} x2={200} y2={198}
            stroke={C.hplus} strokeWidth={1.5} strokeDasharray="3 2" markerEnd="url(#cr-arr-e)" />
          {/* "O₂" label at Complex IV position (right side) */}
          <circle cx={282} cy={168} r={9} fill={C.co2} fillOpacity={0.18} stroke={C.co2} strokeWidth={1} />
          <text x={282} y={172} textAnchor="middle" fontSize={7} fontWeight={700}
            fill={C.co2} fontFamily="system-ui">O₂</text>
          <text x={330} y={165} fontSize={8} fontWeight={600} fill={C.co2}
            fontFamily="system-ui">→ H₂O</text>
        </g>
      )}

      {/* ── H⁺ dots in intermembrane space ── */}
      {s.hplusOp > 0.01 && HPLUS_POS.map((pos, i) => (
        <g key={i} opacity={s.hplusOp * (0.75 + 0.25 * (i % 2))}>
          <circle cx={pos.x} cy={pos.y} r={8}
            fill={C.hplus} fillOpacity={0.18} stroke={C.hplus} strokeWidth={1} />
          <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={8} fontWeight={800}
            fill={C.hplus} fontFamily="system-ui" pointerEvents="none">H⁺</text>
        </g>
      ))}

      {/* ── Glycolysis label when active ── */}
      {s.cytoHL > 0.4 && (
        <text x={68} y={185} fontSize={11} fontWeight={800} fill={C.cell}
          fontFamily="system-ui" opacity={Math.min(s.cytoHL, 1)}>Glycolysis</text>
      )}

      {/* ── Krebs "Matrix" label when not showing cycle ── */}
      {s.matrixHL > 0.4 && s.krebsOp < 0.5 && (
        <text x={CX} y={CY + 5} textAnchor="middle" fontSize={10} fontWeight={700}
          fill={C.mito} fontFamily="system-ui">Matrix</text>
      )}

      {/* ── Inner membrane label during ETC ── */}
      {s.membHL > 0.4 && (
        <text x={CX} y={75} textAnchor="middle" fontSize={9} fontWeight={700}
          fill={C.inner} fontFamily="system-ui" opacity={s.membHL}>
          Inner Membrane (Cristae)
        </text>
      )}

      {/* ── Running totals strip at bottom ── */}
      <rect x={0} y={252} width={400} height={28} fill="white" fillOpacity={0.92} />
      <line x1={0} y1={252} x2={400} y2={252} stroke="#f1f5f9" strokeWidth={1} />

      {/* ATP */}
      <text x={42} y={270} textAnchor="middle" fontSize={9} fontWeight={600}
        fill="#94a3b8" fontFamily="system-ui">ATP</text>
      <text x={80} y={271} textAnchor="middle" fontSize={15} fontWeight={900}
        fill={C.atp} fontFamily="system-ui">{atp}</text>

      {/* NADH */}
      <text x={150} y={270} textAnchor="middle" fontSize={9} fontWeight={600}
        fill="#94a3b8" fontFamily="system-ui">NADH</text>
      <text x={188} y={271} textAnchor="middle" fontSize={15} fontWeight={900}
        fill={C.nadh} fontFamily="system-ui">{nadh}</text>

      {/* FADH₂ */}
      <text x={256} y={270} textAnchor="middle" fontSize={9} fontWeight={600}
        fill="#94a3b8" fontFamily="system-ui">FADH₂</text>
      <text x={294} y={271} textAnchor="middle" fontSize={15} fontWeight={900}
        fill={C.fadh2} fontFamily="system-ui">{fad}</text>

      {/* Total label */}
      <text x={358} y={270} textAnchor="middle" fontSize={8.5} fontWeight={600}
        fill="#94a3b8" fontFamily="system-ui">running total</text>
    </svg>
  );
}

// ─── Stage metadata ───────────────────────────────────────────────────────────
const STAGES = [
  {
    name:      "Glucose",
    subtitle:  "The starting material",
    accent:    "#eab308",
    accentBg:  "rgba(234,179,8,0.08)",
    dotClass:  "bg-yellow-500",
    description: "One glucose molecule (C₆H₁₂O₆) enters cellular respiration. All of its chemical energy will be extracted across three sequential stages. By the end, all 6 carbons will have been released as CO₂, and ~36 ATP will have been produced.",
    keyPoints: [
      "Glucose contains 6 carbons and significant stored chemical energy",
      "Overall equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~36–38 ATP",
      "All three stages are needed to extract the full ATP yield — glycolysis alone gives just 2",
    ],
  },
  {
    name:      "Glycolysis",
    subtitle:  "Cytoplasm · Net 2 ATP",
    accent:    "#f97316",
    accentBg:  "rgba(249,115,22,0.08)",
    dotClass:  "bg-orange-500",
    description: "Glycolysis splits one glucose (6C) into two pyruvate (3C each) in the cytoplasm. An energy investment of 2 ATP activates the glucose; the payoff phase then produces 4 ATP and 2 NADH. Net gain: 2 ATP. No oxygen required.",
    keyPoints: [
      "Location: cytoplasm — no mitochondria needed, works in both aerobic and anaerobic conditions",
      "Energy investment: 2 ATP consumed to phosphorylate and activate glucose",
      "Payoff: 4 ATP + 2 NADH produced as 2 G3P are oxidized to 2 pyruvate",
      "Net: 2 ATP · 2 NADH · 2 pyruvate — pyruvate then enters the mitochondrion",
    ],
  },
  {
    name:      "Krebs Cycle",
    subtitle:  "Mitochondrial Matrix · Net 2 ATP",
    accent:    "#f59e0b",
    accentBg:  "rgba(245,158,11,0.08)",
    dotClass:  "bg-amber-500",
    description: "Each pyruvate is first converted to Acetyl-CoA (losing one carbon as CO₂). Acetyl-CoA then enters the Krebs cycle in the mitochondrial matrix. The cycle runs twice per glucose, stripping electrons onto NADH and FADH₂ to power the ETC.",
    keyPoints: [
      "Prep reaction: each pyruvate (C₃) → Acetyl-CoA (C₂) + CO₂ + NADH — happens twice",
      "Each cycle turn: 3 NADH + 1 FADH₂ + 1 ATP (as GTP) + 2 CO₂ released",
      "Two turns total: 6 NADH + 2 FADH₂ + 2 ATP from the cycle itself",
      "Combined with prep: 8 NADH, 2 FADH₂, 2 ATP, all 6 carbons released as CO₂",
      "AP exam: CO₂ you exhale comes from the Krebs cycle, not glycolysis",
    ],
  },
  {
    name:      "Electron Transport Chain",
    subtitle:  "Inner Membrane · ~32 ATP",
    accent:    "#8b5cf6",
    accentBg:  "rgba(139,92,246,0.08)",
    dotClass:  "bg-violet-500",
    description: "NADH and FADH₂ donate electrons to protein complexes in the inner mitochondrial membrane. As electrons pass through, H⁺ ions are pumped into the intermembrane space. The resulting H⁺ gradient drives ATP synthase — like water spinning a turbine — producing ~32 ATP. Oxygen is the final electron acceptor.",
    keyPoints: [
      "Location: inner mitochondrial membrane (cristae) — the most productive stage by far",
      "NADH → Complex I; FADH₂ → Complex II (bypasses Complex I, so produces fewer ATP)",
      "H⁺ pumped into intermembrane space by Complexes I, III, and IV",
      "H⁺ flows back through ATP synthase (chemiosmosis) → ~32 ATP",
      "O₂ is the final electron acceptor: O₂ + 4H⁺ + 4e⁻ → 2H₂O — without it, the chain halts",
      "AP exam: cyanide blocks Complex IV, stopping the entire ETC",
    ],
  },
] as const;

const STAGE_COUNT  = STAGES.length;
const DRAG_PER_STAGE = 108;

// ─── Shared context ───────────────────────────────────────────────────────────
interface CRCtxValue {
  clampedProgress: number;
  snapIdx:         number;
  progressPct:     number;
  cur:             (typeof STAGES)[number];
  springTo:        (target: number) => void;
  setProgressDirect: (value: number) => void;
  animRef:         React.MutableRefObject<AnimationPlaybackControls | null>;
}

const CRCtx = createContext<CRCtxValue | null>(null);
function useCRCtx() {
  const ctx = useContext(CRCtx);
  if (!ctx) throw new Error("Must be inside CellularRespirationProvider");
  return ctx;
}

export function CellularRespirationProvider({ children }: { children: React.ReactNode }) {
  const progress = useMotionValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  useMotionValueEvent(progress, "change", setDisplayProgress);
  const animRef = useRef<AnimationPlaybackControls | null>(null);

  function springTo(target: number) {
    animRef.current?.stop();
    animRef.current = animate(progress, target, { type: "spring", stiffness: 380, damping: 30 });
  }
  function setProgressDirect(value: number) {
    animRef.current?.stop();
    progress.set(value);
  }

  const clamped = Math.max(0, Math.min(displayProgress, STAGE_COUNT - 1));
  const snapIdx = Math.round(clamped);

  return (
    <CRCtx.Provider value={{
      clampedProgress: clamped,
      snapIdx,
      progressPct: (clamped / (STAGE_COUNT - 1)) * 100,
      cur: STAGES[snapIdx],
      springTo, setProgressDirect, animRef,
    }}>
      {children}
    </CRCtx.Provider>
  );
}

// ─── CellularRespirationViewer ────────────────────────────────────────────────
export function CellularRespirationViewer() {
  const { clampedProgress, snapIdx, progressPct, cur, springTo, setProgressDirect, animRef } = useCRCtx();

  const [isDragging,      setIsDragging]      = useState(false);
  const [hasEverDragged,  setHasEverDragged]  = useState(false);
  const dragStartX          = useRef(0);
  const progressAtDragStart = useRef(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") { e.preventDefault(); springTo(Math.min(STAGE_COUNT - 1, snapIdx + 1)); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); springTo(Math.max(0, snapIdx - 1)); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [snapIdx, springTo]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    animRef.current?.stop();
    dragStartX.current = e.clientX;
    progressAtDragStart.current = clampedProgress;
    setIsDragging(true);
    setHasEverDragged(true);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const raw = progressAtDragStart.current + (e.clientX - dragStartX.current) / DRAG_PER_STAGE;
    setProgressDirect(Math.max(0, Math.min(STAGE_COUNT - 1, raw)));
  }
  function onPointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    springTo(Math.round(clampedProgress));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Stage tabs */}
      <div className="grid border-b border-zinc-100" style={{ gridTemplateColumns: `repeat(${STAGE_COUNT}, 1fr)` }}>
        {STAGES.map((st, i) => (
          <button key={st.name} onClick={() => springTo(i)}
            className={`py-2.5 text-[11px] font-semibold leading-tight px-1 transition-colors ${
              snapIdx === i ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
            }`}>
            {st.name}
          </button>
        ))}
      </div>

      {/* Drag zone */}
      <div
        className="select-none"
        style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="relative bg-gradient-to-br from-zinc-50 to-white">
          <div className="relative w-full" style={{ aspectRatio: "400 / 280" }}>
            <InterpolatedDiagram progress={clampedProgress} />
          </div>
          {!hasEverDragged && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2.5 rounded-full bg-black/55 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span aria-hidden="true">←</span>drag to explore stages<span aria-hidden="true">→</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrub bar */}
        <div className="border-t border-zinc-100 bg-white px-5 pt-4 pb-5">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-400 select-none pointer-events-none">
            ← drag right to advance stages →
          </p>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-right text-[10px] font-semibold text-zinc-400 select-none pointer-events-none leading-tight">
              {STAGES[0].name}
            </span>
            <div className="relative flex-1 h-3 rounded-full bg-zinc-100"
              style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full transition-none"
                style={{ width: `${progressPct}%`, backgroundColor: cur.accent }} />
              {STAGES.map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${(i / (STAGE_COUNT - 1)) * 100}%`, background: "rgba(255,255,255,0.75)" }} />
              ))}
              <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white transition-none"
                style={{ left: `${progressPct}%`, border: `2.5px solid ${cur.accent}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                  <path d="M1 6H15" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4.5 2.5L1 6L4.5 9.5" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.5 2.5L15 6L11.5 9.5" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span className="w-16 shrink-0 text-[10px] font-semibold text-zinc-400 select-none pointer-events-none leading-tight">
              {STAGES[STAGE_COUNT - 1].name}
            </span>
          </div>
          <div className="mt-2 flex justify-between px-[4.75rem]">
            {STAGES.map((_, i) => (
              <button key={i} onClick={() => springTo(i)}
                className={`text-[10px] font-medium transition-colors ${snapIdx === i ? "text-zinc-700 font-bold" : "text-zinc-300 hover:text-zinc-500"}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CellularRespirationPanel ─────────────────────────────────────────────────
export function CellularRespirationPanel() {
  const { snapIdx, progressPct, cur, springTo } = useCRCtx();
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="p-5" style={{ background: cur.accentBg }}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cur.accent }}>
              Stage {snapIdx + 1} of {STAGE_COUNT}
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-zinc-900">{cur.name}</h3>
            <p className="text-sm text-zinc-500">{cur.subtitle}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => springTo(Math.max(0, snapIdx - 1))} disabled={snapIdx === 0}
              className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30">
              ← Prev
            </button>
            <button onClick={() => springTo(Math.min(STAGE_COUNT - 1, snapIdx + 1))} disabled={snapIdx === STAGE_COUNT - 1}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-zinc-600">{cur.description}</p>
        <ul className="space-y-1.5">
          {cur.keyPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-700">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cur.dotClass}`} />
              {pt}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-zinc-100 px-5 py-3">
        <div className="mb-2 h-1 w-full rounded-full bg-zinc-100">
          <div className="h-full rounded-full transition-none"
            style={{ width: `${progressPct}%`, backgroundColor: cur.accent }} />
        </div>
        <div className="flex justify-center gap-1.5">
          {STAGES.map((_, i) => (
            <button key={i} onClick={() => springTo(i)} aria-label={`Go to ${STAGES[i].name}`}
              className={`h-2 rounded-full transition-all ${snapIdx === i ? "w-6 bg-zinc-800" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CellularRespirationAnimation — single-column wrapper ─────────────────────
export function CellularRespirationAnimation() {
  return (
    <CellularRespirationProvider>
      <div className="space-y-3">
        <CellularRespirationViewer />
        <CellularRespirationPanel />
      </div>
    </CellularRespirationProvider>
  );
}

// ─── Emblem (lesson card thumbnail) ──────────────────────────────────────────
// Shows the Krebs Cycle stage of the interpolated diagram.
export function CellularRespirationEmblem({ className }: { className?: string }) {
  return (
    <div className={className ?? "w-full h-full"}>
      <InterpolatedDiagram progress={2} viewBox="60 40 280 220" />
    </div>
  );
}
