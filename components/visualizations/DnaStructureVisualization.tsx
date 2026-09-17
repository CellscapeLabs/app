"use client";
/*
 * Biology concept: DNA Structure — the Double Helix
 * Zooms from the whole molecule down to its building block in five stages:
 *   Stage 1 Double helix: two strands, right-handed, ~2 nm wide, ~10 bp (3.4 nm) per turn
 *   Stage 2 The ladder: untwisted view — sugar-phosphate backbone rails, base-pair rungs
 *   Stage 3 Base pairing: A=T (2 H-bonds), G≡C (3 H-bonds); purine always pairs with pyrimidine
 *   Stage 4 Antiparallel: one strand runs 5′→3′, its partner 3′→5′
 *   Stage 5 Nucleotide: phosphate (5′ carbon) + deoxyribose + nitrogenous base (1′ carbon)
 * Interactions: Drag right to advance stages, left to go back (or ← → keys / stage tabs).
 * The helix is a pseudo-3D SVG projection that rotates at stage 1 (pause button; paused by
 * default under prefers-reduced-motion) and smoothly untwists into the ladder. The
 * DnaSequenceBuilder shares state via DnaStructureProvider: tapping a base on the top strand
 * cycles A→T→G→C, the complementary strand updates, and Chargaff percentages / H-bond counts
 * recalculate — the helix diagram recolors to match.
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
import { fadeLerp } from "@/lib/scrub";

// ─── Bases ────────────────────────────────────────────────────────────────────
export type Base = "A" | "T" | "G" | "C";

const BASE_CYCLE: Record<Base, Base> = { A: "T", T: "G", G: "C", C: "A" };
const COMPLEMENT: Record<Base, Base> = { A: "T", T: "A", G: "C", C: "G" };
const BASE_NAME:  Record<Base, string> = { A: "Adenine", T: "Thymine", G: "Guanine", C: "Cytosine" };
const BASE_COLOR: Record<Base, string> = {
  A: "#22c55e",   // green-500
  T: "#f43f5e",   // rose-500
  G: "#f59e0b",   // amber-500
  C: "#3b82f6",   // blue-500
};
const BASE_BG_CLASS: Record<Base, string> = {
  A: "bg-green-500", T: "bg-rose-500", G: "bg-amber-500", C: "bg-blue-500",
};

function isPurine(b: Base) { return b === "A" || b === "G"; }
function hBondCount(b: Base) { return b === "G" || b === "C" ? 3 : 2; }

const DEFAULT_SEQUENCE: readonly Base[] = ["A", "T", "G", "C", "G", "T", "A", "C", "C", "T", "A", "G"];

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  backbone:  "#64748b",   // slate-500 — sugar-phosphate backbone
  phosphate: "#8b5cf6",   // violet-500 — phosphate groups
  sugar:     "#f1f5f9",   // slate-100 — deoxyribose fill
  hbond:     "#94a3b8",   // slate-400 — hydrogen bonds
  label:     "#52525b",   // zinc-600
  muted:     "#a1a1aa",   // zinc-400
  highlight: "#7c3aed",   // violet-600 — zoom highlight
};

// ─── Geometry ─────────────────────────────────────────────────────────────────
// Helix axis runs horizontally through (CX, CY). Base pair i sits at x = X0 + i·SP.
const N      = DEFAULT_SEQUENCE.length;
const X0     = 48;
const X1     = 352;
const SP     = (X1 - X0) / (N - 1);
const CX     = 200;
const CY     = 128;
const R      = 50;
const OMEGA  = (2 * Math.PI) / 10;  // ~10 bp per full turn
const BW     = 13;                   // base rect width
const SEG_STEP = 0.25;               // backbone sampling (in base-pair units)
const ZOOM_K = 2;                    // nucleotide index shown at stage 5
const ROT_SPEED = 0.0012;            // rad per ms

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── Interpolated state ───────────────────────────────────────────────────────
interface DNAState {
  twist:         number;  // 1 = helix, 0 = flat ladder
  measureOp:     number;  // 2 nm / 3.4 nm annotations
  ladderLabelOp: number;  // backbone / rung labels
  letterOp:      number;  // base letters
  hbondOp:       number;  // hydrogen bond ticks
  pairLegendOp:  number;  // A=T / G≡C legend
  directionOp:   number;  // 5′ / 3′ labels
  zoom:          number;  // nucleotide close-up
}

const KS: DNAState[] = [
  // 0 — Double helix
  { twist: 1, measureOp: 1, ladderLabelOp: 0, letterOp: 0,   hbondOp: 0,   pairLegendOp: 0, directionOp: 0, zoom: 0 },
  // 1 — Ladder
  { twist: 0, measureOp: 0, ladderLabelOp: 1, letterOp: 0,   hbondOp: 0.5, pairLegendOp: 0, directionOp: 0, zoom: 0 },
  // 2 — Base pairing
  { twist: 0, measureOp: 0, ladderLabelOp: 0, letterOp: 1,   hbondOp: 1,   pairLegendOp: 1, directionOp: 0, zoom: 0 },
  // 3 — Antiparallel
  { twist: 0, measureOp: 0, ladderLabelOp: 0, letterOp: 1,   hbondOp: 0.6, pairLegendOp: 0, directionOp: 1, zoom: 0 },
  // 4 — Nucleotide
  { twist: 0, measureOp: 0, ladderLabelOp: 0, letterOp: 0.5, hbondOp: 0.3, pairLegendOp: 0, directionOp: 0, zoom: 1 },
];

// twist and zoom drive geometry, so they move linearly; everything else is an
// opacity and cross-fades so outgoing and incoming labels never overlap mid-scrub.
function lerpState(a: DNAState, b: DNAState, t: number): DNAState {
  const out = { ...a };
  (Object.keys(a) as (keyof DNAState)[]).forEach((k) => {
    out[k] = k === "twist" || k === "zoom" ? lerp(a[k], b[k], t) : fadeLerp(a[k], b[k], t);
  });
  return out;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ringPoints(cx: number, cy: number, r: number, sides: number, startDeg: number) {
  return Array.from({ length: sides }, (_, i) => {
    const a = ((startDeg + (360 / sides) * i) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

// Trig results can differ in their last bit between Node and the browser, which breaks
// hydration and — worse — can sort the depth-ordered rungs differently on each side.
// Quantizing every value derived from Math.cos/sin keeps server and client identical.
function q(n: number) { return Math.round(n * 1000) / 1000; }

// Depth cue: fade toward the background colour instead of lowering opacity, so the
// overlapping round caps of adjacent backbone segments don't stack into dark beads.
function mixHex(from: string, to: string, t: number) {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const ch = (a: number, b: number) => Math.round(a + (b - a) * t).toString(16).padStart(2, "0");
  return `#${ch(r1, r2)}${ch(g1, g2)}${ch(b1, b2)}`;
}

function depthMix(z: number) { return Math.max(0, Math.min(1, q((1 - (z + 1) / 2) * 0.75))); }

// ─── Nucleotide close-up ──────────────────────────────────────────────────────
function NucleotideDetail({ base, op }: { base: Base; op: number }) {
  if (op < 0.01) return null;
  const purine = isPurine(base);
  const color  = BASE_COLOR[base];

  // Deoxyribose pentagon — center (196,178), r=24; vertices: O, C1′, C2′, C3′, C4′
  const SX = 196, SY = 178, SR = 24;
  const v = (deg: number, r = SR) => {
    const a = (deg * Math.PI) / 180;
    return { x: q(SX + r * Math.cos(a)), y: q(SY + r * Math.sin(a)) };
  };
  const c1 = v(-18), c2 = v(54), c3 = v(126), c4 = v(198), o = v(-90);
  const c5 = { x: 152, y: 160 };

  return (
    <g opacity={op}>
      <rect x={68} y={124} width={264} height={134} rx={10} fill="white" stroke="#e4e4e7" strokeWidth={1} />
      <text x={80} y={139} fontSize={7.5} fontWeight={700} fill={C.muted} fontFamily="system-ui" letterSpacing={0.8}>
        ONE NUCLEOTIDE
      </text>

      {/* Phosphate → C5′ → C4′ */}
      <line x1={124} y1={165} x2={c5.x} y2={c5.y} stroke={C.backbone} strokeWidth={2} />
      <line x1={c5.x} y1={c5.y} x2={c4.x} y2={c4.y} stroke={C.backbone} strokeWidth={2} />
      <text x={c5.x} y={c5.y - 5} textAnchor="middle" fontSize={7} fill={C.label} fontFamily="system-ui">5′</text>
      <circle cx={108} cy={168} r={17} fill={C.phosphate} />
      <text x={108} y={172} textAnchor="middle" fontSize={11} fontWeight={800} fill="white" fontFamily="system-ui">P</text>

      {/* Sugar ring */}
      <polygon points={ringPoints(SX, SY, SR, 5, -90)} fill={C.sugar} stroke={C.backbone} strokeWidth={2} />
      <circle cx={o.x} cy={o.y} r={6} fill="white" stroke={C.backbone} strokeWidth={1.5} />
      <text x={o.x} y={o.y + 2.5} textAnchor="middle" fontSize={7} fontWeight={700} fill={C.label} fontFamily="system-ui">O</text>
      {([[-18, "1′"], [54, "2′"], [126, "3′"], [198, "4′"]] as const).map(([deg, lbl]) => {
        const p = v(deg, 14);
        return (
          <text key={lbl} x={p.x} y={p.y + 2.5} textAnchor="middle" fontSize={7} fill={C.label} fontFamily="system-ui">{lbl}</text>
        );
      })}

      {/* 3′ –OH and 2′ –H */}
      <line x1={c3.x} y1={c3.y} x2={176} y2={210} stroke={C.backbone} strokeWidth={1.5} />
      <text x={172} y={220} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={C.label} fontFamily="system-ui">OH</text>
      <line x1={c2.x} y1={c2.y} x2={215} y2={208} stroke={C.backbone} strokeWidth={1.5} />
      <text x={218} y={218} textAnchor="middle" fontSize={7.5} fontWeight={700} fill={C.label} fontFamily="system-ui">H</text>

      {/* C1′ → base. Purines attach to the sugar through their five-membered ring (N9),
          so the pentagon sits nearest the sugar and the hexagon is fused beyond it. */}
      <line x1={c1.x} y1={c1.y} x2={purine ? 249.2 : 247} y2={172} stroke={C.backbone} strokeWidth={2} />
      {purine ? (
        <>
          <polygon points={ringPoints(262, 172, 12.76, 5, -36)} fill={color} stroke="white" strokeWidth={1} />
          <polygon points={ringPoints(285.3, 172, 15, 6, -90)} fill={color} stroke="white" strokeWidth={1} />
          <text x={285.3} y={175.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="white" fontFamily="system-ui">{base}</text>
        </>
      ) : (
        <>
          <polygon points={ringPoints(262, 172, 15, 6, -90)} fill={color} stroke="white" strokeWidth={1} />
          <text x={262} y={175.5} textAnchor="middle" fontSize={10} fontWeight={800} fill="white" fontFamily="system-ui">{base}</text>
        </>
      )}

      {/* Captions */}
      <text x={108} y={246} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={C.label} fontFamily="system-ui">Phosphate</text>
      <text x={190} y={246} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={C.label} fontFamily="system-ui">Deoxyribose sugar</text>
      <text x={280} y={246} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={color} fontFamily="system-ui">
        {BASE_NAME[base]} ({purine ? "purine" : "pyrimidine"})
      </text>
    </g>
  );
}

