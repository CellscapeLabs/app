"use client";
// Biology concept: Meiosis — two sequential divisions producing 4 haploid daughter cells
// Interactions: Drag right to advance phases, left to go back. Supports homologous pairing,
// crossing over, and independent assortment across Meiosis I and II.

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
  membrane:  "#10b981",
  nucleus:   "#8b5cf6",
  // Maternal chromosomes (from mother) — both violet, regardless of pair
  homA_mat:  "#8b5cf6",
  homB_mat:  "#8b5cf6",
  // Paternal chromosomes (from father) — both amber, regardless of pair
  homA_pat:  "#f59e0b",
  homB_pat:  "#f59e0b",
  spindle:   "#38bdf8",
  plate:     "#94a3b8",
  chiasma:   "#10b981", // green — distinct from both violet and amber
};

// ─── Crossing over ────────────────────────────────────────────────────────────
// Each chromosome has a top segment and a bottom segment that may be swapped
// between homologs after crossing over. 'mat' = maternal (violet), 'pat' = paternal (amber).

type SegColor = 'mat' | 'pat';
interface CrossoverPattern {
  A_mat: [SegColor, SegColor]; // [top, bottom] of the maternal pair-A chromosome
  A_pat: [SegColor, SegColor]; // complement — must be the mirror of A_mat
  B_mat: [SegColor, SegColor];
  B_pat: [SegColor, SegColor];
}

// Default: each pair has had one segment swapped, so no chromosome is purely maternal or paternal
const DEFAULT_CROSSOVER: CrossoverPattern = {
  A_mat: ['mat', 'pat'], A_pat: ['pat', 'mat'],
  B_mat: ['pat', 'mat'], B_pat: ['mat', 'pat'],
};

function randomCrossoverPattern(): CrossoverPattern {
  const aT = Math.random() > 0.5, aB = Math.random() > 0.5;
  const bT = Math.random() > 0.5, bB = Math.random() > 0.5;
  return {
    A_mat: [aT ? 'pat' : 'mat', aB ? 'pat' : 'mat'],
    A_pat: [aT ? 'mat' : 'pat', aB ? 'mat' : 'pat'],
    B_mat: [bT ? 'pat' : 'mat', bB ? 'pat' : 'mat'],
    B_pat: [bT ? 'mat' : 'pat', bB ? 'mat' : 'pat'],
  };
}

