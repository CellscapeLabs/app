"use client";
// Biology concept: Osmosis & Diffusion — osmosis is the passive movement of water
// molecules across a semipermeable membrane from a region of lower solute concentration
// to higher. Diffusion is the broader principle: net movement of any molecule down its
// concentration gradient until equilibrium is reached.
// Interactions:
//   Chamber tab — two sliders set solute concentration on each side; animated water
//     molecules cross the aquaporin membrane toward the hypertonic side; live status readout.
//   Cell tab — one slider sets external solute concentration; the cell visually swells
//     (hypotonic), stays normal (isotonic), or shrivels (hypertonic) with spring animation.

import { useState, useRef } from "react";
import { motion, useAnimationFrame } from "framer-motion";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  water:    "#3b82f6",
  solute:   "#f97316",
  membrane: "#7c3aed",
  cell:     "#10b981",
  cellFill: "#ecfdf5",
};

// ─── SVG dimensions ───────────────────────────────────────────────────────────

const W  = 560;
const H  = 300;
const MX = W / 2; // membrane x

// ─── Static particle grid (20 per side) ──────────────────────────────────────

const LEFT_GRID: ReadonlyArray<{ x: number; y: number }> = [
  { x: 55,  y: 45  }, { x: 97,  y: 45  }, { x: 137, y: 45  }, { x: 178, y: 45  },
  { x: 68,  y: 95  }, { x: 108, y: 95  }, { x: 148, y: 95  }, { x: 188, y: 95  },
  { x: 55,  y: 148 }, { x: 97,  y: 148 }, { x: 137, y: 148 }, { x: 178, y: 148 },
  { x: 68,  y: 200 }, { x: 108, y: 200 }, { x: 148, y: 200 }, { x: 188, y: 200 },
  { x: 55,  y: 252 }, { x: 97,  y: 252 }, { x: 137, y: 252 }, { x: 178, y: 252 },
];

const RIGHT_GRID: ReadonlyArray<{ x: number; y: number }> = LEFT_GRID.map(p => ({
  x: p.x + MX,
  y: p.y,
}));

// ─── Y-positions for crossing water molecules (8 slots) ───────────────────────

const CROSS_YS = [52, 88, 124, 160, 196, 232, 70, 142] as const;
const MAX_CROSS = CROSS_YS.length;

// ─── Fixed internal molecule positions for cell view ─────────────────────────
// Radii are ≤ 42 so they fit inside even the smallest cell (r≈48).

const INT_MOL: ReadonlyArray<{ r: number; angle: number }> = [
  { r: 24, angle: 0   }, { r: 36, angle: 60  }, { r: 27, angle: 120 },
  { r: 40, angle: 180 }, { r: 22, angle: 240 }, { r: 34, angle: 300 },
  { r: 30, angle: 30  }, { r: 20, angle: 90  }, { r: 38, angle: 150 },
  { r: 28, angle: 210 },
];

// ─── Deterministic jitter ────────────────────────────────────────────────────

function jit(seed: number, mag: number): number {
  return (((seed * 2654435761) >>> 0) % (mag * 2 + 1)) - mag;
}

// ─── Molecule (animated group) ────────────────────────────────────────────────

interface MoleculeProps {
  cx: number; cy: number; r: number;
  color: string; label: string; seed: number;
}

function Molecule({ cx, cy, r, color, label, seed }: MoleculeProps) {
  return (
    <motion.g
      animate={{
        x: [0, jit(seed * 7, 3), 0, jit(seed * 13, 3), 0],
        y: [0, jit(seed * 11, 3), 0, jit(seed * 5,  3), 0],
      }}
      transition={{ duration: 2 + (seed % 5) * 0.35, repeat: Infinity, ease: "linear" }}
    >
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.85} />
      <text x={cx} y={cy + r * 0.45} textAnchor="middle" fontSize={r < 6 ? 6 : 7}
        fontWeight={700} fill="white" fontFamily="system-ui, sans-serif" pointerEvents="none">
        {label}
      </text>
    </motion.g>
  );
}

// ─── Semipermeable membrane ───────────────────────────────────────────────────