// ─── Interpolated helix diagram ───────────────────────────────────────────────
function HelixDiagram({ progress, rot, sequence }: { progress: number; rot: number; sequence: readonly Base[] }) {
  const clamped = Math.max(0, Math.min(progress, KS.length - 1));
  const fi = Math.min(Math.floor(clamped), KS.length - 2);
  const s  = lerpState(KS[fi], KS[fi + 1], clamped - fi);
  const tw = s.twist;

  const thetaA = (u: number) => Math.PI + tw * (u * OMEGA + rot);
  const thetaB = (u: number) => thetaA(u) + Math.PI;  // strands drawn directly opposite for an even helix
  const xOf = (u: number) => q(X0 + u * SP);
  const yOf = (th: number) => q(CY + R * Math.cos(th));
  const zOf = (th: number) => q(-Math.sin(th));  // positive = toward viewer (right-handed helix)

  // Backbone segments
  const segs: { key: string; x1: number; y1: number; x2: number; y2: number; z: number }[] = [];
  for (const [strand, th] of [["a", thetaA], ["b", thetaB]] as const) {
    for (let j = 0; j < N / SEG_STEP; j++) {
      const u1 = -0.5 + j * SEG_STEP;
      const u2 = u1 + SEG_STEP;
      const t1 = th(u1), t2 = th(u2);
      segs.push({ key: `${strand}${j}`, x1: xOf(u1), y1: yOf(t1), x2: xOf(u2), y2: yOf(t2), z: q((zOf(t1) + zOf(t2)) / 2) });
    }
  }

  // Phosphates: 5′ side of each nucleotide — left on the top strand, right on the antiparallel bottom strand
  const phosphates = sequence.flatMap((_, i) => {
    const ta = thetaA(i - 0.5), tb = thetaB(i + 0.5);
    return [
      { key: `pa${i}`, x: xOf(i - 0.5), y: yOf(ta), z: zOf(ta) },
      { key: `pb${i}`, x: xOf(i + 0.5), y: yOf(tb), z: zOf(tb) },
    ];
  });

  const rungs = sequence
    .map((base, i) => {
      const ta = thetaA(i), tb = thetaB(i);
      return { i, base, partner: COMPLEMENT[base], x: xOf(i), yA: yOf(ta), yB: yOf(tb), z: q((zOf(ta) + zOf(tb)) / 2) };
    })
    .sort((a, b) => a.z - b.z || a.i - b.i);  // index tiebreak keeps the order stable

  const BACK = -0.02;
  // The close-up only fades in once the ladder has shrunk out of its way
  const detailOp  = fadeLerp(0, 1, s.zoom);
  const zoomScale = lerp(1, 0.62, s.zoom);
  const zoomY     = lerp(CY, 60, s.zoom);
  const toScreen  = (x: number, y: number) => ({ x: CX + (x - CX) * zoomScale, y: zoomY + (y - CY) * zoomScale });

  // Highlight box around nucleotide ZOOM_K on the top strand (ladder coordinates)
  const hlX = xOf(ZOOM_K - 0.5) - 3;
  const hlW = SP + 6;
  const hlY = CY - R - 9;
  const hlH = 2 * R * (isPurine(sequence[ZOOM_K]) ? 0.56 : 0.44) + 9;
  const hlBL = toScreen(hlX, hlY + hlH);
  const hlBR = toScreen(hlX + hlW, hlY + hlH);

  const segLine = (sg: (typeof segs)[number]) => (
    <line key={sg.key} x1={sg.x1} y1={sg.y1} x2={sg.x2} y2={sg.y2}
      stroke={mixHex(C.backbone, "#e2e8f0", depthMix(sg.z))} strokeWidth={q(3.2 + 1.2 * sg.z)} strokeLinecap="round" />
  );
  const phosDot = (p: (typeof phosphates)[number]) => (
    <circle key={p.key} cx={p.x} cy={p.y} r={q(3 + 0.6 * p.z)} fill={mixHex(C.phosphate, "#ddd6fe", depthMix(p.z))} />
  );

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full" role="img"
      aria-label="DNA double helix diagram showing two sugar-phosphate backbones connected by base pairs">
      <defs>
        <marker id="dna-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={C.label} />
        </marker>
      </defs>

      <g transform={`translate(${CX} ${zoomY}) scale(${zoomScale}) translate(${-CX} ${-CY})`}>
        {segs.filter((sg) => sg.z < BACK).map(segLine)}
        {phosphates.filter((p) => p.z < BACK).map(phosDot)}

        {/* Base-pair rungs, back to front */}
        {rungs.map(({ i, base, partner, x, yA, yB, z }) => {
          const dir  = yB >= yA ? 1 : -1;
          const span = Math.abs(yB - yA);
          const junction = yA + (yB - yA) * (isPurine(base) ? 0.56 : 0.44);
          const aEnd = junction - dir * 3, aStart = yA + dir * 4;
          const bStart = junction + dir * 3, bEnd = yB - dir * 4;
          const aH = Math.max(0, (aEnd - aStart) * dir);
          const bH = Math.max(0, (bEnd - bStart) * dir);
          const aTop = Math.min(aStart, aEnd), bTop = Math.min(bStart, bEnd);
          const op = q(0.45 + 0.55 * ((z + 1) / 2));
          const ticks = hBondCount(base) === 3 ? [-4, 0, 4] : [-2.5, 2.5];
          return (
            <g key={i} opacity={op}>
              <rect x={x - BW / 2} y={aTop} width={BW} height={aH} rx={2} fill={BASE_COLOR[base]} />
              <rect x={x - BW / 2} y={bTop} width={BW} height={bH} rx={2} fill={BASE_COLOR[partner]} />
              {s.hbondOp > 0.01 && span > 16 && ticks.map((dx) => (
                <line key={dx} x1={x + dx} y1={junction - 3} x2={x + dx} y2={junction + 3}
                  stroke={C.hbond} strokeWidth={1.2} opacity={s.hbondOp} />
              ))}
              {s.letterOp > 0.01 && aH >= 12 && (
                <text x={x} y={aTop + aH / 2 + 3} textAnchor="middle" fontSize={8.5} fontWeight={800}
                  fill="white" fontFamily="system-ui" opacity={s.letterOp}>{base}</text>
              )}
              {s.letterOp > 0.01 && bH >= 12 && (
                <text x={x} y={bTop + bH / 2 + 3} textAnchor="middle" fontSize={8.5} fontWeight={800}
                  fill="white" fontFamily="system-ui" opacity={s.letterOp}>{partner}</text>
              )}
            </g>
          );
        })}

        {segs.filter((sg) => sg.z >= BACK).map(segLine)}
        {phosphates.filter((p) => p.z >= BACK).map(phosDot)}

        {s.zoom > 0.01 && (
          <rect x={hlX} y={hlY} width={hlW} height={hlH} rx={4} fill="none"
            stroke={C.highlight} strokeWidth={2} strokeDasharray="4 3" opacity={detailOp} />
        )}

        {/* ── Stage 4: antiparallel orientation (inside the zoom group so it shrinks with the ladder) ── */}
        {s.directionOp > 0.01 && (
          <g opacity={s.directionOp} fontFamily="system-ui" fontWeight={800}>
            <text x={20} y={CY - R + 4} textAnchor="middle" fontSize={12} fill={C.highlight}>5′</text>
            <text x={380} y={CY - R + 4} textAnchor="middle" fontSize={12} fill={C.highlight}>3′</text>
            <text x={20} y={CY + R + 4} textAnchor="middle" fontSize={12} fill={C.highlight}>3′</text>
            <text x={380} y={CY + R + 4} textAnchor="middle" fontSize={12} fill={C.highlight}>5′</text>
            <line x1={140} y1={CY - R - 14} x2={260} y2={CY - R - 14} stroke={C.label} strokeWidth={1.5} markerEnd="url(#dna-arrow)" />
            <text x={CX} y={CY - R - 21} textAnchor="middle" fontSize={9} fill={C.label}>5′ → 3′</text>
            <line x1={260} y1={CY + R + 14} x2={140} y2={CY + R + 14} stroke={C.label} strokeWidth={1.5} markerEnd="url(#dna-arrow)" />
            <text x={CX} y={CY + R + 29} textAnchor="middle" fontSize={9} fill={C.label}>3′ ← 5′</text>
            <text x={CX} y={CY + R + 52} textAnchor="middle" fontSize={8.5} fontWeight={500} fill={C.label}>
              Strands run in opposite directions — antiparallel
            </text>
          </g>
        )}
      </g>

      {/* ── Stage 1: dimensions ── */}
      {s.measureOp > 0.01 && (
        <g opacity={s.measureOp} fontFamily="system-ui">
          <path d={`M 30 ${CY - R} H 24 V ${CY + R} H 30`} fill="none" stroke={C.label} strokeWidth={1} />
          <text x={16} y={CY + 3} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={C.label}
            transform={`rotate(-90 16 ${CY})`}>2 nm</text>
          <path d={`M ${xOf(0)} ${CY - R - 12} V ${CY - R - 18} H ${xOf(10)} V ${CY - R - 12}`}
            fill="none" stroke={C.label} strokeWidth={1} />
          <text x={(xOf(0) + xOf(10)) / 2} y={CY - R - 23} textAnchor="middle" fontSize={8.5} fontWeight={600} fill={C.label}>
            3.4 nm · one full turn ≈ 10 base pairs
          </text>
          <text x={CX} y={CY + R + 32} textAnchor="middle" fontSize={9} fontWeight={600} fill={C.label}>
            Right-handed double helix
          </text>
          <text x={CX} y={CY + R + 46} textAnchor="middle" fontSize={7.5} fill={C.muted}>
            Two sugar-phosphate backbones wind around a shared axis
          </text>
        </g>
      )}

      {/* ── Stage 2: ladder labels ── */}
      {s.ladderLabelOp > 0.01 && (
        <g opacity={s.ladderLabelOp} fontFamily="system-ui" textAnchor="middle">
          <text x={CX} y={CY - R - 12} fontSize={9} fontWeight={700} fill={C.backbone}>Sugar-phosphate backbone</text>
          <text x={CX} y={CY + R + 20} fontSize={9} fontWeight={700} fill={C.backbone}>Sugar-phosphate backbone</text>
          <text x={CX} y={CY + R + 42} fontSize={8.5} fill={C.label}>
            Rungs = nitrogenous base pairs, joined by hydrogen bonds
          </text>
          <circle cx={CX - 92} cy={CY + R + 58} r={3.5} fill={C.phosphate} />
          <text x={CX - 84} y={CY + R + 61} fontSize={8} fill={C.label} textAnchor="start">phosphate</text>
          <line x1={CX - 6} y1={CY + R + 58} x2={CX + 10} y2={CY + R + 58} stroke={C.backbone} strokeWidth={3.5} strokeLinecap="round" />
          <text x={CX + 16} y={CY + R + 61} fontSize={8} fill={C.label} textAnchor="start">sugar backbone</text>
        </g>
      )}

      {/* ── Stage 3: pairing legend ── */}
      {s.pairLegendOp > 0.01 && (
        <g opacity={s.pairLegendOp} fontFamily="system-ui">
          {([["A", "T", 2, 70], ["G", "C", 3, 216]] as const).map(([b1, b2, n, x]) => (
            <g key={b1}>
              <rect x={x} y={CY + R + 18} width={12} height={12} rx={2} fill={BASE_COLOR[b1]} />
              <rect x={x + 22} y={CY + R + 18} width={12} height={12} rx={2} fill={BASE_COLOR[b2]} />
              <text x={x + 6} y={CY + R + 27} textAnchor="middle" fontSize={8} fontWeight={800} fill="white">{b1}</text>
              <text x={x + 28} y={CY + R + 27} textAnchor="middle" fontSize={8} fontWeight={800} fill="white">{b2}</text>
              <text x={x + 17} y={CY + R + 27} textAnchor="middle" fontSize={9} fontWeight={800} fill={C.label}>
                {n === 3 ? "≡" : "="}
              </text>
              <text x={x + 40} y={CY + R + 27} fontSize={9} fontWeight={600} fill={C.label}>{n} H-bonds</text>
            </g>
          ))}
          <text x={CX} y={CY + R + 50} textAnchor="middle" fontSize={8.5} fill={C.label}>
            Purine (2 rings, longer bar) always pairs with pyrimidine (1 ring, shorter)
          </text>
        </g>
      )}

      {/* ── Stage 5: nucleotide close-up ── */}
      {s.zoom > 0.01 && (
        <g opacity={detailOp}>
          <line x1={hlBL.x} y1={hlBL.y} x2={68} y2={124} stroke={C.highlight} strokeWidth={1} strokeDasharray="3 3" />
          <line x1={hlBR.x} y1={hlBR.y} x2={332} y2={124} stroke={C.highlight} strokeWidth={1} strokeDasharray="3 3" />
        </g>
      )}
      <NucleotideDetail base={sequence[ZOOM_K]} op={detailOp} />

      <text x={CX} y={272} textAnchor="middle" fontSize={7.5} fill="#9ca3af" fontFamily="system-ui">
        DNA · deoxyribonucleic acid
      </text>
    </svg>
  );
}

