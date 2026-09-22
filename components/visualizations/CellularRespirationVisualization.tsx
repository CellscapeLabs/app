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
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";
import type React from "react";
import { lerp, fadeLerp, q } from "@/lib/scrub";
import { PredictionPrompt, type Prediction } from "@/components/lessons/PredictionPrompt";
import { VIZ_FRAME } from "@/components/visualizations/vizChrome";

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

// ─── Interpolated state ───────────────────────────────────────────────────────
interface CRState {
  // Region highlights (0 = off, 1 = full) — fills, so they blend linearly
  cytoHL:    number;
  matrixHL:  number;
  membHL:    number;

  // Element opacities — cross-faded so stages never double-expose
  glucOp:        number;
  pyrOp:         number;
  glycoLabelOp:  number;
  matrixLabelOp: number;
  acetylOp:      number;
  krebsOp:       number;
  co2Op:         number;
  etcOp:         number;
  hplusOp:       number;

  // Pyruvate × 2 position (symmetric about CY)
  pyrX:  number;
  pyrDY: number;

  // Running totals
  atpCount:   number;
  nadhCount:  number;
  fadh2Count: number;
}

const FADE_KEYS = new Set<keyof CRState>([
  "glucOp", "pyrOp", "glycoLabelOp", "matrixLabelOp", "acetylOp", "krebsOp", "co2Op", "etcOp", "hplusOp",
]);

function lerpState(a: CRState, b: CRState, t: number): CRState {
  const out = { ...a };
  (Object.keys(a) as (keyof CRState)[]).forEach((k) => {
    out[k] = FADE_KEYS.has(k) ? fadeLerp(a[k], b[k], t) : lerp(a[k], b[k], t);
  });
  return out;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────
// Cell (CX, CY) rx=186 ry=114. The mitochondrion sits right of centre so the
// cytoplasm on the left has room for glycolysis. Everything stays above the
// running-totals strip at y=252.
const CX = 200, CY = 126;
const CELL_RX = 186, CELL_RY = 114;
const MX = 236;
const MITO_RX = 114, MITO_RY = 80;
const INNER_RX = 84, INNER_RY = 54;
const GLUC_X = 66;                     // glycolysis happens here, in the cytoplasm
const KX = MX + 4, KR = 34;            // Krebs cycle ring

function onEllipse(rx: number, ry: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: q(MX + rx * Math.cos(a)), y: q(CY + ry * Math.sin(a)) };
}

// H⁺ ions in the intermembrane space, spaced between the four e⁻ arrows
const HPLUS_POS = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((d) => onEllipse(99, 67, d));
const SYNTHASE = onEllipse(INNER_RX, INNER_RY, 135);

const krebsStart = { x: q(KX + KR * Math.cos(-Math.PI / 3)), y: q(CY + KR * Math.sin(-Math.PI / 3)) };
const krebsEnd   = { x: q(KX + KR * Math.cos((4 * Math.PI) / 3)), y: q(CY + KR * Math.sin((4 * Math.PI) / 3)) };
const KREBS_ARC  = `M ${krebsStart.x},${krebsStart.y} A ${KR},${KR} 0 1,1 ${krebsEnd.x},${krebsEnd.y}`;

// ─── Keyframes ────────────────────────────────────────────────────────────────
const CS: CRState[] = [
  // 0 — Glucose
  { cytoHL:0,    matrixHL:0,   membHL:0,
    glucOp:1,    pyrOp:0,      glycoLabelOp:0, matrixLabelOp:1,
    acetylOp:0,  krebsOp:0,    co2Op:0,        etcOp:0,  hplusOp:0,
    pyrX:GLUC_X, pyrDY:0,
    atpCount:0,  nadhCount:0,  fadh2Count:0 },
  // 1 — Glycolysis: glucose splits into two pyruvate in the cytoplasm
  { cytoHL:1,    matrixHL:0,   membHL:0,
    glucOp:0,    pyrOp:1,      glycoLabelOp:1, matrixLabelOp:1,
    acetylOp:0,  krebsOp:0,    co2Op:0,        etcOp:0,  hplusOp:0,
    pyrX:GLUC_X, pyrDY:23,
    atpCount:2,  nadhCount:2,  fadh2Count:0 },
  // 2 — Krebs Cycle: pyruvate heads into the matrix and becomes acetyl-CoA
  { cytoHL:0,    matrixHL:1,   membHL:0,
    glucOp:0,    pyrOp:0,      glycoLabelOp:0, matrixLabelOp:0,
    acetylOp:1,  krebsOp:1,    co2Op:1,        etcOp:0,  hplusOp:0,
    pyrX:150,    pyrDY:14,
    atpCount:4,  nadhCount:10, fadh2Count:2 },
  // 3 — ETC
  { cytoHL:0,    matrixHL:0,   membHL:1,
    glucOp:0,    pyrOp:0,      glycoLabelOp:0, matrixLabelOp:0,
    acetylOp:0,  krebsOp:0,    co2Op:0,        etcOp:1,  hplusOp:1,
    pyrX:150,    pyrDY:14,
    atpCount:36, nadhCount:10, fadh2Count:2 },
];

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
        <text x={cx} y={cy + 9} textAnchor="middle" fontSize={7} fontWeight={500}
          fill="white" fontFamily="system-ui" pointerEvents="none">{sub}</text>
      )}
    </g>
  );
}