// Resolve segment color to actual hex
function sc(s: SegColor): string { return s === 'mat' ? C.homA_mat : C.homA_pat; }
// Shortcut: get [topHex, botHex] for a named chromosome key
function cc(k: keyof CrossoverPattern, co: CrossoverPattern): [string, string] {
  return [sc(co[k][0]), sc(co[k][1])];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Chrom {
  cx: number; cy: number;
  size: number; opacity: number; angle: number;
  color: string;
}
interface VChrom { cx: number; cy: number; opacity: number; color: string }
interface ReformNuc { cx: number; cy: number; rx: number; ry: number; opacity: number }

interface PhaseState {
  // Main cell
  cellRx: number; cellRy: number; cellOp: number;
  // Nucleus
  nucOp: number; nuclOp: number; chromatinOp: number;
  // Centrosomes
  centroTopY: number; centroTopOp: number;
  centroBotY: number; centroBotOp: number;
  // Spindle / plate
  spindleOp: number; plateOp: number;
  // Cleavage furrow (Meiosis I)
  furrowI: number;
  // Homologous chromosome pairs as bivalents (prophase I / metaphase I)
  // [pairA_left, pairA_right, pairB_left, pairB_right]
  bivalents: [Chrom, Chrom, Chrom, Chrom];
  // Chiasma X overlay opacity (crossing over marker)
  chiasmaOp: number;
  // Separated homologs moving to poles in anaphase I
  // top: pair A maternal + pair B paternal (one possible assortment)
  // bot: pair A paternal + pair B maternal
  sepTop: [Chrom, Chrom];
  sepBot: [Chrom, Chrom];
  // Reform nuclei after Meiosis I
  nucTopI: ReformNuc; nucBotI: ReformNuc;
  // Two daughter cells from Meiosis I
  dcTopOp: number; dcBotOp: number;
  dcTopCy: number; dcBotCy: number;
  dcRx: number; dcRy: number;
  // Meiosis II — sister chromatid V-shapes in top cell
  vtop2: [VChrom, VChrom]; // top cell, arms up
  vbot2: [VChrom, VChrom]; // top cell, arms down
  // Meiosis II — sister chromatid V-shapes in bottom cell
  vtop2b: [VChrom, VChrom]; // bottom cell, arms up
  vbot2b: [VChrom, VChrom]; // bottom cell, arms down
  // 4 haploid nuclei (end state)
  nuc4: [ReformNuc, ReformNuc, ReformNuc, ReformNuc];
  // 4 final cells
  cells4: [ReformNuc, ReformNuc, ReformNuc, ReformNuc]; cells4Op: number;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function lc(a: Chrom, b: Chrom, t: number): Chrom {
  return { cx: lerp(a.cx,b.cx,t), cy: lerp(a.cy,b.cy,t), size: lerp(a.size,b.size,t),
    opacity: lerp(a.opacity,b.opacity,t), angle: lerp(a.angle,b.angle,t), color: t < 0.5 ? a.color : b.color };
}
function lv(a: VChrom, b: VChrom, t: number): VChrom {
  return { cx: lerp(a.cx,b.cx,t), cy: lerp(a.cy,b.cy,t),
    opacity: lerp(a.opacity,b.opacity,t), color: t < 0.5 ? a.color : b.color };
}
function lrn(a: ReformNuc, b: ReformNuc, t: number): ReformNuc {
  return { cx: lerp(a.cx,b.cx,t), cy: lerp(a.cy,b.cy,t),
    rx: lerp(a.rx,b.rx,t), ry: lerp(a.ry,b.ry,t), opacity: lerp(a.opacity,b.opacity,t) };
}

function lerpState(a: PhaseState, b: PhaseState, t: number): PhaseState {
  return {
    cellRx: lerp(a.cellRx,b.cellRx,t), cellRy: lerp(a.cellRy,b.cellRy,t), cellOp: lerp(a.cellOp,b.cellOp,t),
    nucOp: lerp(a.nucOp,b.nucOp,t), nuclOp: lerp(a.nuclOp,b.nuclOp,t), chromatinOp: lerp(a.chromatinOp,b.chromatinOp,t),
    centroTopY: lerp(a.centroTopY,b.centroTopY,t), centroTopOp: lerp(a.centroTopOp,b.centroTopOp,t),
    centroBotY: lerp(a.centroBotY,b.centroBotY,t), centroBotOp: lerp(a.centroBotOp,b.centroBotOp,t),
    spindleOp: lerp(a.spindleOp,b.spindleOp,t), plateOp: lerp(a.plateOp,b.plateOp,t),
    furrowI: lerp(a.furrowI,b.furrowI,t),
    bivalents: [lc(a.bivalents[0],b.bivalents[0],t), lc(a.bivalents[1],b.bivalents[1],t),
                lc(a.bivalents[2],b.bivalents[2],t), lc(a.bivalents[3],b.bivalents[3],t)],
    chiasmaOp: lerp(a.chiasmaOp,b.chiasmaOp,t),
    sepTop: [lc(a.sepTop[0],b.sepTop[0],t), lc(a.sepTop[1],b.sepTop[1],t)],
    sepBot: [lc(a.sepBot[0],b.sepBot[0],t), lc(a.sepBot[1],b.sepBot[1],t)],
    nucTopI: lrn(a.nucTopI,b.nucTopI,t), nucBotI: lrn(a.nucBotI,b.nucBotI,t),
    dcTopOp: lerp(a.dcTopOp,b.dcTopOp,t), dcBotOp: lerp(a.dcBotOp,b.dcBotOp,t),
    dcTopCy: lerp(a.dcTopCy,b.dcTopCy,t), dcBotCy: lerp(a.dcBotCy,b.dcBotCy,t),
    dcRx: lerp(a.dcRx,b.dcRx,t), dcRy: lerp(a.dcRy,b.dcRy,t),
    vtop2: [lv(a.vtop2[0],b.vtop2[0],t), lv(a.vtop2[1],b.vtop2[1],t)],
    vbot2: [lv(a.vbot2[0],b.vbot2[0],t), lv(a.vbot2[1],b.vbot2[1],t)],
    vtop2b: [lv(a.vtop2b[0],b.vtop2b[0],t), lv(a.vtop2b[1],b.vtop2b[1],t)],
    vbot2b: [lv(a.vbot2b[0],b.vbot2b[0],t), lv(a.vbot2b[1],b.vbot2b[1],t)],
    nuc4: [lrn(a.nuc4[0],b.nuc4[0],t), lrn(a.nuc4[1],b.nuc4[1],t),
           lrn(a.nuc4[2],b.nuc4[2],t), lrn(a.nuc4[3],b.nuc4[3],t)],
    cells4: [lrn(a.cells4[0],b.cells4[0],t), lrn(a.cells4[1],b.cells4[1],t),
             lrn(a.cells4[2],b.cells4[2],t), lrn(a.cells4[3],b.cells4[3],t)],
    cells4Op: lerp(a.cells4Op,b.cells4Op,t),
  };
}

// ─── Shared blank helpers ─────────────────────────────────────────────────────

const HIDDEN_CHROM = (color: string): Chrom => ({ cx:200, cy:140, size:12, opacity:0, angle:0, color });
const HIDDEN_V = (color: string): VChrom => ({ cx:200, cy:140, opacity:0, color });
const HIDDEN_NUC = (): ReformNuc => ({ cx:200, cy:140, rx:0, ry:0, opacity:0 });

// ─── Phase keyframes ──────────────────────────────────────────────────────────
// SVG viewBox: 0 0 400 280   centre: (200, 140)
// Meiosis I: phases 0-5 in the single original cell
// Meiosis II: phases 6-9, both daughter cells divide simultaneously
// Phase 10: 4 haploid cells final

const PS: PhaseState[] = [

  // ── 0  INTERPHASE I ────────────────────────────────────────────────────────
  {
    cellRx:150, cellRy:105, cellOp:1,
    nucOp:1, nuclOp:1, chromatinOp:1,
    centroTopY:100, centroTopOp:0, centroBotY:180, centroBotOp:0,
    spindleOp:0, plateOp:0, furrowI:0,
    bivalents:[
      HIDDEN_CHROM(C.homA_mat), HIDDEN_CHROM(C.homA_pat),
      HIDDEN_CHROM(C.homB_mat), HIDDEN_CHROM(C.homB_pat),
    ],
    chiasmaOp:0,
    // Parked at Telophase I positions (opacity=0) so they fade in-place, not drift to center
    sepTop:[
      { cx:172, cy:76,  size:10, opacity:0, angle:20,  color:C.homA_mat },
      { cx:220, cy:76,  size:10, opacity:0, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:180, cy:204, size:10, opacity:0, angle:-20, color:C.homA_pat },
      { cx:228, cy:204, size:10, opacity:0, angle:15,  color:C.homB_mat },
    ],
    nucTopI:HIDDEN_NUC(), nucBotI:HIDDEN_NUC(),
    dcTopOp:0, dcBotOp:0, dcTopCy:140, dcBotCy:140, dcRx:110, dcRy:58,
    // Parked at Metaphase II positions (opacity=0) — fade in-place, no drift from centre
    vtop2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vbot2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vtop2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    vbot2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    nuc4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()],
    cells4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()], cells4Op:0,
  },

  // ── 1  PROPHASE I — homologs pair (synapsis) + crossing over ───────────────
  {
    cellRx:150, cellRy:105, cellOp:1,
    nucOp:0.3, nuclOp:0, chromatinOp:0,
    centroTopY:52, centroTopOp:1, centroBotY:228, centroBotOp:1,
    spindleOp:0.2, plateOp:0, furrowI:0,
    // bivalents: two homologs touching side-by-side (synapsis)
    bivalents:[
      { cx:172, cy:118, size:13, opacity:1, angle:20,  color:C.homA_mat },
      { cx:190, cy:118, size:13, opacity:1, angle:-20, color:C.homA_pat },
      { cx:210, cy:162, size:13, opacity:1, angle:15,  color:C.homB_mat },
      { cx:228, cy:162, size:13, opacity:1, angle:-15, color:C.homB_pat },
    ],
    chiasmaOp:0.9,
    sepTop:[
      { cx:172, cy:118, size:12, opacity:0, angle:20,  color:C.homA_mat },
      { cx:228, cy:162, size:12, opacity:0, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:190, cy:118, size:12, opacity:0, angle:-20, color:C.homA_pat },
      { cx:210, cy:162, size:12, opacity:0, angle:15,  color:C.homB_mat },
    ],
    nucTopI:HIDDEN_NUC(), nucBotI:HIDDEN_NUC(),
    dcTopOp:0, dcBotOp:0, dcTopCy:140, dcBotCy:140, dcRx:110, dcRy:58,
    // Parked at Metaphase II positions (opacity=0) — fade in-place, no drift from centre
    vtop2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vbot2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vtop2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    vbot2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    nuc4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()],
    cells4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()], cells4Op:0,
  },

  // ── 2  METAPHASE I — bivalents at equator ──────────────────────────────────
  {
    cellRx:150, cellRy:105, cellOp:1,
    nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:38, centroTopOp:1, centroBotY:242, centroBotOp:1,
    spindleOp:0.55, plateOp:0.55, furrowI:0,
    bivalents:[
      { cx:172, cy:140, size:13, opacity:1, angle:20,  color:C.homA_mat },
      { cx:190, cy:140, size:13, opacity:1, angle:-20, color:C.homA_pat },
      { cx:210, cy:140, size:13, opacity:1, angle:15,  color:C.homB_mat },
      { cx:228, cy:140, size:13, opacity:1, angle:-15, color:C.homB_pat },
    ],
    chiasmaOp:0.7,
    sepTop:[
      { cx:172, cy:140, size:12, opacity:0, angle:20,  color:C.homA_mat },
      { cx:228, cy:140, size:12, opacity:0, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:190, cy:140, size:12, opacity:0, angle:-20, color:C.homA_pat },
      { cx:210, cy:140, size:12, opacity:0, angle:15,  color:C.homB_mat },
    ],
    nucTopI:HIDDEN_NUC(), nucBotI:HIDDEN_NUC(),
    dcTopOp:0, dcBotOp:0, dcTopCy:140, dcBotCy:140, dcRx:110, dcRy:58,
    // Parked at Metaphase II positions (opacity=0) — fade in-place, no drift from centre
    vtop2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vbot2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vtop2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    vbot2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    nuc4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()],
    cells4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()], cells4Op:0,
  },

  // ── 3  ANAPHASE I — homologs separate (NOT sister chromatids) ──────────────
  {
    cellRx:130, cellRy:122, cellOp:1,
    nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:1, centroBotY:256, centroBotOp:1,
    spindleOp:0.55, plateOp:0, furrowI:0,
    bivalents:[
      { cx:172, cy:140, size:13, opacity:0, angle:20,  color:C.homA_mat },
      { cx:190, cy:140, size:13, opacity:0, angle:-20, color:C.homA_pat },
      { cx:210, cy:140, size:13, opacity:0, angle:15,  color:C.homB_mat },
      { cx:228, cy:140, size:13, opacity:0, angle:-15, color:C.homB_pat },
    ],
    chiasmaOp:0,
    // Homologs pulled to poles — each retains BOTH sister chromatids (still X-shaped)
    sepTop:[
      { cx:172, cy:80,  size:12, opacity:1, angle:20,  color:C.homA_mat },
      { cx:220, cy:80,  size:12, opacity:1, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:180, cy:200, size:12, opacity:1, angle:-20, color:C.homA_pat },
      { cx:228, cy:200, size:12, opacity:1, angle:15,  color:C.homB_mat },
    ],
    nucTopI:HIDDEN_NUC(), nucBotI:HIDDEN_NUC(),
    dcTopOp:0, dcBotOp:0, dcTopCy:140, dcBotCy:140, dcRx:110, dcRy:58,
    // Parked at Metaphase II positions (opacity=0) — fade in-place, no drift from centre
    vtop2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vbot2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vtop2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    vbot2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    nuc4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()],
    cells4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()], cells4Op:0,
  },

  // ── 4  TELOPHASE I — single cell pinched by cleavage furrow; nuclei reforming ─
  // Cell is still ONE connected cell — cytokinesis hasn't completed yet.
  {
    cellRx:118, cellRy:122, cellOp:1,
    nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:0, centroBotY:256, centroBotOp:0,
    spindleOp:0.06, plateOp:0, furrowI:0.88,
    bivalents:[
      HIDDEN_CHROM(C.homA_mat), HIDDEN_CHROM(C.homA_pat),
      HIDDEN_CHROM(C.homB_mat), HIDDEN_CHROM(C.homB_pat),
    ],
    chiasmaOp:0,
    sepTop:[
      { cx:172, cy:76, size:10, opacity:0.6, angle:20,  color:C.homA_mat },
      { cx:220, cy:76, size:10, opacity:0.6, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:180, cy:204, size:10, opacity:0.6, angle:-20, color:C.homA_pat },
      { cx:228, cy:204, size:10, opacity:0.6, angle:15,  color:C.homB_mat },
    ],
    nucTopI:{ cx:200, cy:76,  rx:44, ry:28, opacity:1 },
    nucBotI:{ cx:200, cy:204, rx:44, ry:28, opacity:1 },
    dcTopOp:0, dcBotOp:0, dcTopCy:76, dcBotCy:204, dcRx:110, dcRy:56,
    // Parked at Metaphase II positions (opacity=0) — fade in-place, no drift from centre
    vtop2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vbot2:[ { cx:185, cy:76,  opacity:0, color:C.homA_mat }, { cx:215, cy:76,  opacity:0, color:C.homB_pat } ],
    vtop2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    vbot2b:[ { cx:185, cy:204, opacity:0, color:C.homA_pat }, { cx:215, cy:204, opacity:0, color:C.homB_mat } ],
    nuc4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()],
    cells4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()], cells4Op:0,
  },

  // ── 5  METAPHASE II — sister chromatids align in BOTH cells ────────────────
  // Both daughter cells doing Meiosis II simultaneously. Top cell: violet+rose.
  // Bottom cell: amber+sky.
  {
    cellRx:130, cellRy:122, cellOp:0,
    nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:0, centroBotY:256, centroBotOp:0,
    spindleOp:0, plateOp:0, furrowI:0,
    bivalents:[
      HIDDEN_CHROM(C.homA_mat), HIDDEN_CHROM(C.homA_pat),
      HIDDEN_CHROM(C.homB_mat), HIDDEN_CHROM(C.homB_pat),
    ],
    chiasmaOp:0,
    // Parked at Telophase I positions (opacity=0) so they fade in-place, not drift to center
    sepTop:[
      { cx:172, cy:76,  size:10, opacity:0, angle:20,  color:C.homA_mat },
      { cx:220, cy:76,  size:10, opacity:0, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:180, cy:204, size:10, opacity:0, angle:-20, color:C.homA_pat },
      { cx:228, cy:204, size:10, opacity:0, angle:15,  color:C.homB_mat },
    ],
    nucTopI:{ cx:200, cy:76,  rx:0, ry:0, opacity:0 },
    nucBotI:{ cx:200, cy:204, rx:0, ry:0, opacity:0 },
    dcTopOp:1, dcBotOp:1, dcTopCy:76, dcBotCy:204, dcRx:110, dcRy:56,
    // Top cell: V-chromatids at equator — close together so both go to the same final pole
    vtop2:[ { cx:185, cy:76, opacity:1, color:C.homA_mat }, { cx:215, cy:76, opacity:1, color:C.homB_pat } ],
    vbot2:[ { cx:185, cy:76, opacity:1, color:C.homA_mat }, { cx:215, cy:76, opacity:1, color:C.homB_pat } ],
    // Bottom cell: V-chromatids at equator (cy=204)
    vtop2b:[ { cx:185, cy:204, opacity:1, color:C.homA_pat }, { cx:215, cy:204, opacity:1, color:C.homB_mat } ],
    vbot2b:[ { cx:185, cy:204, opacity:1, color:C.homA_pat }, { cx:215, cy:204, opacity:1, color:C.homB_mat } ],
    nuc4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()],
    cells4:[HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC(),HIDDEN_NUC()], cells4Op:0,
  },

  // ── 6  ANAPHASE II — sister chromatids pulled apart in both cells ───────────
  {
    cellRx:130, cellRy:122, cellOp:0,
    nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:0, centroBotY:256, centroBotOp:0,
    spindleOp:0, plateOp:0, furrowI:0,
    bivalents:[
      HIDDEN_CHROM(C.homA_mat), HIDDEN_CHROM(C.homA_pat),
      HIDDEN_CHROM(C.homB_mat), HIDDEN_CHROM(C.homB_pat),
    ],
    chiasmaOp:0,
    // Parked at Telophase I positions (opacity=0) so they fade in-place, not drift to center
    sepTop:[
      { cx:172, cy:76,  size:10, opacity:0, angle:20,  color:C.homA_mat },
      { cx:220, cy:76,  size:10, opacity:0, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:180, cy:204, size:10, opacity:0, angle:-20, color:C.homA_pat },
      { cx:228, cy:204, size:10, opacity:0, angle:15,  color:C.homB_mat },
    ],
    nucTopI:HIDDEN_NUC(), nucBotI:HIDDEN_NUC(),
    dcTopOp:1, dcBotOp:1, dcTopCy:76, dcBotCy:204, dcRx:110, dcRy:56,
    // Top cell — both chromosomes of each pole stay together as they separate
    vtop2:[ { cx:185, cy:52, opacity:1, color:C.homA_mat }, { cx:215, cy:52, opacity:1, color:C.homB_pat } ],
    vbot2:[ { cx:185, cy:100, opacity:1, color:C.homA_mat }, { cx:215, cy:100, opacity:1, color:C.homB_pat } ],
    // Bottom cell — same
    vtop2b:[ { cx:185, cy:180, opacity:1, color:C.homA_pat }, { cx:215, cy:180, opacity:1, color:C.homB_mat } ],
    vbot2b:[ { cx:185, cy:228, opacity:1, color:C.homA_pat }, { cx:215, cy:228, opacity:1, color:C.homB_mat } ],
    // Cells seeded at final positions with rx=0 — they grow from nothing during transition to phase 7
    nuc4:[
      { cx:125, cy:76,  rx:0, ry:0, opacity:1 },
      { cx:275, cy:76,  rx:0, ry:0, opacity:1 },
      { cx:125, cy:204, rx:0, ry:0, opacity:1 },
      { cx:275, cy:204, rx:0, ry:0, opacity:1 },
    ],
    cells4:[
      { cx:125, cy:76,  rx:0, ry:0, opacity:1 },
      { cx:275, cy:76,  rx:0, ry:0, opacity:1 },
      { cx:125, cy:204, rx:0, ry:0, opacity:1 },
      { cx:275, cy:204, rx:0, ry:0, opacity:1 },
    ], cells4Op:1,
  },

  // ── 7  TELOPHASE II / 4 HAPLOID CELLS ──────────────────────────────────────
  {
    cellRx:130, cellRy:122, cellOp:0,
    nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:0, centroBotY:256, centroBotOp:0,
    spindleOp:0, plateOp:0, furrowI:0,
    bivalents:[
      HIDDEN_CHROM(C.homA_mat), HIDDEN_CHROM(C.homA_pat),
      HIDDEN_CHROM(C.homB_mat), HIDDEN_CHROM(C.homB_pat),
    ],
    chiasmaOp:0,
    // Parked at Telophase I positions (opacity=0) so they fade in-place, not drift to center
    sepTop:[
      { cx:172, cy:76,  size:10, opacity:0, angle:20,  color:C.homA_mat },
      { cx:220, cy:76,  size:10, opacity:0, angle:-15, color:C.homB_pat },
    ],
    sepBot:[
      { cx:180, cy:204, size:10, opacity:0, angle:-20, color:C.homA_pat },
      { cx:228, cy:204, size:10, opacity:0, angle:15,  color:C.homB_mat },
    ],
    nucTopI:HIDDEN_NUC(), nucBotI:HIDDEN_NUC(),
    dcTopOp:0, dcBotOp:0, dcTopCy:76, dcBotCy:204, dcRx:110, dcRy:56,
    // vtop2 (top pole of top cell) → top-left; vbot2 (bottom pole) → top-right
    // vtop2b (top pole of bottom cell) → bottom-left; vbot2b → bottom-right
    // Each pair brings one violet + one amber to the same cell — no color change
    vtop2:[  { cx:125, cy:76,  opacity:0, color:C.homA_mat }, { cx:125, cy:76,  opacity:0, color:C.homB_pat } ],
    vbot2:[  { cx:275, cy:76,  opacity:0, color:C.homA_mat }, { cx:275, cy:76,  opacity:0, color:C.homB_pat } ],
    vtop2b:[ { cx:125, cy:204, opacity:0, color:C.homA_pat }, { cx:125, cy:204, opacity:0, color:C.homB_mat } ],
    vbot2b:[ { cx:275, cy:204, opacity:0, color:C.homA_pat }, { cx:275, cy:204, opacity:0, color:C.homB_mat } ],
    // 4 nuclei reform — centered at each cell's midpoint
    nuc4:[
      { cx:125, cy:76,  rx:19, ry:14, opacity:1 },
      { cx:275, cy:76,  rx:19, ry:14, opacity:1 },
      { cx:125, cy:204, rx:19, ry:14, opacity:1 },
      { cx:275, cy:204, rx:19, ry:14, opacity:1 },
    ],
    // 4 cells spread wide — 42px gap between left/right pairs, 48px between top/bottom
    cells4:[
      { cx:125, cy:76,  rx:54, ry:40, opacity:1 },
      { cx:275, cy:76,  rx:54, ry:40, opacity:1 },
      { cx:125, cy:204, rx:54, ry:40, opacity:1 },
      { cx:275, cy:204, rx:54, ry:40, opacity:1 },
    ],
    cells4Op:1,
  },
];