// ─── Stage data ───────────────────────────────────────────────────────────────
const STAGES = [
  {
    name:      "Double Helix",
    subtitle:  "Overall shape · ~2 nm wide",
    accent:    "#7c3aed",
    accentBg:  "rgba(124,58,237,0.07)",
    dotClass:  "bg-violet-500",
    description: "DNA is two long strands wound around each other into a right-handed double helix. The shape is remarkably uniform: about 2 nm wide, completing one full turn every 3.4 nm — roughly 10 base pairs. In real DNA the two backbones sit slightly off-center from each other, giving the helix a wide major groove and a narrow minor groove (drawn evenly here for clarity).",
    keyPoints: [
      "Two strands twisted into a right-handed helix",
      "Constant width of ~2 nm along the entire molecule",
      "One full turn every 3.4 nm ≈ 10 base pairs (0.34 nm per pair)",
      "Major and minor grooves let proteins read the bases without unzipping the helix",
      "AP exam: Rosalind Franklin's X-ray diffraction image (Photo 51) revealed the helical shape",
    ],
  },
  {
    name:      "The Ladder",
    subtitle:  "Backbone rails · base-pair rungs",
    accent:    "#64748b",
    accentBg:  "rgba(100,116,139,0.08)",
    dotClass:  "bg-slate-500",
    description: "Untwist the helix and it looks like a ladder. The rails are the sugar-phosphate backbone — alternating deoxyribose sugars and phosphate groups joined by strong covalent phosphodiester bonds. The rungs are pairs of nitrogenous bases pointing inward, held together by much weaker hydrogen bonds.",
    keyPoints: [
      "Rails = sugar-phosphate backbone (covalent phosphodiester bonds)",
      "Rungs = nitrogenous base pairs (hydrogen bonds)",
      "Phosphates are negatively charged, so the outside of DNA is hydrophilic",
      "The hydrophobic bases are tucked inside, stacked on top of one another",
      "Weak H-bonds let strands separate for copying; the strong backbone keeps the sequence intact",
    ],
  },
  {
    name:      "Base Pairing",
    subtitle:  "A = T · G ≡ C",
    accent:    "#f59e0b",
    accentBg:  "rgba(245,158,11,0.08)",
    dotClass:  "bg-amber-500",
    description: "Bases pair by complementary rules: adenine with thymine (2 hydrogen bonds) and guanine with cytosine (3 hydrogen bonds). Every pair joins a two-ring purine to a one-ring pyrimidine, which is why the helix stays the same width everywhere. Edit the strand in the builder below and watch the partner strand follow the rules.",
    keyPoints: [
      "Purines (2 rings): adenine (A) and guanine (G)",
      "Pyrimidines (1 ring): thymine (T) and cytosine (C)",
      "A pairs with T using 2 H-bonds; G pairs with C using 3 H-bonds",
      "Chargaff's rule: in double-stranded DNA, %A = %T and %G = %C",
      "More G–C pairs = more H-bonds = more heat needed to separate the strands",
    ],
  },
  {
    name:      "Antiparallel",
    subtitle:  "5′ → 3′ beside 3′ → 5′",
    accent:    "#3b82f6",
    accentBg:  "rgba(59,130,246,0.08)",
    dotClass:  "bg-blue-500",
    description: "The two strands run in opposite directions. Each strand has a 5′ end (a free phosphate on the 5′ carbon) and a 3′ end (a free –OH on the 3′ carbon). Where one strand runs 5′ → 3′, its partner runs 3′ → 5′. This matters enormously: DNA polymerase can only add new nucleotides to a 3′ end.",
    keyPoints: [
      "Each strand has direction: 5′ phosphate end → 3′ hydroxyl end",
      "Partner strands run in opposite directions (antiparallel)",
      "Sequences are written 5′ → 3′ by convention",
      "DNA polymerase only builds 5′ → 3′ — the reason for leading and lagging strands in replication",
      "AP exam: be ready to label the 5′ and 3′ ends of both strands on a diagram",
    ],
  },
  {
    name:      "Nucleotide",
    subtitle:  "Phosphate · sugar · base",
    accent:    "#10b981",
    accentBg:  "rgba(16,185,129,0.08)",
    dotClass:  "bg-emerald-500",
    description: "Zoom in on one rung and you'll find DNA's building block: the nucleotide. It has three parts — a phosphate group, a five-carbon deoxyribose sugar, and one nitrogenous base. The sugar's carbons are numbered 1′ to 5′: the base attaches at 1′, the phosphate at 5′, and the next nucleotide links to the free 3′ –OH.",
    keyPoints: [
      "Phosphate group attached to the 5′ carbon",
      "Deoxyribose — \"deoxy\" because the 2′ carbon has –H instead of –OH (RNA's ribose has –OH)",
      "Nitrogenous base attached to the 1′ carbon",
      "Phosphodiester bond: links the 3′ –OH of one sugar to the 5′ phosphate of the next",
      "The order of bases — not the backbone — carries the genetic information",
    ],
  },
] as const;

