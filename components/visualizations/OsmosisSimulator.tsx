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

import { useState, useRef, createContext, useContext } from "react";
import type React from "react";
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
      <text x={cx} y={cy + r * 0.42} textAnchor="middle" fontSize={9}
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
          <rect x={MX - 14} y={py - 12} width={28} height={24} rx={5}
            fill={C.membrane} fillOpacity={0.2} stroke={C.membrane} strokeWidth={1.5} />
          <text x={MX} y={py + 5} textAnchor="middle" fontSize={12} fontWeight={800}
            fill={C.membrane} fontFamily="system-ui, sans-serif">AQP</text>
        </g>
      ))}
      {/* Label sits to the right of the membrane strip — not on top of it */}
      <line x1={MX + 6} y1={H - 14} x2={MX + 18} y2={H - 14}
        stroke={C.membrane} strokeWidth={1.2} opacity={0.5} />
      <text x={MX + 22} y={H - 8} textAnchor="start" fontSize={14} fontWeight={600}
        fill={C.membrane} opacity={0.8} fontFamily="system-ui, sans-serif">
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

      <text x={MX / 2}       y={20} textAnchor="middle" fontSize={18} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif" letterSpacing={0.6}>LEFT CHAMBER</text>
      <text x={MX + MX / 2}  y={20} textAnchor="middle" fontSize={18} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif" letterSpacing={0.6}>RIGHT CHAMBER</text>

      <Membrane />

      {/* Left molecules */}
      {LEFT_GRID.map(({ x, y }, i) => {
        const isSolute = i < leftN;
        return (
          <Molecule key={`L${i}`} cx={x} cy={y}
            r={isSolute ? 9 : 7}
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
            r={isSolute ? 9 : 7}
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
            <circle cx={x} cy={crossY} r={7} fill={C.water} />
            <text x={x} y={crossY + 3.5} textAnchor="middle" fontSize={9}
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
            y={H / 2 - 32}
            textAnchor="middle" fontSize={15} fontWeight={700}
            fill={C.water} fontFamily="system-ui, sans-serif">
            net H₂O flow
          </text>
        </g>
      ) : (
        <g>
          <text x={MX} y={H / 2 - 38} textAnchor="middle" fontSize={18} fontWeight={700}
            fill="#94a3b8" fontFamily="system-ui, sans-serif">⇌ Equilibrium</text>
          <text x={MX} y={H / 2 - 20} textAnchor="middle" fontSize={12}
            fill="#94a3b8" fontFamily="system-ui, sans-serif">no net movement — but water still crosses</text>
          {/* Bidirectional crossing molecules at equilibrium */}
          {[0, 1, 2].map((i) => {
            const crossY = [80, 150, 220][i];
            const phase  = crossPhases[i] ?? (i / 3);
            // Left-to-right molecules
            const lrX = MX + 10 + (W - 32 - MX) * phase;
            const lrOpacity = phase < 0.12 ? phase / 0.12 : phase > 0.88 ? (1 - phase) / 0.12 : 0.55;
            // Right-to-left molecules (offset phase by 0.5)
            const rlPhase = (phase + 0.5) % 1;
            const rlX = MX - 10 - (MX - 22) * rlPhase;
            const rlOpacity = rlPhase < 0.12 ? rlPhase / 0.12 : rlPhase > 0.88 ? (1 - rlPhase) / 0.12 : 0.55;
            return (
              <g key={`eq${i}`}>
                <circle cx={lrX} cy={crossY} r={6} fill={C.water} opacity={lrOpacity} />
                <circle cx={rlX} cy={crossY} r={6} fill={C.water} opacity={rlOpacity} />
              </g>
            );
          })}
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
      <text x={W - 10} y={20} textAnchor="end" fontSize={18} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif" letterSpacing={0.6}>SOLUTION</text>

      {/* External solute */}
      {extDots.map(({ x, y }, i) => (
        <Molecule key={`ES${i}`} cx={x} cy={y} r={8} color={C.solute} label="S" seed={i + 40} />
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
        fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" opacity={0.55} />
      <text x={CELL_CX + NORMAL_R + 6} y={CELL_CY - 3} fontSize={14} fontWeight={600}
        fill="#64748b" opacity={0.75} fontFamily="system-ui, sans-serif">normal</text>

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
            r={8} color={C.solute} label="S" seed={i + 60} />
        );
      })}

      {/* Tonicity badge — top-left corner, clear of the external-solute spiral */}
      <rect x={8} y={8} width={136} height={32} rx={16}
        fill={tonicityColor} fillOpacity={0.12} />
      <rect x={8} y={8} width={136} height={32} rx={16}
        stroke={tonicityColor} strokeWidth={1.5} fill="none" />
      <text x={76} y={29} textAnchor="middle" fontSize={17} fontWeight={800}
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

// ─── U-tube view ──────────────────────────────────────────────────────────────
// AP Biology classic model: U-shaped tube with semipermeable membrane at the
// bottom centre. Students set solute concentrations on each side and observe
// which arm rises (hypertonic side gains water) and which falls.
//
// Geometry: the tube centreline is stroked — the outer stroke (UT_OD) produces
// tube walls; a narrower inner stroke (UT_ID) is coloured for the fluid.
// White air-mask rects (spring-animated height) cover the air space above each
// water surface; everything below the mask edge is visually "water".
// Solute dots are clipped to the live water region so they only appear in fluid.

const UT_W   = 560;
const UT_H   = 344;
const UT_CLL = 178;                     // left arm centreline x
const UT_CLR = 382;                     // right arm centreline x
const UT_CX  = (UT_CLL + UT_CLR) / 2;  // 280
const UT_BY  = 200;                     // y where straight arms meet the U-arc
const UT_TY  = 32;                      // open top of each arm
const UT_RAD = UT_CX - UT_CLL;         // 102 — U-bend arc radius
const UT_OD  = 62;                      // outer tube stroke-width
const UT_ID  = 40;                      // inner fluid channel stroke-width
const UT_AH  = UT_BY - UT_TY;          // arm height = 168 px
const UT_HID = UT_ID / 2;              // 20 — half inner width

// Centreline path: left arm ↓ → U-arc (sweep=0 → bows downward) → right arm ↑
const UT_PATH = `M${UT_CLL},${UT_TY} L${UT_CLL},${UT_BY} A${UT_RAD},${UT_RAD} 0 0,0 ${UT_CLR},${UT_BY} L${UT_CLR},${UT_TY}`;

// Solute dot rows — dy is distance UPWARD from UT_BY; two columns per row (dx ±8)
// 7 rows × 2 dots = 14 slots; count = round(solute × 1.4) gives 0–14 at solute 0–10
const UT_ROWS = [14, 36, 58, 80, 102, 124, 146] as const;

interface UTubeViewProps { leftSolute: number; rightSolute: number }

function UTubeView({ leftSolute, rightSolute }: UTubeViewProps) {
  const grad  = rightSolute - leftSolute;
  const shift = Math.min(Math.abs(grad) / 10, 1) * 0.38 * Math.sign(grad);

  // Water level as fraction of arm height; higher fraction → more water → lower surface y
  const leftFrac  = Math.max(0.12, Math.min(0.92, 0.5 - shift));
  const rightFrac = Math.max(0.12, Math.min(0.92, 0.5 + shift));

  // y of each water surface (smaller y = higher water)
  const leftWY  = UT_BY - leftFrac  * UT_AH;
  const rightWY = UT_BY - rightFrac * UT_AH;

  const rising = grad > 0.5 ? "right" : grad < -0.5 ? "left" : null;

  const leftN  = Math.min(UT_ROWS.length * 2, Math.round(leftSolute  * 1.4));
  const rightN = Math.min(UT_ROWS.length * 2, Math.round(rightSolute * 1.4));

  return (
    <svg viewBox={`0 0 ${UT_W} ${UT_H}`} className="w-full"
      style={{ overflow: "hidden" }} role="img" aria-label="U-tube osmosis model">
      <defs>
        {/* Clip solute dots to the live water region in each arm */}
        <clipPath id="ut-lwater">
          <rect x={UT_CLL - UT_HID} width={UT_ID} y={leftWY}  height={UT_BY - leftWY}  />
        </clipPath>
        <clipPath id="ut-rwater">
          <rect x={UT_CLR - UT_HID} width={UT_ID} y={rightWY} height={UT_BY - rightWY} />
        </clipPath>
      </defs>

      {/* ── Tube walls: outer border then wall fill ── */}
      <path d={UT_PATH} fill="none" stroke="#94a3b8" strokeWidth={UT_OD + 4} strokeLinecap="butt" />
      <path d={UT_PATH} fill="none" stroke="#e2e8f0" strokeWidth={UT_OD}     strokeLinecap="butt" />

      {/* ── Fluid channel: full water fill from top to bottom of U ── */}
      <path d={UT_PATH} fill="none" stroke={C.water}
        strokeWidth={UT_ID} strokeOpacity={0.40} strokeLinecap="butt" />

      {/* ── White air masks (spring-animated) — cover air above each water surface ── */}
      <motion.rect x={UT_CLL - UT_HID} width={UT_ID} y={UT_TY}
        animate={{ height: Math.max(0, leftWY  - UT_TY) }}
        transition={{ type: "spring", stiffness: 42, damping: 13 }}
        fill="white" />
      <motion.rect x={UT_CLR - UT_HID} width={UT_ID} y={UT_TY}
        animate={{ height: Math.max(0, rightWY - UT_TY) }}
        transition={{ type: "spring", stiffness: 42, damping: 13 }}
        fill="white" />

      {/* ── Tube border redrawn on top so it sits above the masks ── */}
      <path d={UT_PATH} fill="none" stroke="#94a3b8"
        strokeWidth={UT_OD + 4} strokeOpacity={0.18} strokeLinecap="butt" />

      {/* ── Solute dots — clipped to water region so they only appear in fluid ──
              Dots are placed from the bottom of each arm upward (low dy = near bottom
              = always submerged). The clip rect tracks leftWY/rightWY so dots above
              the water surface are invisible. */}
      <g clipPath="url(#ut-lwater)">
        {Array.from({ length: leftN }, (_, i) => {
          const dy  = UT_ROWS[Math.floor(i / 2)];
          const dx  = (i % 2 === 0 ? -1 : 1) * 8;
          return <Molecule key={i} cx={UT_CLL + dx} cy={UT_BY - dy} r={6}
            color={C.solute} label="S" seed={i} />;
        })}
      </g>
      <g clipPath="url(#ut-rwater)">
        {Array.from({ length: rightN }, (_, i) => {
          const dy  = UT_ROWS[Math.floor(i / 2)];
          const dx  = (i % 2 === 0 ? -1 : 1) * 8;
          return <Molecule key={i} cx={UT_CLR + dx} cy={UT_BY - dy} r={6}
            color={C.solute} label="S" seed={i + 50} />;
        })}
      </g>

      {/* ── Semipermeable membrane — vertical at x = UT_CX through U-bend ── */}
      <line x1={UT_CX} y1={UT_BY} x2={UT_CX} y2={UT_H}
        stroke={C.membrane} strokeWidth={2.5} strokeDasharray="7 4" />
      {/* Membrane label beside the line, outside the tube walls */}
      <text x={UT_CX + UT_HID + 10} y={UT_BY + 20} fontSize={10} fontWeight={700}
        fill={C.membrane} fontFamily="system-ui, sans-serif">membrane</text>

      {/* ── Water-level arrows ── */}
      {rising === "right" && <>
        <text x={UT_CLL} y={UT_TY + 18} textAnchor="middle"
          fontSize={18} fill={C.water} fontWeight={900} opacity={0.8}>↓</text>
        <text x={UT_CLR} y={UT_TY + 18} textAnchor="middle"
          fontSize={18} fill={C.water} fontWeight={900} opacity={0.8}>↑</text>
      </>}
      {rising === "left" && <>
        <text x={UT_CLL} y={UT_TY + 18} textAnchor="middle"
          fontSize={18} fill={C.water} fontWeight={900} opacity={0.8}>↑</text>
        <text x={UT_CLR} y={UT_TY + 18} textAnchor="middle"
          fontSize={18} fill={C.water} fontWeight={900} opacity={0.8}>↓</text>
      </>}

      {/* ── Arm labels ── */}
      <text x={UT_CLL} y={UT_TY - 8} textAnchor="middle" fontSize={13} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif">LEFT</text>
      <text x={UT_CLR} y={UT_TY - 8} textAnchor="middle" fontSize={13} fontWeight={700}
        fill="#94a3b8" fontFamily="system-ui, sans-serif">RIGHT</text>
    </svg>
  );
}

function UTubeStatus({ leftSolute, rightSolute }: { leftSolute: number; rightSolute: number }) {
  const gradient = rightSolute - leftSolute;
  let status: string;
  if (gradient > 0.5)
    status = `Right side is hypertonic — water crosses the membrane into the right arm, raising its level.`;
  else if (gradient < -0.5)
    status = `Left side is hypertonic — water crosses the membrane into the left arm, raising its level.`;
  else
    status = `Equal concentrations — no net osmosis, both water levels stay the same.`;

  return (
    <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 px-5 py-3.5">
      <div className="mb-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="font-semibold text-zinc-400">Left solute</p>
          <p className="text-lg font-black text-orange-500">{leftSolute}<span className="text-xs text-zinc-400">/10</span></p>
        </div>
        <div>
          <p className="font-semibold text-zinc-400">Difference</p>
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

// ─── OsmosisViewer (main exported component) ──────────────────────────────────

type ViewTab = "chamber" | "cell" | "utube";
type InfoTab = "diffusion" | "osmosis" | "tonicity" | "utube";

// Maps each viewer tab to the info-panel tab that best explains it
const VIEWER_TO_INFO: Record<ViewTab, InfoTab> = {
  chamber: "osmosis",
  cell:    "tonicity",
  utube:   "utube",
};

// ─── Shared context ───────────────────────────────────────────────────────────
// Lets OsmosisViewer and OsmosisInfoPanel stay in sync: switching the viewer
// tab auto-advances the info panel to the matching explanation.

interface OsmosisCtxValue {
  viewerTab:    ViewTab;
  infoTab:      InfoTab;
  setViewerTab: (t: ViewTab) => void;
  setInfoTab:   (t: InfoTab) => void;
}

const OsmosisCtx = createContext<OsmosisCtxValue | null>(null);

function useOsmosis(): OsmosisCtxValue {
  const ctx = useContext(OsmosisCtx);
  if (!ctx) throw new Error("Must be inside OsmosisProvider");
  return ctx;
}

export function OsmosisProvider({ children }: { children: React.ReactNode }) {
  const [viewerTab, setViewerTabState] = useState<ViewTab>("chamber");
  const [infoTab,   setInfoTab]        = useState<InfoTab>("osmosis");

  function setViewerTab(t: ViewTab) {
    setViewerTabState(t);
    setInfoTab(VIEWER_TO_INFO[t]);
  }

  return (
    <OsmosisCtx.Provider value={{ viewerTab, infoTab, setViewerTab, setInfoTab }}>
      {children}
    </OsmosisCtx.Provider>
  );
}

export function OsmosisViewer() {
  const { viewerTab: tab, setViewerTab: setTab } = useOsmosis();
  const [leftSolute,   setLeftSolute]   = useState(7);
  const [rightSolute,  setRightSolute]  = useState(3);
  const [extSolute,    setExtSolute]    = useState(8);
  const [utLeft,       setUtLeft]       = useState(3);
  const [utRight,      setUtRight]      = useState(7);

  const [crossPhases, setCrossPhases] = useState<number[]>(
    () => Array.from({ length: MAX_CROSS }, (_, i) => i / MAX_CROSS),
  );
  const prevDirRef = useRef<"lr" | "rl" | null>(null);

  const gradient  = rightSolute - leftSolute;
  const direction = gradient > 0 ? "lr" : gradient < 0 ? "rl" : null;
  const activeN   = Math.min(Math.ceil(Math.abs(gradient) * 0.7), MAX_CROSS);

  useAnimationFrame((_time, delta) => {
    if (tab !== "chamber") return;
    if (direction !== prevDirRef.current) {
      prevDirRef.current = direction;
      setCrossPhases(Array.from({ length: MAX_CROSS }, (_, i) => i / MAX_CROSS));
      return;
    }
    const speed = direction === null
      ? 0.00028                                              // slow constant flow at equilibrium
      : 0.00032 + Math.abs(gradient) * 0.00003;
    const n = direction === null ? 3 : activeN;
    if (n === 0) return;
    setCrossPhases(prev => {
      const next = [...prev];
      for (let i = 0; i < n; i++) next[i] = (next[i] + delta * speed) % 1;
      return next;
    });
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      {/* View tabs */}
      <div className="flex border-b border-zinc-100">
        {([
          ["chamber", "Osmosis Chamber"],
          ["cell",    "Cell in Solution"],
          ["utube",   "U-Tube Model"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-xs font-bold transition-colors
              ${tab === id
                ? "border-b-2 border-emerald-500 bg-emerald-50/60 text-emerald-600"
                : "text-zinc-400 hover:text-zinc-700"}`}
            aria-pressed={tab === id}
          >
            {label}
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
        ) : tab === "cell" ? (
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
        ) : tab === "utube" ? (
          <>
            <UTubeView leftSolute={utLeft} rightSolute={utRight} />
            <div className="mt-4 grid grid-cols-2 gap-5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-zinc-600">
                  Left solute: <span className="text-orange-500">{utLeft}/10</span>
                </span>
                <input type="range" min={0} max={10} step={1}
                  value={utLeft}
                  onChange={e => setUtLeft(Number(e.target.value))}
                  className="w-full accent-orange-500"
                  aria-label="Left arm solute concentration" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-zinc-600">
                  Right solute: <span className="text-orange-500">{utRight}/10</span>
                </span>
                <input type="range" min={0} max={10} step={1}
                  value={utRight}
                  onChange={e => setUtRight(Number(e.target.value))}
                  className="w-full accent-orange-500"
                  aria-label="Right arm solute concentration" />
              </label>
            </div>
            <UTubeStatus leftSolute={utLeft} rightSolute={utRight} />
          </>
        ) : null
        }
      </div>
    </div>
  );
}

// ─── OsmosisInfoPanel ─────────────────────────────────────────────────────────

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
      "Water crosses toward the HIGH-solute side — it is the water that moves, not the solute",
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
  {
    id: "utube",
    label: "Osmotic Pressure",
    accentClass: "text-amber-700",
    bgClass: "bg-amber-50",
    dotClass: "bg-amber-500",
    heading: "Osmotic Pressure — the U-tube in action",
    body: "When a semipermeable membrane separates two solutions of different concentration, water moves toward the higher-solute side. As water accumulates there, the fluid column grows taller and its extra weight pushes back against further osmosis. The height difference between the two arms is a direct, visible measure of osmotic pressure.",
    points: [
      "The hypertonic side gains water — its fluid level rises",
      "The hypotonic side loses water — its fluid level falls",
      "At equilibrium the hydrostatic pressure of the taller column exactly balances the osmotic driving force — net flow stops",
      "AP exam: identify the hypertonic side first — that arm always rises",
    ],
  },
];

export function OsmosisInfoPanel() {
  const { infoTab: active, setInfoTab: setActive } = useOsmosis();
  const tab = INFO_TABS.find(t => t.id === active) ?? INFO_TABS[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <div className="flex border-b border-zinc-100">
        {INFO_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors leading-tight px-1
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

// ─── Emblem ───────────────────────────────────────────────────────────────────
// Two-chamber osmosis diagram for the lesson card thumbnail.
// Left = low solute (many water molecules), right = high solute (many orange dots),
// with a net-flow arrow showing water crossing the membrane toward the hypertonic side.

export function OsmosisEmblem({ className }: { className?: string }) {
  // A tank split by a semipermeable membrane. Water crosses toward the side with
  // more solute, so the water level rises on that side.
  const WATER    = "#3b82f6";
  const SOLUTE   = "#f97316";
  const MEMBRANE = "#7c3aed";
  const LEFT_LEVEL = 27, RIGHT_LEVEL = 15, FLOOR = 61;

  return (
    <svg viewBox="0 -2 120 106" className={className} aria-hidden="true">
      <defs>
        <marker id="oe-arr" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L0,8 L8,4 z" fill={WATER} />
        </marker>
        <marker id="oe-arr-up" markerUnits="userSpaceOnUse" markerWidth="6" markerHeight="6" refX="4.5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#64748b" />
        </marker>
      </defs>

      {/* Water on each side — higher on the solute-rich right */}
      <rect x={10} y={LEFT_LEVEL} width={49} height={FLOOR - LEFT_LEVEL} fill="#dbeafe" />
      <rect x={61} y={RIGHT_LEVEL} width={49} height={FLOOR - RIGHT_LEVEL} fill="#dbeafe" />
      <g stroke={WATER} strokeWidth={1.5} opacity={0.6}>
        <line x1={10} y1={LEFT_LEVEL} x2={59} y2={LEFT_LEVEL} />
        <line x1={61} y1={RIGHT_LEVEL} x2={110} y2={RIGHT_LEVEL} />
      </g>
      {/* Where the right side started, and how far it rose */}
      <line x1={61} y1={LEFT_LEVEL} x2={110} y2={LEFT_LEVEL} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 2" />
      <line x1={104} y1={LEFT_LEVEL - 1} x2={104} y2={RIGHT_LEVEL + 3} stroke="#64748b" strokeWidth={1.4} markerEnd="url(#oe-arr-up)" />

      {/* Tank walls */}
      <path d={`M 9 4 V ${FLOOR - 3} Q 9 ${FLOOR + 1} 13 ${FLOOR + 1} H 107 Q 111 ${FLOOR + 1} 111 ${FLOOR - 3} V 4`}
        fill="none" stroke="#94a3b8" strokeWidth={2} strokeLinejoin="round" />

      {/* Semipermeable membrane */}
      <line x1={60} y1={8} x2={60} y2={FLOOR} stroke={MEMBRANE} strokeWidth={2.5} strokeDasharray="5 3" />

      {/* Left: mostly water */}
      <g fill={WATER} fillOpacity={0.85}>
        {[[18, 36], [34, 33], [48, 51], [22, 53], [36, 45]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={3} />)}
      </g>
      <circle cx={45} cy={35} r={5} fill={SOLUTE} fillOpacity={0.9} />

      {/* Right: crowded with solute */}
      <g fill={SOLUTE} fillOpacity={0.9}>
        {[[72, 26], [90, 22], [82, 38], [98, 42], [74, 53], [94, 54]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={5} />)}
      </g>
      <circle cx={84} cy={50} r={3} fill={WATER} fillOpacity={0.85} />

      {/* Net water movement */}
      <line x1={48} y1={42} x2={71} y2={42} stroke={WATER} strokeWidth={3} markerEnd="url(#oe-arr)" />
    </svg>
  );
}