// ─── Interpolated cell SVG ────────────────────────────────────────────────────

// Chromosome X-shape with two-tone segments showing crossed-over DNA.
// top = color of top arm + top-left crossbar; bot = color of bottom arm + bottom-right crossbar.
function XChrom({ ch, top, bot }: { ch: Chrom; top: string; bot: string }) {
  if (ch.opacity < 0.01) return null;
  return (
    <g transform={`translate(${ch.cx},${ch.cy}) rotate(${ch.angle})`} opacity={ch.opacity}>
      <line x1={0} y1={-ch.size} x2={0} y2={0}           stroke={top} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={0} y1={0}        x2={0} y2={ch.size}      stroke={bot} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={-ch.size*0.7} y1={-ch.size*0.3} x2={0} y2={0} stroke={top} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={ch.size*0.7} y2={ch.size*0.3}   stroke={bot} strokeWidth={4.5} strokeLinecap="round" />
      {ch.size > 6 && <circle r={2.5} fill="white" opacity={0.6} />}
    </g>
  );
}

// V-chromatid going toward top pole — left arm = top segment color, right arm = bot segment color
function VUp({ v, top, bot }: { v: VChrom; top: string; bot: string }) {
  if (v.opacity < 0.01) return null;
  return (
    <g opacity={v.opacity}>
      <line x1={v.cx} y1={v.cy} x2={v.cx-7} y2={v.cy-10} stroke={top} strokeWidth={4} strokeLinecap="round" />
      <line x1={v.cx} y1={v.cy} x2={v.cx+7} y2={v.cy-10} stroke={bot} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

function VDown({ v, top, bot }: { v: VChrom; top: string; bot: string }) {
  if (v.opacity < 0.01) return null;
  return (
    <g opacity={v.opacity}>
      <line x1={v.cx} y1={v.cy} x2={v.cx-7} y2={v.cy+10} stroke={top} strokeWidth={4} strokeLinecap="round" />
      <line x1={v.cx} y1={v.cy} x2={v.cx+7} y2={v.cy+10} stroke={bot} strokeWidth={4} strokeLinecap="round" />
    </g>
  );
}

function InterpolatedCell({ progress, crossover }: { progress: number; crossover: CrossoverPattern }) {
  const clamped = Math.max(0, Math.min(progress, PS.length - 1));
  const fi = Math.min(Math.floor(clamped), PS.length - 1);
  const ci = Math.min(fi + 1, PS.length - 1);
  const t  = fi === ci ? 0 : clamped - fi;
  const s  = lerpState(PS[fi], PS[ci], t);

  // Furrow notch x-coords
  const fwL = 112 + s.furrowI * 38;
  const fwR = 288 - s.furrowI * 38;

  // Label visibility
  const showBivalentLabel = s.bivalents[0].opacity > 0.1 && s.chiasmaOp > 0.1;
  const showChiasmaLabel  = s.chiasmaOp > 0.3;
  const showSepLabel      = s.sepTop[0].opacity > 0.3;
  const showHaploidLabel  = s.cells4[0].rx > 10;

  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" aria-label="Meiosis cell diagram">

      {/* ── Main cell (Meiosis I) ── */}
      {s.cellOp > 0.01 && (
        <ellipse cx={200} cy={140} rx={s.cellRx} ry={s.cellRy}
          fill="rgba(16,185,129,0.05)" stroke={C.membrane} strokeWidth={2.5}
          strokeDasharray="12 5" opacity={s.cellOp} />
      )}

      {/* ── Cleavage furrow — anchored to actual cell edge so notches align correctly ── */}
      {s.furrowI > 0.01 && s.cellOp > 0.01 && (() => {
        const cL = 200 - s.cellRx;
        const cR = 200 + s.cellRx;
        return <>
          <path d={`M ${cL} 140 Q ${fwL-16} 136 ${fwL} 140 Q ${fwL-16} 144 ${cL} 140`}
            fill={C.membrane} fillOpacity={0.1} stroke={C.membrane} strokeWidth={1.4}
            opacity={s.furrowI} />
          <path d={`M ${cR} 140 Q ${fwR+16} 136 ${fwR} 140 Q ${fwR+16} 144 ${cR} 140`}
            fill={C.membrane} fillOpacity={0.1} stroke={C.membrane} strokeWidth={1.4}
            opacity={s.furrowI} />
        </>;
      })()}

      {/* ── Daughter cells (Meiosis I products) ── */}
      {s.dcTopOp > 0.01 && (
        <ellipse cx={200} cy={s.dcTopCy} rx={s.dcRx} ry={s.dcRy}
          fill="rgba(16,185,129,0.05)" stroke={C.membrane} strokeWidth={2.2}
          strokeDasharray="11 5" opacity={s.dcTopOp} />
      )}
      {s.dcBotOp > 0.01 && (
        <ellipse cx={200} cy={s.dcBotCy} rx={s.dcRx} ry={s.dcRy}
          fill="rgba(16,185,129,0.05)" stroke={C.membrane} strokeWidth={2.2}
          strokeDasharray="11 5" opacity={s.dcBotOp} />
      )}

      {/* ── 4 final haploid cells — top pair violet (Meiosis I cell 1), bottom amber (cell 2) ── */}
      {s.cells4Op > 0.01 && s.cells4.map((c, i) => (
        <ellipse key={`c4_${i}`} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry}
          fill={i < 2 ? "rgba(139,92,246,0.1)" : "rgba(245,158,11,0.08)"}
          stroke={i < 2 ? "#a78bfa" : "#f59e0b"}
          strokeWidth={2} strokeDasharray="9 4" opacity={c.opacity * s.cells4Op} />
      ))}

      {/* ── Nuclear envelope (interphase) ── */}
      {s.nucOp > 0.01 && (
        <circle cx={200} cy={140} r={56}
          fill="rgba(139,92,246,0.07)" stroke={C.nucleus} strokeWidth={2}
          strokeDasharray={s.nucOp > 0.6 ? "7 3" : "4 7"} opacity={s.nucOp} />
      )}

      {/* ── Nucleolus ── */}
      {s.nuclOp > 0.01 && <>
        <circle cx={196} cy={136} r={20} fill="rgba(139,92,246,0.28)" opacity={s.nuclOp} />
        <circle cx={196} cy={136} r={11} fill="rgba(109,40,217,0.42)" opacity={s.nuclOp} />
      </>}

      {/* ── Chromatin (interphase) ── */}
      {s.chromatinOp > 0.01 && [
        "M 184 150 Q 192 141 188 129",
        "M 209 150 Q 216 141 211 129",
        "M 196 162 Q 207 156 212 164",
        "M 177 140 Q 169 133 174 123",
        "M 220 146 Q 230 140 226 131",
      ].map((d,i) => (
        <path key={i} d={d} fill="none" stroke={C.nucleus} strokeWidth={2}
          opacity={s.chromatinOp * 0.4} strokeLinecap="round" />
      ))}

      {/* ── Centrosomes ── */}
      {s.centroTopOp > 0.01 && (
        <circle cx={200} cy={s.centroTopY} r={5} fill={C.spindle} opacity={s.centroTopOp} />
      )}
      {s.centroBotOp > 0.01 && (
        <circle cx={200} cy={s.centroBotY} r={5} fill={C.spindle} opacity={s.centroBotOp} />
      )}

      {/* ── Spindle fibers to bivalents ── */}
      {s.spindleOp > 0.01 && s.centroTopOp > 0.01 && s.bivalents.map((ch, i) => ch.opacity > 0.01 ? (
        <g key={`bsp${i}`} opacity={s.spindleOp * ch.opacity}>
          <line x1={200} y1={s.centroTopY} x2={ch.cx} y2={ch.cy}
            stroke={C.spindle} strokeWidth={0.8} />
          <line x1={200} y1={s.centroBotY} x2={ch.cx} y2={ch.cy}
            stroke={C.spindle} strokeWidth={0.8} />
        </g>
      ) : null)}

      {/* ── Spindle fibers to separated homologs ── */}
      {s.spindleOp > 0.01 && s.centroTopOp > 0.01 && <>
        {s.sepTop.map((ch, i) => ch.opacity > 0.01 ? (
          <line key={`stsp${i}`} x1={200} y1={s.centroTopY} x2={ch.cx} y2={ch.cy}
            stroke={C.spindle} strokeWidth={0.8} opacity={s.spindleOp * ch.opacity} />
        ) : null)}
        {s.sepBot.map((ch, i) => ch.opacity > 0.01 ? (
          <line key={`sbsp${i}`} x1={200} y1={s.centroBotY} x2={ch.cx} y2={ch.cy}
            stroke={C.spindle} strokeWidth={0.8} opacity={s.spindleOp * ch.opacity} />
        ) : null)}
      </>}

      {/* ── Metaphase plate ── */}
      {s.plateOp > 0.01 && (
        <line x1={52} y1={140} x2={348} y2={140}
          stroke={C.plate} strokeWidth={1} strokeDasharray="6 4" opacity={s.plateOp} />
      )}

      {/* ── Bivalent chromosomes (Prophase I / Metaphase I) — each shown with crossed-over segments ── */}
      {s.bivalents.map((ch, i) => {
        const keys: (keyof CrossoverPattern)[] = ['A_mat','A_pat','B_mat','B_pat'];
        const [t,b] = cc(keys[i], crossover);
        return <XChrom key={`biv${i}`} ch={ch} top={t} bot={b} />;
      })}

      {/* ── Chiasma markers (crossing over) ── */}
      {s.chiasmaOp > 0.01 && s.bivalents[0].opacity > 0.01 && (() => {
        // Draw an X between the two A homologs and another between B homologs
        const pairs: Array<[Chrom, Chrom]> = [
          [s.bivalents[0], s.bivalents[1]],
          [s.bivalents[2], s.bivalents[3]],
        ];
        return pairs.map(([l, r], pi) => {
          const mx = (l.cx + r.cx) / 2;
          const my = (l.cy + r.cy) / 2;
          const d = 5;
          return (
            <g key={`chia${pi}`} opacity={s.chiasmaOp * Math.min(l.opacity, r.opacity)}>
              <line x1={mx-d} y1={my-d} x2={mx+d} y2={my+d}
                stroke={C.chiasma} strokeWidth={2.2} strokeLinecap="round" />
              <line x1={mx+d} y1={my-d} x2={mx-d} y2={my+d}
                stroke={C.chiasma} strokeWidth={2.2} strokeLinecap="round" />
            </g>
          );
        });
      })()}

      {/* ── Separated homologs (Anaphase I / Telophase I) — segment colors persist after crossing over ── */}
      {s.sepTop.map((ch, i) => {
        const k: keyof CrossoverPattern = i === 0 ? 'A_mat' : 'B_pat';
        const [t,b] = cc(k, crossover);
        return <XChrom key={`st${i}`} ch={ch} top={t} bot={b} />;
      })}
      {s.sepBot.map((ch, i) => {
        const k: keyof CrossoverPattern = i === 0 ? 'A_pat' : 'B_mat';
        const [t,b] = cc(k, crossover);
        return <XChrom key={`sb${i}`} ch={ch} top={t} bot={b} />;
      })}

      {/* ── Reform nuclei (Telophase I) ── */}
      {s.nucTopI.opacity > 0.01 && (
        <ellipse cx={s.nucTopI.cx} cy={s.nucTopI.cy} rx={s.nucTopI.rx} ry={s.nucTopI.ry}
          fill="rgba(139,92,246,0.07)" stroke={C.nucleus} strokeWidth={1.6}
          strokeDasharray="5 3" opacity={s.nucTopI.opacity} />
      )}
      {s.nucBotI.opacity > 0.01 && (
        <ellipse cx={s.nucBotI.cx} cy={s.nucBotI.cy} rx={s.nucBotI.rx} ry={s.nucBotI.ry}
          fill="rgba(139,92,246,0.07)" stroke={C.nucleus} strokeWidth={1.6}
          strokeDasharray="5 3" opacity={s.nucBotI.opacity} />
      )}

      {/* ── Meiosis II: V-chromatids — left arm = top segment, right arm = bottom segment ── */}
      {s.vtop2.map((v, i)  => { const [t,b]=cc(i===0?'A_mat':'B_pat',crossover); return <VUp   key={`vt2_${i}`}  v={v} top={t} bot={b} />; })}
      {s.vbot2.map((v, i)  => { const [t,b]=cc(i===0?'A_mat':'B_pat',crossover); return <VDown key={`vb2_${i}`}  v={v} top={t} bot={b} />; })}
      {s.vtop2b.map((v, i) => { const [t,b]=cc(i===0?'A_pat':'B_mat',crossover); return <VUp   key={`vt2b_${i}`} v={v} top={t} bot={b} />; })}
      {s.vbot2b.map((v, i) => { const [t,b]=cc(i===0?'A_pat':'B_mat',crossover); return <VDown key={`vb2b_${i}`} v={v} top={t} bot={b} />; })}

      {/* ── 4 haploid nuclei ── */}
      {s.nuc4.map((n, i) => n.opacity > 0.01 ? (
        <ellipse key={`n4_${i}`} cx={n.cx} cy={n.cy} rx={n.rx} ry={n.ry}
          fill="rgba(139,92,246,0.08)" stroke={C.nucleus} strokeWidth={1.5}
          strokeDasharray="4 3" opacity={n.opacity} />
      ) : null)}

      {/* ── Labels — rendered last; minimum fontSize=9 so text is legible at all viewer sizes ── */}
      <g fontFamily="system-ui, -apple-system, sans-serif">

        {/* INTERPHASE: chromatin + 2n=4 badge — labels in right half of cell, clear of nucleus */}
        {s.chromatinOp > 0.05 && (
          <g opacity={s.chromatinOp}>
            <line x1={238} y1={131} x2={256} y2={120} stroke={C.nucleus} strokeWidth={1} opacity={0.4} />
            <text x={259} y={117} fontSize={12} fontWeight="700" fill={C.nucleus}>Chromatin</text>
            <text x={259} y={130} fontSize={9} fill={C.nucleus} opacity={0.7}>(loosely coiled DNA)</text>
            <rect x={258} y={148} width={84} height={36} rx={4}
              fill="rgba(16,185,129,0.1)" stroke={C.membrane} strokeWidth={0.9} />
            <text x={300} y={163} fontSize={12} fontWeight="800" fill={C.membrane} textAnchor="middle">2n = 4</text>
            <text x={300} y={177} fontSize={9} fill={C.membrane} textAnchor="middle" opacity={0.75}>diploid — 2 pairs</text>
          </g>
        )}

        {/* PROPHASE I: bivalent label top-left + maternal/paternal legend + chiasma */}
        {showBivalentLabel && (
          <g opacity={Math.min(s.bivalents[0].opacity, 1)}>
            {/* Bivalent label — anchored above pair A, left side */}
            <line x1={s.bivalents[0].cx - 4} y1={s.bivalents[0].cy - 10}
                  x2={s.bivalents[0].cx - 18} y2={s.bivalents[0].cy - 24}
              stroke={C.homA_mat} strokeWidth={1} opacity={0.45} />
            <text x={s.bivalents[0].cx - 82} y={s.bivalents[0].cy - 26}
              fontSize={11} fontWeight="700" fill={C.homA_mat}>Homologous pair</text>
            <text x={s.bivalents[0].cx - 70} y={s.bivalents[0].cy - 14}
              fontSize={9} fill={C.homA_mat} opacity={0.8}>(bivalent / tetrad)</text>
            {/* Maternal / paternal color legend — bottom-left, below chromosomes.
                Text is neutral so students don't conflate label color with chromosome color. */}
            <line x1={6} y1={216} x2={20} y2={216} stroke={C.homA_mat} strokeWidth={4} strokeLinecap="round" />
            <text x={24} y={220} fontSize={10} fontWeight="700" fill="#374151">Maternal chr.</text>
            <line x1={6} y1={232} x2={20} y2={232} stroke={C.homA_pat} strokeWidth={4} strokeLinecap="round" />
            <text x={24} y={236} fontSize={10} fontWeight="700" fill="#374151">Paternal chr.</text>
          </g>
        )}

        {/* PROPHASE I / METAPHASE I: chiasma — fixed upper-right, leader to actual marker */}
        {showChiasmaLabel && s.bivalents[0].opacity > 0.1 && (() => {
          const mx = (s.bivalents[0].cx + s.bivalents[1].cx) / 2;
          const my = (s.bivalents[0].cy + s.bivalents[1].cy) / 2;
          const lx = 244; const ly = 74;
          return (
            <g opacity={s.chiasmaOp * 0.9}>
              <line x1={lx + 2} y1={ly + 14} x2={mx + 4} y2={my - 3}
                stroke={C.chiasma} strokeWidth={1} opacity={0.5} />
              <text x={lx} y={ly} fontSize={12} fontWeight="700" fill={C.chiasma}>Chiasma</text>
              <text x={lx} y={ly + 13} fontSize={9} fill={C.chiasma} opacity={0.8}>(crossing over)</text>
            </g>
          );
        })()}

        {/* METAPHASE I: plate label outside cell right + independent assortment top strip */}
        {s.plateOp > 0.15 && (
          <g opacity={s.plateOp}>
            {/* "Metaphase plate" sits just right of the cell edge (cell right ≈ 350) */}
            <text x={354} y={135} fontSize={9} fontWeight="800" fill={C.plate}>Metaphase</text>
            <text x={354} y={147} fontSize={9} fill={C.plate} opacity={0.85}>plate</text>
            {/* Independent assortment — top strip, above cell (cell starts y≈35) */}
            <text x={200} y={13} fontSize={10} fontWeight="700" fill="#64748b" textAnchor="middle">
              Random orientation → independent assortment (2ⁿ combinations)
            </text>
          </g>
        )}

        {/* ANAPHASE I: maternal/paternal labels outside cell left + warning outside cell right */}
        {showSepLabel && (
          <g opacity={Math.min(s.sepTop[0].opacity * 1.2, 0.9)}>
            {/* Labels sit at x=6 — at Anaphase I, cell left edge ≈ 70, so these are in the margin */}
            <text x={6} y={84} fontSize={10} fontWeight="700" fill={C.homA_mat}>Maternal</text>
            <text x={6} y={97} fontSize={9} fill={C.homA_mat} opacity={0.75}>homologs</text>
            <text x={6} y={192} fontSize={10} fontWeight="700" fill={C.homA_pat}>Paternal</text>
            <text x={6} y={205} fontSize={9} fill={C.homA_pat} opacity={0.75}>homologs</text>
          </g>
        )}
        {/* Warning — outside cell right edge (cell right ≈ 330) */}
        {showSepLabel && s.spindleOp > 0.2 && (
          <g opacity={Math.min(s.spindleOp * 1.6, 0.88)}>
            <rect x={334} y={100} width={62} height={72} rx={3}
              fill="rgba(251,146,60,0.13)" stroke="#fb923c" strokeWidth={0.9} />
            <text x={365} y={115} fontSize={9} fontWeight="800" fill="#ea580c" textAnchor="middle">Chromatids</text>
            <text x={365} y={127} fontSize={9} fontWeight="700" fill="#ea580c" textAnchor="middle">still joined</text>
            <text x={365} y={139} fontSize={8} fill="#ea580c" textAnchor="middle" opacity={0.85}>at centromere</text>
            <text x={365} y={153} fontSize={9} fontWeight="700" fill="#ea580c" textAnchor="middle">M II will</text>
            <text x={365} y={165} fontSize={8} fill="#ea580c" textAnchor="middle" opacity={0.8}>separate them</text>
          </g>
        )}

        {/* TELOPHASE I: n=2 above/below cells + no-S-phase in right margin */}
        {s.nucTopI.opacity > 0.2 && (
          <g opacity={s.nucTopI.opacity}>
            <text x={200} y={Math.max(16, s.dcTopCy - s.dcRy - 4)} fontSize={11} fontWeight="700"
              fill="#a78bfa" textAnchor="middle">n = 2</text>
            <text x={200} y={Math.min(274, s.dcBotCy + s.dcRy + 13)} fontSize={11} fontWeight="700"
              fill="#f59e0b" textAnchor="middle">n = 2</text>
            {/* Right margin — daughter cells end at cx+rx = 310 */}
            <text x={316} y={129} fontSize={9} fill="#64748b" fontWeight="700">No S phase</text>
            <text x={316} y={141} fontSize={9} fill="#64748b" opacity={0.85}>between</text>
            <text x={316} y={153} fontSize={9} fill="#64748b" opacity={0.85}>M I and II</text>
          </g>
        )}

        {/* METAPHASE II: top strip above both cells (top cell starts y≈20) */}
        {s.vtop2[0].opacity > 0.2 && s.vtop2[0].cy >= 70 && (
          <g opacity={s.vtop2[0].opacity}>
            <text x={200} y={13} fontSize={10} fontWeight="600" fill="#64748b" textAnchor="middle">
              Both cells divide simultaneously — like mitosis, but haploid
            </text>
          </g>
        )}

        {/* ANAPHASE II: top strip */}
        {s.vtop2[0].opacity > 0.4 && s.vtop2[0].cy < 70 && (
          <g opacity={Math.min(s.vtop2[0].opacity, 0.9)}>
            <text x={200} y={13} fontSize={10} fontWeight="700" fill="#38bdf8" textAnchor="middle">
              Equational division — n stays the same; chromatids split
            </text>
          </g>
        )}

        {/* 4 HAPLOID CELLS: header + origin brackets + chromosome markers */}
        {showHaploidLabel && (
          <g opacity={s.cells4Op}>
            <text x={200} y={17} fontSize={11} fontWeight="700" fill={C.membrane} textAnchor="middle">
              4 haploid cells (n = 2)
            </text>

            {/* Brackets showing which Meiosis I cell each pair came from */}
            <path d="M 72 116 Q 68 116 68 76 Q 68 36 72 36"
              fill="none" stroke="#a78bfa" strokeWidth={1.3} strokeDasharray="3 2" opacity={0.65} />
            <text x={58} y={76} fontSize={9} fontWeight="700" fill="#a78bfa"
              textAnchor="middle" transform="rotate(-90,58,76)">from M I cell 1</text>

            <path d="M 72 244 Q 68 244 68 204 Q 68 164 72 164"
              fill="none" stroke="#f59e0b" strokeWidth={1.3} strokeDasharray="3 2" opacity={0.65} />
            <text x={58} y={204} fontSize={9} fontWeight="700" fill="#f59e0b"
              textAnchor="middle" transform="rotate(-90,58,204)">from M I cell 2</text>

            {/* Chromosome bars inside each cell — split to show crossed-over segments */}
            {([
              { cx:125, cy:76,  k1:'A_mat' as const, k2:'B_pat' as const },
              { cx:275, cy:76,  k1:'A_mat' as const, k2:'B_pat' as const },
              { cx:125, cy:204, k1:'A_pat' as const, k2:'B_mat' as const },
              { cx:275, cy:204, k1:'A_pat' as const, k2:'B_mat' as const },
            ]).map(({ cx, cy, k1, k2 }, i) => {
              const [t1,b1] = cc(k1, crossover);
              const [t2,b2] = cc(k2, crossover);
              return (
                <g key={`cm_${i}`} opacity={0.9}>
                  {/* Bar 1 (chromosome from pair A): top half / bottom half */}
                  <line x1={cx-5} y1={cy-7} x2={cx-5} y2={cy} stroke={t1} strokeWidth={4} strokeLinecap="round" />
                  <line x1={cx-5} y1={cy}   x2={cx-5} y2={cy+7} stroke={b1} strokeWidth={4} strokeLinecap="round" />
                  {/* Bar 2 (chromosome from pair B): top half / bottom half */}
                  <line x1={cx+6} y1={cy-7} x2={cx+6} y2={cy} stroke={t2} strokeWidth={4} strokeLinecap="round" />
                  <line x1={cx+6} y1={cy}   x2={cx+6} y2={cy+7} stroke={b2} strokeWidth={4} strokeLinecap="round" />
                </g>
              );
            })}

            <text x={200} y={270} fontSize={9} fill="#64748b" textAnchor="middle" opacity={0.8} fontWeight="600">
              Each cell genetically unique — crossing over + independent assortment
            </text>
          </g>
        )}

      </g>

    </svg>
  );
}