const STAGE_COUNT    = STAGES.length;
const DRAG_PER_STAGE = 108;

// ─── Shared context ───────────────────────────────────────────────────────────
interface DnaCtxValue {
  clampedProgress:   number;
  snapIdx:           number;
  progressPct:       number;
  cur:               (typeof STAGES)[number];
  springTo:          (target: number) => void;
  setProgressDirect: (value: number) => void;
  animRef:           React.MutableRefObject<AnimationPlaybackControls | null>;
  sequence:          readonly Base[];
  setSequence:       (seq: readonly Base[]) => void;
}

const DnaCtx = createContext<DnaCtxValue | null>(null);
function useDnaCtx() {
  const ctx = useContext(DnaCtx);
  if (!ctx) throw new Error("Must be inside DnaStructureProvider");
  return ctx;
}

export function DnaStructureProvider({ children }: { children: React.ReactNode }) {
  const progress = useMotionValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  useMotionValueEvent(progress, "change", setDisplayProgress);
  const animRef = useRef<AnimationPlaybackControls | null>(null);
  const [sequence, setSequence] = useState<readonly Base[]>(DEFAULT_SEQUENCE);

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
    <DnaCtx.Provider value={{
      clampedProgress: clamped,
      snapIdx,
      progressPct: (clamped / (STAGE_COUNT - 1)) * 100,
      cur: STAGES[snapIdx],
      springTo, setProgressDirect, animRef,
      sequence, setSequence,
    }}>
      {children}
    </DnaCtx.Provider>
  );
}