function Membrane() {
  const poreYs = [H * 0.25, H * 0.5, H * 0.75];
  return (
    <g>
      <rect x={MX - 5} y={0} width={10} height={H} fill={C.membrane} fillOpacity={0.07} />
      <line x1={MX - 3} y1={0} x2={MX - 3} y2={H}
        stroke={C.membrane} strokeWidth={2} strokeOpacity={0.5} strokeDasharray="9 6" />
      <line x1={MX + 3} y1={0} x2={MX + 3} y2={H}
        stroke={C.membrane} strokeWidth={2} strokeOpacity={0.5} strokeDasharray="9 6" strokeDashoffset={15} />
      {poreYs.map((py, i) => (
        <g key={i}>
          <rect x={MX - 9} y={py - 9} width={18} height={18} rx={4}
            fill={C.membrane} fillOpacity={0.2} stroke={C.membrane} strokeWidth={1.5} />
          <text x={MX} y={py + 4} textAnchor="middle" fontSize={8} fontWeight={800}
            fill={C.membrane} fontFamily="system-ui, sans-serif">AQP</text>
        </g>
      ))}
      <text x={MX} y={H - 6} textAnchor="middle" fontSize={11} fontWeight={600}
        fill={C.membrane} opacity={0.7} fontFamily="system-ui, sans-serif">
        semipermeable membrane
      </text>
    </g>
  );
}

// ─── Chamber view ─────────────────────────────────────────────────────────────

interface ChamberViewProps {
  leftSolute: number; rightSolute: number;
  crossPhases: ReadonlyArray<number>;
}

function ChamberView({ leftSolute, rightSolute, crossPhases }: ChamberViewProps) {
  const leftN  = Math.round(leftSolute  / 10 * 20);
  const rightN = Math.round(rightSolute / 10 * 20);

  const gradient  = rightSolute - leftSolute;
  const direction = gradient > 0 ? "lr" : gradient < 0 ? "rl" : null;
  const activeN   = Math.min(Math.ceil(Math.abs(gradient) * 0.7), MAX_CROSS);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label="Two chambers separated by a semipermeable membrane">
      <defs>
        <marker id="osm-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={C.water} />
        </marker>
      </defs>

      {/* Chamber tints — deepen with solute */}
      <rect x={0}  y={0} width={MX} height={H}
        fill="#fff7ed" fillOpacity={0.25 + leftSolute  * 0.05} />
      <rect x={MX} y={0} width={MX} height={H}
        fill="#fff7ed" fillOpacity={0.25 + rightSolute * 0.05} />

      <text x={MX / 2}       y={16} textAnchor="middle" fontSize={12} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif" letterSpacing={0.8}>LEFT CHAMBER</text>
      <text x={MX + MX / 2}  y={16} textAnchor="middle" fontSize={12} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif" letterSpacing={0.8}>RIGHT CHAMBER</text>

      <Membrane />

      {/* Left molecules */}
      {LEFT_GRID.map(({ x, y }, i) => {
        const isSolute = i < leftN;
        return (
          <Molecule key={`L${i}`} cx={x} cy={y}
            r={isSolute ? 7 : 5}
            color={isSolute ? C.solute : C.water}
            label={isSolute ? "S" : "W"}
            seed={i} />
        );
      })}

      {/* Right molecules */}
      {RIGHT_GRID.map(({ x, y }, i) => {
        const isSolute = i < rightN;
        return (
          <Molecule key={`R${i}`} cx={x} cy={y}
            r={isSolute ? 7 : 5}
            color={isSolute ? C.solute : C.water}
            label={isSolute ? "S" : "W"}
            seed={i + 20} />
        );
      })}

      {/* Crossing water molecules */}
      {direction !== null && CROSS_YS.slice(0, activeN).map((crossY, i) => {
        const phase  = crossPhases[i] ?? 0;
        const startX = direction === "lr" ? MX + 10 : MX - 10;
        const endX   = direction === "lr" ? W - 22  : 22;
        const x      = startX + (endX - startX) * phase;
        const opacity = phase < 0.12 ? phase / 0.12 : phase > 0.88 ? (1 - phase) / 0.12 : 1;
        return (
          <g key={`X${i}`} opacity={opacity}>
            <circle cx={x} cy={crossY} r={5} fill={C.water} />
            <text x={x} y={crossY + 3.5} textAnchor="middle" fontSize={6}
              fontWeight={700} fill="white" fontFamily="system-ui, sans-serif" pointerEvents="none">
              W
            </text>
          </g>
        );
      })}

      {/* Net flow indicator */}
      {direction !== null ? (
        <g>
          <path
            d={direction === "lr"
              ? `M ${MX + 14} ${H / 2 - 20} L ${MX + 54} ${H / 2 - 20}`
              : `M ${MX - 14} ${H / 2 - 20} L ${MX - 54} ${H / 2 - 20}`}
            stroke={C.water} strokeWidth={2.5} fill="none" markerEnd="url(#osm-arr)" />
          <text
            x={direction === "lr" ? MX + 34 : MX - 34}
            y={H / 2 - 30}
            textAnchor="middle" fontSize={11} fontWeight={700}
            fill={C.water} fontFamily="system-ui, sans-serif">
            net H₂O flow
          </text>
        </g>
      ) : (
        <g>
          <text x={MX} y={H / 2 - 20} textAnchor="middle" fontSize={14} fontWeight={700}
            fill="#94a3b8" fontFamily="system-ui, sans-serif">⇌ Equilibrium</text>
          <text x={MX} y={H / 2 - 4} textAnchor="middle" fontSize={11}
            fill="#94a3b8" fontFamily="system-ui, sans-serif">no net water movement</text>
        </g>
      )}
    </svg>
  );
}

