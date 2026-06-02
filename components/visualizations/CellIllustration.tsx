// Biology concept: Animal cell anatomy — complete ultrastructure
// Interactions: CSS glow/drift animations; organelle groups are exported for reuse in lesson pages
//
// Exported groups (all draw at cx/cy, drop into any SVG viewport):
//   NucleusGroup | MitochondrionGroup | GolgiGroup | LysosomeGroup
//   PeroxisomeGroup | CentrosomeGroup | RoughERGroup | SmoothERGroup

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

// ─── Shared colour palette ────────────────────────────────────────────────────

export const CELL_COLORS = {
  membrane:   "#10b981",
  er:         "#10b981",
  nucleus:    "#8b5cf6",
  nucleolus:  "#6d28d9",
  mito:       "#fb923c",
  golgi:      "#a78bfa",
  lysosome:   "#f43f5e",
  centrosome: "#38bdf8",
  peroxisome: "#fbbf24",
  vacuole:    "#06b6d4",
} as const;

const C = CELL_COLORS;

// ─── Nucleus ──────────────────────────────────────────────────────────────────
// Double nuclear envelope (outer + inner membrane), 12 nuclear pore complexes,
// nuclear lamina, heterochromatin blobs, tripartite nucleolus, chromatin loops.

const PORE_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

interface NucleusProps { cx?: number; cy?: number; r?: number; glowClass?: string }

export function NucleusGroup({ cx = 0, cy = 0, r = 85, glowClass = "" }: NucleusProps) {
  const ri = r * 0.91;   // inner membrane radius
  const rl = r * 0.87;   // nuclear lamina radius

  return (
    <g transform={`translate(${cx} ${cy})`}>
      {/* Outer nuclear membrane */}
      <circle r={r} fill={`${C.nucleus}12`} stroke={C.nucleus} strokeWidth="2.5"
        strokeDasharray="7 3.5" className={glowClass} />

      {/* Nuclear pore complexes — outer ring + inner ring */}
      {PORE_ANGLES.map((a) => {
        const rad = (a * Math.PI) / 180;
        const ox = r  * Math.cos(rad), oy = r  * Math.sin(rad);
        const ix = ri * Math.cos(rad), iy = ri * Math.sin(rad);
        return (
          <g key={a}>
            <circle cx={ox} cy={oy} r="4.5" fill={C.nucleus} opacity="0.52" />
            <circle cx={ix} cy={iy} r="2.5" fill={C.nucleus} opacity="0.3"  />
          </g>
        );
      })}

      {/* Inner nuclear membrane */}
      <circle r={ri} fill="none" stroke={C.nucleus} strokeWidth="1.1" opacity="0.55" />

      {/* Nuclear lamina — fibrous scaffold lining the inner membrane */}
      <circle r={rl} fill={`${C.nucleus}08`} stroke={C.nucleus} strokeWidth="0.7" opacity="0.38" />

      {/* Heterochromatin — condensed chromatin associated with nuclear envelope */}
      <path d={`M ${-rl + 6} -10 Q ${-rl + 20} -28 ${-rl + 34} -12 Q ${-rl + 24} 4 ${-rl + 6} -10`}
        fill={`${C.nucleus}55`} opacity="0.58" />
      <path d={`M ${rl - 32} 20 Q ${rl - 18} 40 ${rl - 7} 26 Q ${rl - 14} 8 ${rl - 32} 20`}
        fill={`${C.nucleus}55`} opacity="0.5" />
      <path d={`M -10 ${rl - 18} Q 12 ${rl - 6} 24 ${rl - 22} Q 16 ${rl - 36} -10 ${rl - 18}`}
        fill={`${C.nucleus}55`} opacity="0.48" />

      {/* Nucleolus — granular component (outer), dense fibrillar (middle), fibrillar centre */}
      <circle cx="-14" cy="-18" r="26" fill={`${C.nucleolus}50`} />
      <circle cx="-14" cy="-18" r="17" fill={`${C.nucleolus}78`} />
      <circle cx="-12" cy="-16" r="9"  fill={`${C.nucleolus}a0`} />

      {/* Chromatin loops / euchromatin hint */}
      <path d="M 20 8 Q 30 20 20 32"  fill="none" stroke="#c4b5fd" strokeWidth="1.6" opacity="0.6" />
      <path d="M 27 8 Q 17 20 27 32"  fill="none" stroke="#c4b5fd" strokeWidth="1.6" opacity="0.6" />
      <line x1="21" y1="15" x2="26" y2="15" stroke="#c4b5fd" strokeWidth="1" opacity="0.45" />
      <line x1="20" y1="25" x2="27" y2="25" stroke="#c4b5fd" strokeWidth="1" opacity="0.45" />
      <path d="M 16 40 Q 28 48 16 56"  fill="none" stroke="#c4b5fd" strokeWidth="1.3" opacity="0.42" />
      <path d="M 23 40 Q 11 48 23 56"  fill="none" stroke="#c4b5fd" strokeWidth="1.3" opacity="0.42" />
    </g>
  );
}