// ─── DnaStructureViewer ───────────────────────────────────────────────────────
export function DnaStructureViewer() {
  const { clampedProgress, snapIdx, progressPct, cur, springTo, setProgressDirect, animRef, sequence } = useDnaCtx();

  const [isDragging,     setIsDragging]     = useState(false);
  const [hasEverDragged, setHasEverDragged] = useState(false);
  const dragStartX          = useRef(0);
  const progressAtDragStart = useRef(0);

  // Helix rotation — only while the helix is (partly) twisted
  const prefersReducedMotion = useReducedMotion();
  const [playChoice, setPlayChoice] = useState<boolean | null>(null);
  const isPlaying = playChoice ?? !prefersReducedMotion;
  const [rot, setRot] = useState(0);
  const spinning = isPlaying && clampedProgress < 1;

  useEffect(() => {
    if (!spinning) return;
    let frame = 0;
    let last = performance.now();
    function tick(now: number) {
      setRot((r) => r + (now - last) * ROT_SPEED);
      last = now;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [spinning]);

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
            aria-label={`Go to stage ${i + 1}: ${st.name}`}
            aria-current={snapIdx === i ? "step" : undefined}
            className={`py-2.5 px-0.5 text-[10px] font-semibold leading-tight transition-colors sm:px-1 sm:text-[11px] ${
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
            <HelixDiagram progress={clampedProgress} rot={rot} sequence={sequence} />
          </div>
          {snapIdx === 0 && (
            <button onClick={() => setPlayChoice(!isPlaying)} aria-pressed={isPlaying}
              className="absolute right-3 top-3 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-[11px] font-semibold text-zinc-600 shadow-sm transition hover:bg-white">
              {isPlaying ? "❚❚ Pause rotation" : "▶ Rotate helix"}
            </button>
          )}
          {!hasEverDragged && snapIdx === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2.5 rounded-full bg-black/55 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span aria-hidden="true">←</span>drag to unwind the helix<span aria-hidden="true">→</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrub bar */}
        <div className="border-t border-zinc-100 bg-white px-5 pt-4 pb-5">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-400 select-none pointer-events-none">
            ← drag right to zoom in →
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
            {STAGES.map((st, i) => (
              <button key={i} onClick={() => springTo(i)} aria-label={`Go to ${st.name}`}
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

// ─── DnaStructurePanel ────────────────────────────────────────────────────────
export function DnaStructurePanel() {
  const { snapIdx, progressPct, cur, springTo } = useDnaCtx();
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
          {STAGES.map((st, i) => (
            <button key={i} onClick={() => springTo(i)} aria-label={`Go to ${st.name}`}
              className={`h-2 rounded-full transition-all ${snapIdx === i ? "w-6 bg-zinc-800" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DnaSequenceBuilder — edit the top strand, partner strand follows ────────
export function DnaSequenceBuilder() {
  const { sequence, setSequence } = useDnaCtx();
  const partner = sequence.map((b) => COMPLEMENT[b]);

  const counts: Record<Base, number> = { A: 0, T: 0, G: 0, C: 0 };
  sequence.forEach((b) => { counts[b] += 1; counts[COMPLEMENT[b]] += 1; });
  const total   = sequence.length * 2;
  const pct     = (b: Base) => Math.round((counts[b] / total) * 100);
  const gc      = Math.round(((counts.G + counts.C) / total) * 100);
  const hBonds  = sequence.reduce((n, b) => n + hBondCount(b), 0);

  function cycleBase(i: number) {
    setSequence(sequence.map((b, j) => (j === i ? BASE_CYCLE[b] : b)));
  }
  function randomize() {
    const pool: Base[] = ["A", "T", "G", "C"];
    setSequence(sequence.map(() => pool[Math.floor(Math.random() * pool.length)]));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-zinc-900">Edit the top strand</h3>
          <div className="flex gap-2">
            <button onClick={randomize}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
              Randomize
            </button>
            <button onClick={() => setSequence(DEFAULT_SEQUENCE)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
              Reset
            </button>
          </div>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-zinc-500">
          Tap a base to cycle A → T → G → C. The partner strand and the helix diagram update to follow base-pairing rules.
        </p>

        <div className="flex items-stretch gap-1.5">
          <div className="flex w-5 shrink-0 flex-col justify-between py-2 text-[10px] font-bold text-violet-600">
            <span>5′</span><span>3′</span>
          </div>
          <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${sequence.length}, minmax(0, 1fr))` }}>
            {sequence.map((b, i) => (
              <button key={`top-${i}`} onClick={() => cycleBase(i)}
                aria-label={`Top strand base ${i + 1}: ${BASE_NAME[b]}. Press to change.`}
                className={`${BASE_BG_CLASS[b]} flex h-9 items-center justify-center rounded-md text-sm font-black text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600`}>
                {b}
              </button>
            ))}
            {sequence.map((b, i) => (
              <div key={`hb-${i}`} className="flex h-4 items-center justify-center gap-[3px]" aria-hidden="true">
                {Array.from({ length: hBondCount(b) }, (_, k) => (
                  <span key={k} className="h-3 w-px bg-zinc-400" />
                ))}
              </div>
            ))}
            {partner.map((b, i) => (
              <div key={`bot-${i}`} aria-hidden="true"
                className={`${BASE_BG_CLASS[b]} flex h-9 items-center justify-center rounded-md text-sm font-black text-white opacity-80`}>
                {b}
              </div>
            ))}
          </div>
          <div className="flex w-5 shrink-0 flex-col justify-between py-2 text-right text-[10px] font-bold text-violet-600">
            <span>3′</span><span>5′</span>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          Top strand 5′ {sequence.join(" ")} 3′. Partner strand 3′ {partner.join(" ")} 5′.
        </p>
      </div>

      <div className="grid gap-4 border-t border-zinc-100 bg-zinc-50 p-5 sm:grid-cols-[3fr_2fr]">
        <div>
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Base composition (both strands)
          </div>
          <div className="space-y-1.5">
            {(["A", "T", "G", "C"] as const).map((b) => (
              <div key={b} className="flex items-center gap-2 text-xs">
                <span className="w-16 font-semibold text-zinc-600">{BASE_NAME[b]}</span>
                <div className="h-2 flex-1 rounded-full bg-zinc-200">
                  <div className={`h-full rounded-full ${BASE_BG_CLASS[b]} transition-all`} style={{ width: `${pct(b)}%` }} />
                </div>
                <span className="w-8 text-right font-bold tabular-nums text-zinc-700">{pct(b)}%</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Chargaff&apos;s rule holds no matter what you type: %A = %T and %G = %C.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
          <div className="rounded-xl bg-white px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">GC content</div>
            <div className="text-xl font-black tabular-nums text-zinc-900">{gc}%</div>
          </div>
          <div className="rounded-xl bg-white px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Hydrogen bonds</div>
            <div className="text-xl font-black tabular-nums text-zinc-900">{hBonds}</div>
            <div className="text-[11px] text-zinc-500">More = harder to separate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Emblem (lesson card thumbnail) ──────────────────────────────────────────
export function DnaStructureEmblem({ className }: { className?: string }) {
  // A bold stretch of double helix: two backbones with colored base-pair rungs.
  const count = 11;
  const XA = 12, XB = 108, YC = 30, AMP = 20;
  const ex = (u: number) => XA + (u * (XB - XA)) / (count - 1);
  const angle = (u: number) => 0.4 + u * OMEGA;
  const ey = (th: number) => q(YC + AMP * Math.cos(th));
  const strand = (offset: number) =>
    Array.from({ length: (count - 1) * 4 + 1 }, (_, j) => {
      const u = j / 4;
      return `${j === 0 ? "M" : "L"} ${ex(u).toFixed(1)} ${ey(angle(u) + offset).toFixed(1)}`;
    }).join(" ");
  const partner = Math.PI;

  return (
    <svg viewBox="0 -2 120 106" className={className} aria-hidden="true">
      <path d={strand(partner)} fill="none" stroke="#c4b5fd" strokeWidth={4} strokeLinecap="round" />
      {DEFAULT_SEQUENCE.slice(0, count).map((b, i) => {
        const y1 = ey(angle(i));
        const y2 = ey(angle(i) + partner);
        const mid = (y1 + y2) / 2;
        return (
          <g key={i} strokeWidth={4.5} strokeLinecap="round">
            <line x1={ex(i)} y1={y1} x2={ex(i)} y2={mid} stroke={BASE_COLOR[b]} />
            <line x1={ex(i)} y1={mid} x2={ex(i)} y2={y2} stroke={BASE_COLOR[COMPLEMENT[b]]} />
          </g>
        );
      })}
      <path d={strand(0)} fill="none" stroke={C.backbone} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}