// ─── Interpolated cell diagram ────────────────────────────────────────────────
function InterpolatedDiagram({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(progress, CS.length - 1));
  const fi = Math.min(Math.floor(clamped), CS.length - 2);
  const s  = lerpState(CS[fi], CS[fi + 1], clamped - fi);

  const atp  = Math.round(s.atpCount);
  const nadh = Math.round(s.nadhCount);
  const fad  = Math.round(s.fadh2Count);

  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" aria-label="Cellular respiration diagram">
      <defs>
        {/* Cytoplasm mask: inside cell, outside mito */}
        <mask id="cr-cyto-mask">
          <ellipse cx={CX} cy={CY} rx={CELL_RX} ry={CELL_RY} fill="white" />
          <ellipse cx={MX} cy={CY} rx={MITO_RX} ry={MITO_RY} fill="black" />
        </mask>

        {/* Arrow markers — sized in user space so thick strokes don't inflate them */}
        <marker id="cr-arr-e" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L0,9 L9,4.5 z" fill={C.electron} />
        </marker>
        <marker id="cr-arr-k" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
          <path d="M0,0 L0,9 L9,4.5 z" fill={C.mito} />
        </marker>
        <marker id="cr-arr-h" markerUnits="userSpaceOnUse" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M0,0 L0,7 L7,3.5 z" fill={C.hplus} />
        </marker>
      </defs>

      {/* ── Cytoplasm highlight ── */}
      {s.cytoHL > 0.01 && (
        <rect x={0} y={0} width={400} height={252}
          fill={C.cell} fillOpacity={s.cytoHL * 0.1} mask="url(#cr-cyto-mask)" />
      )}

      {/* ── Cell outer membrane ── */}
      <ellipse cx={CX} cy={CY} rx={CELL_RX} ry={CELL_RY}
        fill="rgba(16,185,129,0.04)" stroke={C.cell} strokeWidth={2.5} strokeDasharray="10 5" />

      {/* ── Mitochondrion outer membrane ── */}
      <ellipse cx={MX} cy={CY} rx={MITO_RX} ry={MITO_RY}
        fill="rgba(245,158,11,0.05)" stroke={C.mito} strokeWidth={2} />

      {/* ── Matrix highlight ── */}
      {s.matrixHL > 0.01 && (
        <ellipse cx={MX} cy={CY} rx={INNER_RX} ry={INNER_RY}
          fill={C.mito} fillOpacity={s.matrixHL * 0.12} />
      )}

      {/* ── Inner membrane (cristae) ── */}
      <ellipse cx={MX} cy={CY} rx={INNER_RX} ry={INNER_RY}
        fill="none"
        stroke={C.inner}
        strokeWidth={lerp(1.5, 4, s.membHL)}
        strokeOpacity={lerp(0.35, 1, s.membHL)} />

      {/* ── Region labels — each in its own gap between membranes ── */}
      <text x={MX} y={34} textAnchor="middle" fontSize={9} fontWeight={700} fill={C.cell}
        fontFamily="system-ui" opacity={0.7} letterSpacing={0.5}>CYTOPLASM</text>
      <text x={MX} y={225} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={C.mito}
        fontFamily="system-ui" opacity={0.8} letterSpacing={0.5}>MITOCHONDRION</text>
      {s.matrixLabelOp > 0.01 && (
        <text x={MX} y={CY + 3} textAnchor="middle" fontSize={9} fontWeight={600}
          fill={C.inner} fontFamily="system-ui" opacity={0.45 * s.matrixLabelOp}>MATRIX</text>
      )}

      {/* ── Stage 1: glucose → 2 pyruvate, in the cytoplasm ── */}
      <Mol cx={GLUC_X} cy={CY} r={22} color={C.glucose} label="C₆H₁₂O₆" sub="Glucose" op={s.glucOp} />
      <Mol cx={s.pyrX} cy={CY - s.pyrDY} r={16} color={C.pyruvate} label="Pyr" sub="C₃" op={s.pyrOp} />
      <Mol cx={s.pyrX} cy={CY + s.pyrDY} r={16} color={C.pyruvate} label="Pyr" sub="C₃" op={s.pyrOp} />
      {s.glycoLabelOp > 0.01 && (
        <text x={GLUC_X + 12} y={180} textAnchor="middle" fontSize={10} fontWeight={800} fill={C.cell}
          fontFamily="system-ui" opacity={s.glycoLabelOp}>Glycolysis</text>
      )}

      {/* ── Stage 2: acetyl-CoA feeds the Krebs cycle; CO₂ released ── */}
      <Mol cx={182} cy={CY} r={15} color={C.acetyl} label="AcCoA" sub="×2" op={s.acetylOp} />
      {s.krebsOp > 0.01 && (
        <g opacity={s.krebsOp}>
          <path d={KREBS_ARC} fill="none" stroke={C.mito} strokeWidth={2.5} markerEnd="url(#cr-arr-k)" />
          <text x={KX} y={CY - 2} textAnchor="middle" fontSize={9} fontWeight={800}
            fill={C.mito} fontFamily="system-ui">Krebs</text>
          <text x={KX} y={CY + 9} textAnchor="middle" fontSize={9} fontWeight={800}
            fill={C.mito} fontFamily="system-ui">cycle</text>
        </g>
      )}
      <Mol cx={296} cy={CY - 18} r={11} color={C.co2} label="CO₂" op={s.co2Op} />
      <Mol cx={296} cy={CY + 18} r={11} color={C.co2} label="CO₂" op={s.co2Op} />

      {/* ── Stage 3: electron transport chain on the inner membrane ── */}
      {s.etcOp > 0.01 && (
        <g opacity={s.etcOp} fontFamily="system-ui">
          {/* Electron flow, clockwise along the membrane */}
          <line x1={MX - 14} y1={CY - INNER_RY} x2={MX + 14} y2={CY - INNER_RY}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />
          <line x1={MX + INNER_RX} y1={CY - 14} x2={MX + INNER_RX} y2={CY + 14}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />
          <line x1={MX + 14} y1={CY + INNER_RY} x2={MX - 14} y2={CY + INNER_RY}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />
          <line x1={MX - INNER_RX} y1={CY + 14} x2={MX - INNER_RX} y2={CY - 14}
            stroke={C.electron} strokeWidth={2} markerEnd="url(#cr-arr-e)" />

          <text x={MX} y={CY - 36} textAnchor="middle" fontSize={8} fontWeight={700} fill={C.inner}>
            Inner membrane
          </text>
          <text x={MX + INNER_RX - 10} y={CY + 3} textAnchor="end" fontSize={9} fontWeight={700} fill={C.electron}>e⁻</text>

          {/* Payoff */}
          <text x={MX - 12} y={CY + 2} textAnchor="middle" fontSize={13} fontWeight={900} fill={C.atp}>+32 ATP</text>

          {/* O₂ is the final electron acceptor */}
          <circle cx={262} cy={CY + 22} r={10} fill={C.co2} fillOpacity={0.18} stroke={C.co2} strokeWidth={1} />
          <text x={262} y={CY + 25} textAnchor="middle" fontSize={7.5} fontWeight={700} fill="#64748b">O₂</text>
          <text x={276} y={CY + 25} fontSize={8} fontWeight={600} fill="#64748b">→ H₂O</text>

          {/* ATP synthase: H⁺ flows back into the matrix */}
          <circle cx={SYNTHASE.x} cy={SYNTHASE.y} r={8} fill={C.atp} fillOpacity={0.25} stroke={C.atp} strokeWidth={1.5} />
          <line x1={SYNTHASE.x - 12} y1={SYNTHASE.y + 12} x2={SYNTHASE.x - 5} y2={SYNTHASE.y + 5}
            stroke={C.hplus} strokeWidth={1.5} markerEnd="url(#cr-arr-h)" />
          <text x={SYNTHASE.x + 14} y={SYNTHASE.y - 4} fontSize={7.5} fontWeight={700} fill={C.atp}>ATP synthase</text>
        </g>
      )}

      {/* ── H⁺ gradient in the intermembrane space ── */}
      {s.hplusOp > 0.01 && HPLUS_POS.map((pos, i) => (
        <g key={i} opacity={s.hplusOp}>
          <circle cx={pos.x} cy={pos.y} r={8}
            fill={C.hplus} fillOpacity={0.18} stroke={C.hplus} strokeWidth={1} />
          <text x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize={8} fontWeight={800}
            fill={C.hplus} fontFamily="system-ui" pointerEvents="none">H⁺</text>
        </g>
      ))}

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
  // Springing between stages is decorative; reduced-motion users get the end state directly.
  const reduceMotion = useReducedMotion();

  function springTo(target: number) {
    animRef.current?.stop();
    if (reduceMotion) { progress.set(target); return; }
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
    <div className={VIZ_FRAME}>
      {/* Stage tabs */}
      <div className="grid border-b border-zinc-100" style={{ gridTemplateColumns: `repeat(${STAGE_COUNT}, 1fr)` }}>
        {STAGES.map((st, i) => (
          <button key={st.name} onClick={() => springTo(i)}
            className={`py-2.5 text-[11px] font-semibold leading-tight px-1 transition-colors ${
              snapIdx === i ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50"
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
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-600 select-none pointer-events-none">
            ← drag right to advance stages →
          </p>
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-right text-[10px] font-semibold text-zinc-600 select-none pointer-events-none leading-tight">
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
            <span className="w-16 shrink-0 text-[10px] font-semibold text-zinc-600 select-none pointer-events-none leading-tight">
              {STAGES[STAGE_COUNT - 1].name}
            </span>
          </div>
          <div className="mt-2 flex justify-between px-[4.75rem]">
            {STAGES.map((_, i) => (
              <button key={i} onClick={() => springTo(i)}
                className={`text-[10px] font-medium transition-colors ${snapIdx === i ? "text-zinc-700 font-bold" : "text-zinc-300 hover:text-zinc-700"}`}>
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
// ─── Predictions — asked on a stage, answered by the next one ────────────────
const PREDICTIONS: Partial<Record<number, Prediction>> = {
  0: {
    question: "Where in the cell do you think glucose starts to be broken down?",
    options: ["Inside the mitochondrion", "In the cytoplasm", "In the nucleus"],
    correct: 1,
    explanation: "Glycolysis happens in the cytoplasm and doesn't need oxygen — that's why even bacteria without mitochondria can do it.",
  },
  1: {
    question: "Pyruvate now enters the mitochondrion. Which gas will the Krebs cycle release?",
    options: ["CO₂", "O₂", "N₂"],
    correct: 0,
    explanation: "Every carbon atom from glucose leaves as CO₂ during the prep reaction and the Krebs cycle — it's the CO₂ you breathe out.",
  },
  2: {
    question: "Which stage do you predict makes the most ATP?",
    options: ["Glycolysis", "The Krebs cycle", "The electron transport chain"],
    correct: 2,
    explanation: "About 32 of the ~36 ATP come from the electron transport chain, where the H⁺ gradient drives ATP synthase.",
  },
};

export function CellularRespirationPanel() {
  const { snapIdx, progressPct, cur, springTo } = useCRCtx();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const prediction = PREDICTIONS[snapIdx];
  return (
    <div className={VIZ_FRAME}>
      <div className="p-5" style={{ background: cur.accentBg }}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cur.accent }}>
              Stage {snapIdx + 1} of {STAGE_COUNT}
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-zinc-900">{cur.name}</h3>
            <p className="text-sm text-zinc-700">{cur.subtitle}</p>
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
        {prediction && (
          <PredictionPrompt key={snapIdx} {...prediction} selected={answers[snapIdx]}
            onSelect={(i) => setAnswers((prev) => ({ ...prev, [snapIdx]: i }))}
            onContinue={() => springTo(Math.min(STAGE_COUNT - 1, snapIdx + 1))} />
        )}
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
// A mitochondrion (folded cristae inside) releasing ATP.
export function CellularRespirationEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -2 120 106" className={className} aria-hidden="true">
      <g transform="rotate(-18 56 46)">
        {/* Outer membrane */}
        <rect x={8} y={20} width={96} height={52} rx={26} fill="#fef3c7" stroke={C.mito} strokeWidth={3} />
        {/* Inner membrane + matrix */}
        <rect x={16} y={27} width={80} height={38} rx={19} fill="#fde68a" stroke={C.inner} strokeWidth={2} />
        {/* Cristae — folds of the inner membrane reaching into the matrix */}
        <g stroke={C.inner} strokeWidth={2.5} strokeLinecap="round">
          {[30, 50, 70].map((x) => (
            <line key={`t${x}`} x1={x} y1={28} x2={x} y2={46} />
          ))}
          {[40, 60, 80].map((x) => (
            <line key={`b${x}`} x1={x} y1={64} x2={x} y2={46} />
          ))}
        </g>
      </g>

      {/* ATP released */}
      {([[100, 14, 9], [111, 34, 7], [86, 5, 5.5]] as const).map(([cx, cy, r]) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill={C.atp} />
          {r > 6 && (
            <text x={cx} y={cy + r * 0.3} textAnchor="middle" fontSize={r * 0.72} fontWeight={800}
              fill="white" fontFamily="system-ui">ATP</text>
          )}
        </g>
      ))}
    </svg>
  );
}