// ─── Cell view ────────────────────────────────────────────────────────────────

const INT_SOLUTE  = 5;
const NORMAL_R    = 76;
const CELL_CX     = W / 2;
const CELL_CY     = H / 2 + 8;
const ARROW_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315].map(d => d * Math.PI / 180);

interface CellViewProps { extSolute: number }

function CellView({ extSolute }: CellViewProps) {
  const gradient = extSolute - INT_SOLUTE;
  const tonicity = gradient >  0.5 ? "hypertonic"
                 : gradient < -0.5 ? "hypotonic"
                 : "isotonic";

  const cellR = Math.max(48, Math.min(112, NORMAL_R - gradient * 5.2));
  const tonicityColor = tonicity === "hypertonic" ? "#ef4444"
                      : tonicity === "hypotonic"  ? "#3b82f6"
                      : "#10b981";

  const waterDir = gradient >  0.5 ? "out"
                 : gradient < -0.5 ? "in"
                 : null;

  // External solute positions (golden-angle spiral outside cell)
  const extN = Math.round(extSolute * 3);
  const extDots = Array.from({ length: extN }, (_, i) => {
    const angle = i * 2.399;
    const dist  = cellR + 24 + (i % 4) * 13;
    return {
      x: Math.max(14, Math.min(W - 14, CELL_CX + Math.cos(angle) * dist)),
      y: Math.max(14, Math.min(H - 14, CELL_CY + Math.sin(angle) * dist)),
    };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
      aria-label={`Cell in ${tonicity} solution`}>
      <defs>
        <marker id="cell-arr" markerWidth="6" markerHeight="6" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L0,5 L6,2.5 z" fill={C.water} />
        </marker>
      </defs>

      {/* Solution background */}
      <rect x={0} y={0} width={W} height={H} fill="#eff6ff" fillOpacity={0.35} />
      <text x={W - 10} y={16} textAnchor="end" fontSize={12} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif" letterSpacing={0.8}>SOLUTION</text>

      {/* External solute */}
      {extDots.map(({ x, y }, i) => (
        <Molecule key={`ES${i}`} cx={x} cy={y} r={6} color={C.solute} label="S" seed={i + 40} />
      ))}

      {/* Water arrows */}
      {waterDir !== null && ARROW_ANGLES.map((angle, i) => {
        const arrowLen = 18;
        const memX = CELL_CX + Math.cos(angle) * cellR;
        const memY = CELL_CY + Math.sin(angle) * cellR;
        const dx = Math.cos(angle) * arrowLen;
        const dy = Math.sin(angle) * arrowLen;
        const x1 = waterDir === "in" ? memX + dx : memX - dx * 0.55;
        const y1 = waterDir === "in" ? memY + dy : memY - dy * 0.55;
        const x2 = waterDir === "in" ? memX       : memX + dx;
        const y2 = waterDir === "in" ? memY       : memY + dy;
        return (
          <motion.line key={`WA${i}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.water} strokeWidth={2.2} strokeLinecap="round"
            markerEnd="url(#cell-arr)"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
        );
      })}

      {/* Normal-size reference ring */}
      <circle cx={CELL_CX} cy={CELL_CY} r={NORMAL_R}
        fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 4" opacity={0.25} />
      <text x={CELL_CX + NORMAL_R + 5} y={CELL_CY - 3} fontSize={10} fill="#94a3b8"
        fontFamily="system-ui, sans-serif">normal</text>

      {/* Cell membrane — spring-animated radius */}
      <motion.circle
        cx={CELL_CX} cy={CELL_CY}
        animate={{ r: cellR }}
        transition={{ type: "spring", stiffness: 55, damping: 12 }}
        fill={C.cellFill} stroke={C.cell} strokeWidth={3} />

      {/* Internal solute molecules (fixed positions, always inside) */}
      {INT_MOL.map(({ r, angle }, i) => {
        const rad = angle * Math.PI / 180;
        return (
          <Molecule key={`IS${i}`}
            cx={CELL_CX + Math.cos(rad) * r}
            cy={CELL_CY + Math.sin(rad) * r}
            r={6} color={C.solute} label="S" seed={i + 60} />
        );
      })}

      {/* Tonicity badge — top-left corner, clear of the external-solute spiral */}
      <rect x={8} y={8} width={112} height={28} rx={14}
        fill={tonicityColor} fillOpacity={0.12} />
      <rect x={8} y={8} width={112} height={28} rx={14}
        stroke={tonicityColor} strokeWidth={1.5} fill="none" />
      <text x={64} y={26} textAnchor="middle" fontSize={13} fontWeight={800}
        fill={tonicityColor} fontFamily="system-ui, sans-serif">
        {tonicity.toUpperCase()}
      </text>
    </svg>
  );
}

// ─── Status readouts ──────────────────────────────────────────────────────────

function ChamberStatus({ leftSolute, rightSolute }: { leftSolute: number; rightSolute: number }) {
  const gradient = rightSolute - leftSolute;
  const status = gradient > 0
    ? `Net flow: Left → Right   (right is hypertonic — less water, pulls water in)`
    : gradient < 0
    ? `Net flow: Right → Left   (left is hypertonic — less water, pulls water in)`
    : `Equilibrium — concentrations equal, no net water movement`;

  return (
    <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-3.5">
      <div className="mb-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="font-semibold text-zinc-400">Left solute</p>
          <p className="text-lg font-black text-orange-500">{leftSolute}<span className="text-xs text-zinc-400">/10</span></p>
        </div>
        <div>
          <p className="font-semibold text-zinc-400">Gradient</p>
          <p className={`text-lg font-black ${Math.abs(gradient) > 0 ? "text-blue-500" : "text-zinc-300"}`}>
            {gradient > 0 ? `+${gradient}` : gradient}
          </p>
        </div>
        <div>
          <p className="font-semibold text-zinc-400">Right solute</p>
          <p className="text-lg font-black text-orange-500">{rightSolute}<span className="text-xs text-zinc-400">/10</span></p>
        </div>
      </div>
      <p className="text-center text-xs text-zinc-500">{status}</p>
    </div>
  );
}

function CellStatus({ extSolute }: { extSolute: number }) {
  const gradient = extSolute - INT_SOLUTE;
  const tonicity = gradient >  0.5 ? "hypertonic"
                 : gradient < -0.5 ? "hypotonic"
                 : "isotonic";
  const desc = tonicity === "hypertonic"
    ? "External solute > internal — water leaves the cell via osmosis. Cell shrivels (crenation)."
    : tonicity === "hypotonic"
    ? "External solute < internal — water enters the cell via osmosis. Cell swells, may burst (lysis)."
    : "Concentrations equal — no net osmosis. Cell maintains its normal volume.";
  const color = tonicity === "hypertonic" ? "text-red-500"
              : tonicity === "hypotonic"  ? "text-blue-500"
              : "text-emerald-500";

  return (
    <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-3.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`text-sm font-black uppercase tracking-wider ${color}`}>{tonicity}</span>
        <span className="text-xs text-zinc-400">
          External: {extSolute}/10 · Internal (fixed): {INT_SOLUTE}/10
        </span>
      </div>
      <p className="text-xs leading-relaxed text-zinc-500">{desc}</p>
    </div>
  );
}

// ─── OsmosisViewer (main exported component) ──────────────────────────────────

type ViewTab = "chamber" | "cell";

export function OsmosisViewer() {
  const [tab,          setTab]          = useState<ViewTab>("chamber");
  const [leftSolute,   setLeftSolute]   = useState(7);
  const [rightSolute,  setRightSolute]  = useState(3);
  const [extSolute,    setExtSolute]    = useState(8);

  const [crossPhases, setCrossPhases] = useState<number[]>(
    () => Array.from({ length: MAX_CROSS }, (_, i) => i / MAX_CROSS),
  );
  const prevDirRef = useRef<"lr" | "rl" | null>(null);

  const gradient  = rightSolute - leftSolute;
  const direction = gradient > 0 ? "lr" : gradient < 0 ? "rl" : null;
  const activeN   = Math.min(Math.ceil(Math.abs(gradient) * 0.7), MAX_CROSS);

  useAnimationFrame((_time, delta) => {
    if (tab !== "chamber" || direction === null || activeN === 0) return;
    if (direction !== prevDirRef.current) {
      prevDirRef.current = direction;
      setCrossPhases(Array.from({ length: MAX_CROSS }, (_, i) => i / MAX_CROSS));
      return;
    }
    const speed = 0.00032 + Math.abs(gradient) * 0.00003;
    setCrossPhases(prev => {
      const next = [...prev];
      for (let i = 0; i < activeN; i++) next[i] = (next[i] + delta * speed) % 1;
      return next;
    });
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      {/* View tabs */}
      <div className="flex border-b border-zinc-100">
        {(["chamber", "cell"] as const).map(id => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors
              ${tab === id
                ? "border-b-2 border-emerald-500 bg-emerald-50/60 text-emerald-600"
                : "text-zinc-400 hover:text-zinc-700"}`}
            aria-pressed={tab === id}
          >
            {id === "chamber" ? "Osmosis Chamber" : "Cell in Solution"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "chamber" ? (
          <>
            <ChamberView
              leftSolute={leftSolute}
              rightSolute={rightSolute}
              crossPhases={crossPhases}
            />
            <div className="mt-4 grid grid-cols-2 gap-5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-zinc-600">
                  Left solute: <span className="text-orange-500">{leftSolute}/10</span>
                </span>
                <input type="range" min={0} max={10} step={1}
                  value={leftSolute}
                  onChange={e => setLeftSolute(Number(e.target.value))}
                  className="w-full accent-orange-500"
                  aria-label="Left chamber solute concentration" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-zinc-600">
                  Right solute: <span className="text-orange-500">{rightSolute}/10</span>
                </span>
                <input type="range" min={0} max={10} step={1}
                  value={rightSolute}
                  onChange={e => setRightSolute(Number(e.target.value))}
                  className="w-full accent-orange-500"
                  aria-label="Right chamber solute concentration" />
              </label>
            </div>
            <ChamberStatus leftSolute={leftSolute} rightSolute={rightSolute} />
          </>
        ) : (
          <>
            <CellView extSolute={extSolute} />
            <div className="mt-4">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-zinc-600">
                  External solute: <span className="text-orange-500">{extSolute}/10</span>
                  <span className="ml-2 text-zinc-400">· Internal (fixed): 5/10</span>
                </span>
                <input type="range" min={0} max={10} step={1}
                  value={extSolute}
                  onChange={e => setExtSolute(Number(e.target.value))}
                  className="w-full accent-orange-500"
                  aria-label="External solute concentration" />
                <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
                  <span>0 — hypotonic</span>
                  <span>5 — isotonic</span>
                  <span>10 — hypertonic</span>
                </div>
              </label>
            </div>
            <CellStatus extSolute={extSolute} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── OsmosisInfoPanel ─────────────────────────────────────────────────────────

type InfoTab = "diffusion" | "osmosis" | "tonicity";

interface InfoTabData {
  id: InfoTab;
  label: string;
  accentClass: string;
  bgClass: string;
  dotClass: string;
  heading: string;
  body: string;
  points: ReadonlyArray<string>;
}

const INFO_TABS: ReadonlyArray<InfoTabData> = [
  {
    id: "diffusion",
    label: "Diffusion",
    accentClass: "text-emerald-700",
    bgClass: "bg-emerald-50",
    dotClass: "bg-emerald-500",
    heading: "Diffusion — molecules seek equilibrium",
    body: "All molecules are in constant random motion. When more molecules occupy one region than another, random collisions statistically produce a net flow from the crowded side to the sparse side. This is diffusion: net movement down a concentration gradient, requiring no energy input.",
    points: [
      "Driven entirely by kinetic energy of molecules — no ATP required",
      "Continues until concentrations equalize (dynamic equilibrium)",
      "Rate scales with gradient steepness and temperature",
      "Applies to gases, liquids, and dissolved solutes",
    ],
  },
  {
    id: "osmosis",
    label: "Osmosis",
    accentClass: "text-blue-700",
    bgClass: "bg-blue-50",
    dotClass: "bg-blue-500",
    heading: "Osmosis — water's own diffusion",
    body: "Osmosis is diffusion restricted to water molecules across a semipermeable membrane. Where solute concentration is higher, water concentration is effectively lower. Water molecules diffuse through aquaporin channels toward the side with more solute, tending to equalize solute concentrations on both sides.",
    points: [
      "Water moves from LOW solute → HIGH solute (toward the hypertonic side)",
      "Solute molecules cannot cross the semipermeable membrane",
      "Aquaporin protein channels dramatically speed up water movement",
      "Creates osmotic pressure — measurable force at the membrane",
    ],
  },
  {
    id: "tonicity",
    label: "Tonicity",
    accentClass: "text-violet-700",
    bgClass: "bg-violet-50",
    dotClass: "bg-violet-500",
    heading: "Tonicity — the solution's effect on cells",
    body: "Tonicity compares a solution's total solute concentration to that inside a cell. It predicts whether osmosis will drive water into or out of the cell, and therefore whether the cell will swell, maintain normal volume, or shrink.",
    points: [
      "Hypotonic: external < internal — water enters → cell swells, may lyse",
      "Isotonic: external = internal — no net flow → normal volume maintained",
      "Hypertonic: external > internal — water leaves → cell shrivels (crenation)",
      "Human blood plasma (~0.9% NaCl) is isotonic to red blood cells",
    ],
  },
];

export function OsmosisInfoPanel() {
  const [active, setActive] = useState<InfoTab>("diffusion");
  const tab = INFO_TABS.find(t => t.id === active)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <div className="flex border-b border-zinc-100">
        {INFO_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors
              ${active === id
                ? "border-b-2 border-emerald-500 bg-emerald-50/60 text-emerald-600"
                : "text-zinc-400 hover:text-zinc-700"}`}
            aria-pressed={active === id}
          >
            {label}
          </button>
        ))}
      </div>
      <div className={`p-5 ${tab.bgClass}`}>
        <h3 className={`mb-2 text-base font-bold ${tab.accentClass}`}>{tab.heading}</h3>
        <p className="mb-4 text-sm leading-relaxed text-zinc-600">{tab.body}</p>
        <ul className="space-y-2">
          {tab.points.map(pt => (
            <li key={pt} className="flex items-start gap-2.5 text-sm text-zinc-600">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tab.dotClass}`} />
              {pt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