// ─── Phase metadata ───────────────────────────────────────────────────────────

const PHASES = [
  {
    name:"Interphase", subtitle:"S Phase Complete", accent:"#10b981",
    accentBg:"rgba(16,185,129,0.08)", dotClass:"bg-emerald-500",
    division: "Meiosis I",
    description:"The cell has completed DNA replication during S phase — every chromosome now consists of two identical sister chromatids. The cell grows and duplicates its centrosomes in preparation for two rounds of division.",
    keyPoints:["DNA replicated: each chromosome is now 2 sister chromatids","Homologous chromosome pairs each contain 4 chromatids total","Cell will divide TWICE to produce 4 haploid cells"],
  },
  {
    name:"Prophase I", subtitle:"Synapsis & Crossing Over", accent:"#8b5cf6",
    accentBg:"rgba(139,92,246,0.08)", dotClass:"bg-violet-500",
    division: "Meiosis I",
    description:"Every person already carries two complete sets of chromosomes — one set inherited from their mother (shown in purple) and one from their father (shown in amber). Both sets live inside the same cell. The purple and amber chromosomes carry the same genes at the same locations but may have different versions (alleles). In Prophase I these homologs zip together — synapsis — and swap segments at chiasmata (crossing over), blending maternal and paternal DNA before the cell divides.",
    keyPoints:["Purple = maternal (from mother) · Amber = paternal (from father)","Both sets already live in one cell — meiosis separates them","Crossing over at chiasmata creates chromosomes that are neither fully maternal nor paternal"],
  },
  {
    name:"Metaphase I", subtitle:"Independent Assortment", accent:"#38bdf8",
    accentBg:"rgba(56,189,248,0.08)", dotClass:"bg-sky-400",
    division: "Meiosis I",
    description:"Bivalents (paired homologs) align at the metaphase plate. Crucially, each bivalent orients randomly and independently — the maternal or paternal copy of each chromosome pair can face either pole. This independent assortment generates enormous genetic diversity.",
    keyPoints:["Bivalents (not individual chromosomes) align at equator","Random orientation of each bivalent → independent assortment","2ⁿ possible combinations (n = haploid chromosome number)"],
  },
  {
    name:"Anaphase I", subtitle:"Homologs Separate", accent:"#fb923c",
    accentBg:"rgba(251,146,60,0.08)", dotClass:"bg-orange-400",
    division: "Meiosis I",
    description:"Homologous chromosomes — not sister chromatids — are pulled to opposite poles. Each chromosome still consists of two sister chromatids joined at the centromere. This is the key reduction division: chromosome number halves from diploid (2n) to haploid (n).",
    keyPoints:["Homologs separate — sister chromatids remain joined","Chromosome number halves: 2n → n at each pole","This is the reductional division of meiosis"],
  },
  {
    name:"Telophase I", subtitle:"Cleavage Furrow Forms", accent:"#a78bfa",
    accentBg:"rgba(167,139,250,0.08)", dotClass:"bg-violet-400",
    division: "Meiosis I",
    description:"Nuclear envelopes begin reforming around each haploid chromosome set at opposite ends of the still-connected cell. A cleavage furrow — a ring of actin filaments — pinches inward at the cell's equator. The cell is not yet split; cytokinesis is in progress. Each emerging half will contain one chromosome from each homologous pair, but every chromosome still has two sister chromatids joined at the centromere.",
    keyPoints:["Cell is still one — the furrow is pinching but hasn't split it yet","Nuclear envelopes reform around each haploid chromosome set","Every chromosome still has 2 sister chromatids — Meiosis II separates them"],
  },
  {
    name:"Metaphase II", subtitle:"Second Alignment", accent:"#38bdf8",
    accentBg:"rgba(56,189,248,0.08)", dotClass:"bg-sky-400",
    division: "Meiosis II",
    description:"Both haploid cells enter Meiosis II simultaneously. Individual chromosomes — each still a pair of sister chromatids — align at the metaphase plate in each cell. This division resembles mitosis but starts with haploid cells.",
    keyPoints:["Both daughter cells divide simultaneously","Individual chromosomes align (not bivalents)","No new genetic recombination — this division is like mitosis"],
  },
  {
    name:"Anaphase II", subtitle:"Sister Chromatids Split", accent:"#fb923c",
    accentBg:"rgba(251,146,60,0.08)", dotClass:"bg-orange-400",
    division: "Meiosis II",
    description:"Sister chromatids finally separate, pulled to opposite poles in both cells. This is the equational division — chromosome count stays the same (n) but each chromatid is now its own chromosome with a single DNA molecule.",
    keyPoints:["Sister chromatids separate — the equational division","Each chromatid becomes an independent chromosome","4 chromosome sets forming — one per future cell"],
  },
  {
    name:"4 Haploid Cells", subtitle:"Meiosis Complete", accent:"#10b981",
    accentBg:"rgba(16,185,129,0.08)", dotClass:"bg-emerald-500",
    division: "Meiosis II",
    description:"Two rounds of cytokinesis produce four genetically unique haploid cells. In males these become sperm; in females one becomes an egg and three become polar bodies. Every cell is haploid (n) and genetically distinct due to crossing over and independent assortment.",
    keyPoints:["4 haploid (n) cells — genetically unique","Each cell has one chromatid per chromosome pair","In humans: 23 chromosomes per cell (vs 46 in parent)"],
  },
] as const;