// ─── Mitochondrion ────────────────────────────────────────────────────────────
// Outer membrane, intermembrane space, inner membrane, lamellar cristae, matrix
// with mitochondrial ribosomes. Cristae count scales with rx.

export interface MitochondrionProps {
  cx?: number; cy?: number; rx?: number; ry?: number; angle?: number;
  className?: string; style?: CSSProperties;
}

export function MitochondrionGroup({
  cx = 0, cy = 0, rx = 40, ry = 19, angle = 0, className, style,
}: MitochondrionProps) {
  const rix = rx - 7, riy = ry - 5;
  const n = Math.round(rx / 9);
  const xs = Array.from({ length: n }, (_, i) => -rx + 8 + (i * (rx * 2 - 16)) / Math.max(n - 1, 1));

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`} className={className} style={style}>
      {/* Outer membrane */}
      <ellipse rx={rx}  ry={ry}  fill={`${C.mito}18`} stroke={C.mito} strokeWidth="1.8" />
      {/* Inner membrane — creates visible intermembrane space */}
      <ellipse rx={rix} ry={riy} fill={`${C.mito}22`} stroke={C.mito} strokeWidth="1.1" opacity="0.8" />
      {/* Lamellar cristae projecting from upper inner membrane into matrix */}
      {xs.map((x, i) => (
        <line key={`t${i}`} x1={x} y1={-riy} x2={x} y2={-riy * 0.08}
          stroke={C.mito} strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      ))}
      {/* Bottom cristae (alternating, shorter) */}
      {xs.filter((_, i) => i % 2 === 0).map((x, i) => (
        <line key={`b${i}`} x1={x} y1={riy} x2={x} y2={riy * 0.12}
          stroke={C.mito} strokeWidth="1" strokeLinecap="round" opacity="0.45" />
      ))}
      {/* Mitochondrial ribosomes in matrix */}
      <circle cx={-rx * 0.35} cy={ry * 0.18} r="1.8" fill={C.mito} opacity="0.4" />
      <circle cx={rx  * 0.18} cy={ry * 0.28} r="1.6" fill={C.mito} opacity="0.35" />
    </g>
  );
}

// ─── Rough ER ─────────────────────────────────────────────────────────────────
// Three nested boomerang-shaped cisternae opening toward the nucleus (left).
// Each boomerang is a quadratic bezier: M 0 -Y Q mx 0 0 Y
//   tip_x = 0.5 * mx  (max right extent in local coords)
// Ribosomes stud the convex (outer/right) face.

// cx/cy = nucleus centre so the arcs wrap concentrically around it.
export function RoughERGroup({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) {
  // Three concentric circular arc bands on the right side of the nucleus.
  // Each arc spans ±53° from the horizontal, giving shallow crescents.
  const ARCS = [
    { r: 115, sw: 2.2, opa: 0.68 },
    { r: 128, sw: 2.0, opa: 0.54 },
    { r: 141, sw: 1.8, opa: 0.42 },
  ] as const;
  const HALF_ANG = 27 * (Math.PI / 180);
  const cosA = Math.cos(HALF_ANG), sinA = Math.sin(HALF_ANG);

  // Ribosome angles within the shorter arc span
  const RIBO_DEGS = [0, 10, -10, 20, -20];

  return (
    <g>
      {ARCS.map(({ r, sw, opa }) => {
        const x  = cx + r * cosA;
        const yt = cy - r * sinA;
        const yb = cy + r * sinA;
        return (
          <path key={r}
            d={`M ${x.toFixed(1)} ${yt.toFixed(1)} A ${r} ${r} 0 0 1 ${x.toFixed(1)} ${yb.toFixed(1)}`}
            fill="none" stroke={C.er} strokeWidth={sw} opacity={opa}
          />
        );
      })}
      {/* Ribosomes on cytoplasmic (outer) face of each arc */}
      {ARCS.flatMap(({ r }) =>
        RIBO_DEGS.map((deg) => {
          const a = deg * (Math.PI / 180);
          const rr = r + 4;
          return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)] as const;
        })
      ).map(([rx, ry], i) => (
        <circle key={i} cx={rx.toFixed(1)} cy={ry.toFixed(1)} r="2.6" fill={C.er} opacity="0.58" />
      ))}
    </g>
  );
}

// ─── Smooth ER ────────────────────────────────────────────────────────────────
// Two smaller boomerangs that wrap the outside of the Rough ER.
// Same origin as RoughERGroup — the SER arms extend further right but span
// a shorter vertical range, so they sit visually just beyond the RER tips.
// Teal colour distinguishes SER from RER.

const SER_COLOR = "#0ea5e9"; // sky-500 — clearly distinct from emerald RER

// cx/cy = nucleus centre.
export function SmoothERGroup({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) {
  // Two concentric circular arcs just outside the Rough ER, spanning ±18° (shorter than RER's ±27°).
  const ARCS = [
    { r: 154, sw: 1.9, opa: 0.50 },
    { r: 167, sw: 1.7, opa: 0.38 },
  ] as const;
  const HALF_ANG = 18 * (Math.PI / 180);
  const cosA = Math.cos(HALF_ANG), sinA = Math.sin(HALF_ANG);
  return (
    <g>
      {ARCS.map(({ r, sw, opa }) => {
        const x  = cx + r * cosA;
        const yt = cy - r * sinA;
        const yb = cy + r * sinA;
        return (
          <path key={r}
            d={`M ${x.toFixed(1)} ${yt.toFixed(1)} A ${r} ${r} 0 0 1 ${x.toFixed(1)} ${yb.toFixed(1)}`}
            fill="none" stroke={SER_COLOR} strokeWidth={sw} opacity={opa}
          />
        );
      })}
    </g>
  );
}

// ─── Golgi apparatus ──────────────────────────────────────────────────────────
// Five stacked cisternae: cis (ER-facing) to trans (secretory).
// Cisternae widen medially then taper at the trans face.
// COPI vesicles (retrograde) at cis; COPII/clathrin vesicles at trans.

export function GolgiGroup({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) {
  const cisternae = [
    { dy: 0,  hw: 32, arch: 10, sw: 2.8, opa: 0.78 }, // cis
    { dy: 11, hw: 36, arch: 12, sw: 3.0, opa: 0.72 },
    { dy: 22, hw: 37, arch: 13, sw: 3.0, opa: 0.66 }, // medial
    { dy: 33, hw: 35, arch: 12, sw: 2.8, opa: 0.60 },
    { dy: 44, hw: 30, arch: 10, sw: 2.6, opa: 0.54 }, // trans
  ];
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {cisternae.map(({ dy, hw, arch, sw, opa }, i) => (
        <path key={i}
          d={`M ${-hw} ${dy} Q 0 ${dy - arch} ${hw} ${dy}`}
          fill="none" stroke={C.golgi} strokeWidth={sw} opacity={opa} />
      ))}
      {/* Trans-face vesicles — secretory and lysosomal */}
      <circle cx="-30" cy="58" r="9"  fill={`${C.golgi}38`} stroke={C.golgi} strokeWidth="1.4" />
      <circle cx="2"   cy="63" r="7"  fill={`${C.golgi}33`} stroke={C.golgi} strokeWidth="1.3" />
      <circle cx="28"  cy="57" r="8"  fill={`${C.golgi}38`} stroke={C.golgi} strokeWidth="1.4" />
      <circle cx="-46" cy="50" r="5"  fill={`${C.golgi}2a`} stroke={C.golgi} strokeWidth="1.1" />
      <circle cx="42"  cy="46" r="5"  fill={`${C.golgi}2a`} stroke={C.golgi} strokeWidth="1.1" />
      {/* Cis-face incoming vesicles (from ER) */}
      <circle cx="-26" cy="-14" r="5" fill={`${C.golgi}28`} stroke={C.golgi} strokeWidth="1" />
      <circle cx="20"  cy="-16" r="4" fill={`${C.golgi}22`} stroke={C.golgi} strokeWidth="1" />
    </g>
  );
}

// ─── Lysosome ─────────────────────────────────────────────────────────────────
// Single-membrane acidic vesicle; dense granular lumen with hydrolytic enzymes.

export function LysosomeGroup({ cx = 0, cy = 0, r = 12 }: { cx?: number; cy?: number; r?: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r}          fill={`${C.lysosome}22`} stroke={C.lysosome} strokeWidth="1.6" />
      <circle r={r * 0.56}   fill={`${C.lysosome}46`} />
      <circle cx={-r * 0.25} cy={-r * 0.22} r="1.8" fill={C.lysosome} opacity="0.52" />
      <circle cx={r  * 0.2}  cy={r  * 0.2}  r="1.6" fill={C.lysosome} opacity="0.46" />
    </g>
  );
}

// ─── Centrosome ───────────────────────────────────────────────────────────────
// Pericentriolar material (PCM); centriole 1 in cross-section (9 triplet spokes);
// centriole 2 in longitudinal section (orthogonal to centriole 1).

const SPOKE_ANGLES = Array.from({ length: 9 }, (_, i) => i * 40);

export function CentrosomeGroup({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {/* PCM cloud */}
      <ellipse rx="22" ry="14" fill={`${C.centrosome}14`}
        stroke={C.centrosome} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.55" />
      {/* Centriole 1 — cross-section: 9-fold symmetry */}
      <circle cx="-7" cy="0" r="7.5" fill={`${C.centrosome}18`} stroke={C.centrosome} strokeWidth="1.4" />
      <circle cx="-7" cy="0" r="3.5" fill={`${C.centrosome}30`} stroke={C.centrosome} strokeWidth="0.7" />
      {SPOKE_ANGLES.map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line key={a}
            x1={-7 + 3.5 * Math.cos(rad)} y1={3.5 * Math.sin(rad)}
            x2={-7 + 7   * Math.cos(rad)} y2={7   * Math.sin(rad)}
            stroke={C.centrosome} strokeWidth="0.8" opacity="0.52" />
        );
      })}
      {/* Centriole 2 — longitudinal section */}
      <rect x="3" y="-5" width="16" height="10" rx="2.5"
        fill={`${C.centrosome}18`} stroke={C.centrosome} strokeWidth="1.3" />
      {[7, 11, 15].map((x) => (
        <line key={x} x1={x} y1="-5" x2={x} y2="5"
          stroke={C.centrosome} strokeWidth="0.7" opacity="0.46" />
      ))}
    </g>
  );
}

// ─── Peroxisome ───────────────────────────────────────────────────────────────
// Single membrane; urate oxidase crystalloid core visible in EM.

export function PeroxisomeGroup({ cx = 0, cy = 0, r = 10 }: { cx?: number; cy?: number; r?: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill={`${C.peroxisome}20`} stroke={C.peroxisome} strokeWidth="1.5" />
      <rect
        x={-r * 0.42} y={-r * 0.32}
        width={r * 0.84} height={r * 0.64} rx="1.5"
        fill={`${C.peroxisome}44`} stroke={C.peroxisome} strokeWidth="0.7" opacity="0.62" />
    </g>
  );
}

// ─── Cell diagram labels ──────────────────────────────────────────────────────
// Animated floating-pill labels matching the hero illustration tag style.
// lx/ly = pill anchor; tx/ty = dot at the organelle; color = indicator dot colour.

type LabelDef = {
  text: string;
  lx: number; ly: number;
  anchor: "start" | "middle" | "end";
  tx: number; ty: number;
  color: string;
  delay?: number;
};

export const CELL_LABELS: LabelDef[] = [
  { text: "Cell Membrane",   lx: 240, ly: -42, anchor: "middle", tx: 240, ty:  29, color: C.membrane,   delay: 0.0 },
  { text: "Microtubule",     lx: 430, ly: -42, anchor: "middle", tx: 290, ty: 178, color: C.centrosome, delay: 0.5 },
  { text: "Centrosome",      lx: -48, ly: 118, anchor: "start",  tx: 210, ty: 125, color: C.centrosome, delay: 1.0 },
  { text: "Vacuole",         lx: -48, ly: 148, anchor: "start",  tx: 112, ty: 148, color: C.vacuole,    delay: 1.5 },
  { text: "Nucleus",         lx: -48, ly: 225, anchor: "start",  tx: 155, ty: 232, color: C.nucleus,    delay: 0.3 },
  { text: "Nucleolus",       lx: -48, ly: 256, anchor: "start",  tx: 216, ty: 220, color: C.nucleolus,  delay: 0.8 },
  { text: "Nuclear Pore",    lx: -48, ly: 286, anchor: "start",  tx: 155, ty: 260, color: C.nucleus,    delay: 1.3 },
  { text: "Mitochondria",    lx: 534, ly: 150, anchor: "end",    tx: 400, ty: 152, color: C.mito,       delay: 0.2 },
  { text: "Peroxisome",      lx: 534, ly: 195, anchor: "end",    tx: 431, ty: 194, color: C.peroxisome, delay: 0.7 },
  { text: "Rough ER",        lx: 534, ly: 240, anchor: "end",    tx: 381, ty: 240, color: C.er,         delay: 1.2 },
  { text: "Smooth ER",       lx: 534, ly: 290, anchor: "end",    tx: 394, ty: 240, color: "#0ea5e9",    delay: 1.7 },
  { text: "Ribosome",        lx: 118, ly: 524, anchor: "middle", tx: 104, ty: 356, color: C.er,         delay: 0.4 },
  { text: "Golgi Apparatus", lx: 298, ly: 524, anchor: "middle", tx: 298, ty: 374, color: C.golgi,      delay: 0.9 },
  { text: "Lysosome",        lx: 398, ly: 500, anchor: "middle", tx: 354, ty: 397, color: C.lysosome,   delay: 1.4 },
];

// Pill dimensions
const PAD_X = 8, PAD_Y = 4.5, DOT_R = 3, TEXT_GAP = 3, FONT_H = 9.5;
const PILL_H = FONT_H + PAD_Y * 2; // ≈ 18.5

function OrgLabel({ text, lx, ly, anchor, tx, ty, color, delay = 0 }: LabelDef) {
  const pillW = PAD_X + DOT_R * 2 + TEXT_GAP + text.length * 5.35 + PAD_X;
  const rectX = anchor === "middle" ? lx - pillW / 2
              : anchor === "end"    ? lx - pillW
              : lx;
  const dotCX  = rectX + PAD_X + DOT_R;
  const textX  = rectX + PAD_X + DOT_R * 2 + TEXT_GAP;

  return (
    <motion.g
      animate={{ y: [0, -3.5, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {/* Leader line */}
      <line x1={lx} y1={ly} x2={tx} y2={ty}
        stroke="#cbd5e1" strokeWidth="0.75" opacity="0.7" />
      {/* Organelle dot */}
      <circle cx={tx} cy={ty} r="2.2" fill={color} opacity="0.75" />
      {/* Pill background */}
      <rect
        x={rectX} y={ly - PILL_H / 2}
        width={pillW} height={PILL_H}
        rx="6" ry="6"
        fill="white" fillOpacity="0.97"
        stroke="#e4e4e7" strokeWidth="0.8"
        filter="url(#pillShadow)"
      />
      {/* Colour indicator dot */}
      <circle cx={dotCX} cy={ly} r={DOT_R} fill={color} />
      {/* Text */}
      <text
        x={textX} y={ly + 0.6}
        dominantBaseline="middle"
        fontSize={FONT_H} fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="#3f3f46"
      >
        {text}
      </text>
    </motion.g>
  );
}

// ─── Free-ribosome positions ──────────────────────────────────────────────────

const FREE_RIBOSOMES: [number, number][] = [
  [180, 146], [286, 150], [158, 202], [164, 172],
  [144, 256], [200, 364], [282, 368], [258, 142],
  [108, 262], [132, 224], [136, 338], [172, 138],
  [104, 356], [150, 316], [174, 180], [80,  306],
  [108, 184], [410, 146], [430, 264], [388, 168],
  [432, 302], [178, 400], [212, 420], [254, 410],
  [82,  234], [96,  380], [422, 358], [442, 190],
];

// ─── Full cell illustration ───────────────────────────────────────────────────

export function CellIllustration() {
  // Microtubule vectors: [x1, y1, x2, y2] from centrosome at (220, 125)
  const microtubules: [number, number, number, number][] = [
    [220, 125, 144, 246], [220, 125, 246, 152], [220, 125, 148, 194],
    [220, 125, 246, 240], [220, 125, 362, 160], [220, 125, 370, 348],
    [220, 125, 116, 292], [220, 125, 292, 392],
  ];

  return (
    <svg viewBox="-55 -55 590 590" className="w-full h-full animate-cell-glow" aria-hidden="true">
      <defs>
        <radialGradient id="cellGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.membrane} stopOpacity="0.22" />
          <stop offset="100%" stopColor={C.membrane} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.nucleus} stopOpacity="0.34" />
          <stop offset="100%" stopColor={C.nucleus} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vacuoleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.vacuole} stopOpacity="0.28" />
          <stop offset="100%" stopColor={C.vacuole} stopOpacity="0" />
        </radialGradient>
        {/* Drop shadow for floating pill labels */}
        <filter id="pillShadow" x="-25%" y="-60%" width="150%" height="220%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5"
            floodColor="#000" floodOpacity="0.09" />
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx="240" cy="240" r="235" fill="url(#cellGlow)" />

      {/* Cell membrane — phospholipid bilayer (outer + inner leaflet) */}
      <circle cx="240" cy="240" r="212" fill="none"
        stroke={C.membrane} strokeWidth="1.2" opacity="0.22" />
      <circle cx="240" cy="240" r="208" fill="rgba(236,253,245,0.55)"
        stroke={C.membrane} strokeWidth="2.5" strokeDasharray="14 6" />
      <circle cx="240" cy="240" r="196" fill="rgba(236,253,245,0.38)" />

      {/* Cytoskeletal microtubules from centrosome MTOC */}
      {microtubules.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={C.centrosome} strokeWidth="0.75" opacity="0.13" />
      ))}

      {/* ── Vacuole ── */}
      <circle cx="145" cy="148" r="36" fill="url(#vacuoleGlow)" stroke={C.vacuole} strokeWidth="1.8" />
      <circle cx="145" cy="148" r="20" fill={`${C.vacuole}20`} />
      <circle cx="149" cy="145" r="8"  fill={`${C.vacuole}30`} />

      {/* ── Peroxisomes ── */}
      <PeroxisomeGroup cx={418} cy={192} r={12} />
      <PeroxisomeGroup cx={438} cy={218} r={9}  />

      {/* ── Mitochondria ── */}
      <g className="animate-organelle" style={{ animationDelay: "0s" }}>
        <MitochondrionGroup cx={355} cy={152} rx={42} ry={20} angle={-30} />
      </g>
      <g className="animate-organelle" style={{ animationDelay: "2s" }}>
        <MitochondrionGroup cx={118} cy={290} rx={36} ry={17} angle={18} />
      </g>
      <g className="animate-organelle" style={{ animationDelay: "4s" }}>
        <MitochondrionGroup cx={368} cy={345} rx={30} ry={14} angle={42} />
      </g>

      {/* ── Rough ER — concentric arcs centred on nucleus ── */}
      <RoughERGroup cx={240} cy={240} />

      {/* ── Smooth ER — wider concentric arcs, same centre ── */}
      <SmoothERGroup cx={240} cy={240} />

      {/* ── Free ribosomes ── */}
      {FREE_RIBOSOMES.map(([rcx, rcy], i) => (
        <circle key={i} cx={rcx} cy={rcy} r="3.5" fill={C.membrane} opacity="0.45" />
      ))}

      {/* ── Golgi apparatus ── */}
      <GolgiGroup cx={298} cy={325} />

      {/* ── Lysosomes — bud from trans-Golgi network ── */}
      <LysosomeGroup cx={350} cy={386} r={13} />
      <LysosomeGroup cx={318} cy={402} r={10} />
      <LysosomeGroup cx={374} cy={368} r={9}  />

      {/* ── Nucleus glow fill ── */}
      <circle cx="240" cy="240" r="88" fill="url(#nucleusGlow)" />

      {/* ── Nucleus ── */}
      <NucleusGroup cx={240} cy={240} r={88} glowClass="animate-nucleus-glow" />

      {/* ── Centrosome — above and right of vacuole, clear of nucleus ── */}
      <CentrosomeGroup cx={220} cy={125} />

      {/* ── Diagram labels with leader lines ── */}
      {CELL_LABELS.map((label) => (
        <OrgLabel key={label.text} {...label} />
      ))}
    </svg>
  );
}