const PHASE_COUNT = PHASES.length;
const DRAG_PER_PHASE = 108;

// ─── Context ──────────────────────────────────────────────────────────────────

interface MeiosisCtxValue {
  clampedProgress: number;
  snapIdx: number;
  progressPct: number;
  cur: (typeof PHASES)[number];
  springTo: (target: number) => void;
  setProgressDirect: (value: number) => void;
  animRef: React.MutableRefObject<AnimationPlaybackControls | null>;
  crossover: CrossoverPattern;
  randomizeCrossover: () => void;
}

const MeiosisCtx = createContext<MeiosisCtxValue | null>(null);
function useMeiosis() {
  const ctx = useContext(MeiosisCtx);
  if (!ctx) throw new Error("Must be inside MeiosisProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MeiosisProvider({ children }: { children: React.ReactNode }) {
  const progress = useMotionValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  useMotionValueEvent(progress, "change", setDisplayProgress);
  const animRef = useRef<AnimationPlaybackControls | null>(null);
  const [crossover, setCrossover] = useState<CrossoverPattern>(DEFAULT_CROSSOVER);

  function springTo(target: number) {
    animRef.current?.stop();
    animRef.current = animate(progress, target, { type:"spring", stiffness:380, damping:30 });
  }
  function setProgressDirect(value: number) {
    animRef.current?.stop();
    progress.set(value);
  }
  function randomizeCrossover() { setCrossover(randomCrossoverPattern()); }

  const clamped = Math.max(0, Math.min(displayProgress, PHASE_COUNT - 1));
  const snapIdx = Math.round(clamped);

  return (
    <MeiosisCtx.Provider value={{
      clampedProgress: clamped,
      snapIdx,
      progressPct: (clamped / (PHASE_COUNT - 1)) * 100,
      cur: PHASES[snapIdx],
      springTo, setProgressDirect, animRef,
      crossover, randomizeCrossover,
    }}>
      {children}
    </MeiosisCtx.Provider>
  );
}

// ─── MeiosisViewer ────────────────────────────────────────────────────────────

export function MeiosisViewer() {
  const { clampedProgress, snapIdx, progressPct, cur, springTo, setProgressDirect, animRef, crossover, randomizeCrossover } = useMeiosis();
  const [isDragging, setIsDragging]         = useState(false);
  const [hasEverDragged, setHasEverDragged] = useState(false);
  const dragStartX          = useRef(0);
  const progressAtDragStart = useRef(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") { e.preventDefault(); springTo(Math.min(PHASE_COUNT - 1, snapIdx + 1)); }
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
    const raw = progressAtDragStart.current + (e.clientX - dragStartX.current) / DRAG_PER_PHASE;
    setProgressDirect(Math.max(0, Math.min(PHASE_COUNT - 1, raw)));
  }
  function onPointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    springTo(Math.round(clampedProgress));
  }

  // Divide phases into Meiosis I (0-4) and Meiosis II (5-7)
  const mI  = PHASES.slice(0, 5);
  const mII = PHASES.slice(5);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

      {/* Division labels + phase tabs */}
      <div className="border-b border-zinc-100">
        {/* Meiosis I strip */}
        <div className="flex items-center border-b border-zinc-50">
          <div className="w-20 shrink-0 border-r border-zinc-100 px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-violet-500">
            Meiosis I
          </div>
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${mI.length}, 1fr)` }}>
            {mI.map((p, i) => (
              <button key={p.name} onClick={() => springTo(i)}
                className={`py-2 text-[10px] font-semibold leading-tight px-1 transition-colors ${
                  snapIdx === i ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                }`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        {/* Meiosis II strip */}
        <div className="flex items-center">
          <div className="w-20 shrink-0 border-r border-zinc-100 px-2 py-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-sky-500">
            Meiosis II
          </div>
          <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${mII.length}, 1fr)` }}>
            {mII.map((p, i) => (
              <button key={p.name} onClick={() => springTo(i + 5)}
                className={`py-2 text-[10px] font-semibold leading-tight px-1 transition-colors ${
                  snapIdx === i + 5 ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                }`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Drag zone */}
      <div className="select-none"
        style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}>

        <div className="relative bg-gradient-to-br from-zinc-50 to-white">
          <div className="relative w-full" style={{ aspectRatio: "400 / 280" }}>
            <InterpolatedCell progress={clampedProgress} crossover={crossover} />
          </div>
          {!hasEverDragged && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2.5 rounded-full bg-black/55 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span aria-hidden="true">←</span>drag to explore phases<span aria-hidden="true">→</span>
              </div>
            </div>
          )}
        </div>

        {/* Crossing over button */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Crossing over</span>
          <button
            onClick={randomizeCrossover}
            className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm transition-all hover:bg-violet-50 hover:border-violet-300 active:scale-95"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M8 1h3v3M4 11H1V8M11 1L6.5 5.5M1 11l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Shuffle crossing over
          </button>
        </div>

        {/* Scrub bar */}
        <div className="border-t border-zinc-100 bg-white px-5 pt-4 pb-5">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-400 select-none pointer-events-none">
            ← drag right to advance phases →
          </p>
          <div className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-right text-[10px] font-semibold text-zinc-400 select-none pointer-events-none leading-tight">
              {PHASES[0].name}
            </span>
            <div className="relative flex-1 h-3 rounded-full bg-zinc-100"
              style={{ boxShadow:"inset 0 1px 3px rgba(0,0,0,0.08)" }}>
              <div className="absolute inset-y-0 left-0 rounded-full transition-none"
                style={{ width:`${progressPct}%`, backgroundColor:cur.accent }} />
              {PHASES.map((_,i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px"
                  style={{ left:`${(i/(PHASE_COUNT-1))*100}%`, background:"rgba(255,255,255,0.75)" }} />
              ))}
              <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white transition-none"
                style={{ left:`${progressPct}%`, border:`2.5px solid ${cur.accent}`, boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }}>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                  <path d="M1 6H15" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4.5 2.5L1 6L4.5 9.5" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.5 2.5L15 6L11.5 9.5" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span className="w-14 shrink-0 text-[10px] font-semibold text-zinc-400 select-none pointer-events-none leading-tight">
              {PHASES[PHASE_COUNT-1].name}
            </span>
          </div>
          <div className="mt-2 flex justify-between px-[4.25rem]">
            {PHASES.map((_,i) => (
              <button key={i} onClick={() => springTo(i)}
                className={`text-[10px] font-medium transition-colors ${snapIdx===i ? "text-zinc-700 font-bold" : "text-zinc-300 hover:text-zinc-500"}`}>
                {i+1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MeiosisPanel ─────────────────────────────────────────────────────────────

export function MeiosisPanel() {
  const { snapIdx, progressPct, cur, springTo } = useMeiosis();
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="p-5" style={{ background: cur.accentBg }}>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: cur.accent }}>
          {cur.division}
        </div>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Phase {snapIdx+1} of {PHASE_COUNT}
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-zinc-900">{cur.name}</h3>
            <p className="text-sm text-zinc-500">{cur.subtitle}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={() => springTo(Math.max(0, snapIdx-1))} disabled={snapIdx===0}
              className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-30">
              ← Prev
            </button>
            <button onClick={() => springTo(Math.min(PHASE_COUNT-1, snapIdx+1))} disabled={snapIdx===PHASE_COUNT-1}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-zinc-600">{cur.description}</p>
        <ul className="space-y-1.5">
          {cur.keyPoints.map((pt,i) => (
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
            style={{ width:`${progressPct}%`, backgroundColor:cur.accent }} />
        </div>
        <div className="flex justify-center gap-1.5">
          {PHASES.map((_,i) => (
            <button key={i} onClick={() => springTo(i)} aria-label={`Go to ${PHASES[i].name}`}
              className={`h-2 rounded-full transition-all ${snapIdx===i ? "w-6 bg-zinc-800" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MeiosisAnimation — single-column wrapper ─────────────────────────────────

export function MeiosisAnimation() {
  return (
    <MeiosisProvider>
      <div className="space-y-3">
        <MeiosisViewer />
        <MeiosisPanel />
      </div>
    </MeiosisProvider>
  );
}

// ─── Emblem (Anaphase I snapshot for lesson card) ─────────────────────────────

export function MeiosisEmblem({ className }: { className?: string }) {
  return (
    <div className={className ?? "w-full h-full"}>
      <InterpolatedCell progress={3} crossover={DEFAULT_CROSSOVER} />
    </div>
  );
}
