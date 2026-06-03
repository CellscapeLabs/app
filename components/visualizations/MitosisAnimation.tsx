"use client";
// Biology concept: Mitosis — nuclear division producing two genetically identical daughter cells
// Interactions: Drag right to advance phases, left to go back. All cell elements interpolate
// their positions/sizes between keyframes — chromosomes move, spindles pull, cells split.

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
  membrane: "#10b981",
  nucleus:  "#8b5cf6",
  chrom:    ["#8b5cf6", "#a78bfa", "#8b5cf6", "#a78bfa"] as const,
  spindle:  "#38bdf8",
  plate:    "#94a3b8",
  furrow:   "#10b981",
};

// ─── Interpolation types ──────────────────────────────────────────────────────

interface XC { cx: number; cy: number; size: number; opacity: number; angle: number }
interface VC { cx: number; cy: number; opacity: number }
interface RN { cy: number; rx: number; ry: number; opacity: number }

interface PhaseState {
  cellRx: number; cellRy: number; cellOp: number;
  nucR: number; nucOp: number;
  nuclOp: number;
  chromatinOp: number;
  centroTopY: number; centroTopOp: number;
  centroBotY: number; centroBotOp: number;
  spindleOp: number;
  plateOp: number;
  furrowDepth: number;
  xchroms: [XC, XC, XC, XC];
  vtop: [VC, VC, VC, VC];
  vbot: [VC, VC, VC, VC];
  reformTop: RN;
  reformBot: RN;
  dcTopCy: number; dcBotCy: number; dcRx: number; dcRy: number; dcOp: number;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lxc(a: XC, b: XC, t: number): XC {
  return { cx: lerp(a.cx,b.cx,t), cy: lerp(a.cy,b.cy,t), size: lerp(a.size,b.size,t), opacity: lerp(a.opacity,b.opacity,t), angle: lerp(a.angle,b.angle,t) };
}
function lvc(a: VC, b: VC, t: number): VC {
  return { cx: lerp(a.cx,b.cx,t), cy: lerp(a.cy,b.cy,t), opacity: lerp(a.opacity,b.opacity,t) };
}
function lrn(a: RN, b: RN, t: number): RN {
  return { cy: lerp(a.cy,b.cy,t), rx: lerp(a.rx,b.rx,t), ry: lerp(a.ry,b.ry,t), opacity: lerp(a.opacity,b.opacity,t) };
}

function lerpState(a: PhaseState, b: PhaseState, t: number): PhaseState {
  return {
    cellRx: lerp(a.cellRx,b.cellRx,t), cellRy: lerp(a.cellRy,b.cellRy,t), cellOp: lerp(a.cellOp,b.cellOp,t),
    nucR: lerp(a.nucR,b.nucR,t), nucOp: lerp(a.nucOp,b.nucOp,t),
    nuclOp: lerp(a.nuclOp,b.nuclOp,t),
    chromatinOp: lerp(a.chromatinOp,b.chromatinOp,t),
    centroTopY: lerp(a.centroTopY,b.centroTopY,t), centroTopOp: lerp(a.centroTopOp,b.centroTopOp,t),
    centroBotY: lerp(a.centroBotY,b.centroBotY,t), centroBotOp: lerp(a.centroBotOp,b.centroBotOp,t),
    spindleOp: lerp(a.spindleOp,b.spindleOp,t),
    plateOp: lerp(a.plateOp,b.plateOp,t),
    furrowDepth: lerp(a.furrowDepth,b.furrowDepth,t),
    xchroms: [lxc(a.xchroms[0],b.xchroms[0],t), lxc(a.xchroms[1],b.xchroms[1],t), lxc(a.xchroms[2],b.xchroms[2],t), lxc(a.xchroms[3],b.xchroms[3],t)],
    vtop: [lvc(a.vtop[0],b.vtop[0],t), lvc(a.vtop[1],b.vtop[1],t), lvc(a.vtop[2],b.vtop[2],t), lvc(a.vtop[3],b.vtop[3],t)],
    vbot: [lvc(a.vbot[0],b.vbot[0],t), lvc(a.vbot[1],b.vbot[1],t), lvc(a.vbot[2],b.vbot[2],t), lvc(a.vbot[3],b.vbot[3],t)],
    reformTop: lrn(a.reformTop,b.reformTop,t), reformBot: lrn(a.reformBot,b.reformBot,t),
    dcTopCy: lerp(a.dcTopCy,b.dcTopCy,t), dcBotCy: lerp(a.dcBotCy,b.dcBotCy,t),
    dcRx: lerp(a.dcRx,b.dcRx,t), dcRy: lerp(a.dcRy,b.dcRy,t), dcOp: lerp(a.dcOp,b.dcOp,t),
  };
}

// ─── Phase keyframes ──────────────────────────────────────────────────────────
// xchroms[0,1] track chromosomes that end up in the TOP daughter nucleus.
// xchroms[2,3] track chromosomes that end up in the BOTTOM daughter nucleus.
// This ensures invisible xchroms are always near their eventual destination.

const PS: PhaseState[] = [
  // 0 ─ INTERPHASE
  {
    cellRx:155, cellRy:110, cellOp:1,
    nucR:56, nucOp:1, nuclOp:1, chromatinOp:1,
    centroTopY:100, centroTopOp:0, centroBotY:180, centroBotOp:0,
    spindleOp:0, plateOp:0, furrowDepth:0,
    xchroms:[
      {cx:180,cy:122,size:13,opacity:0,angle:22},  // hidden at prophase position
      {cx:218,cy:122,size:13,opacity:0,angle:-18},
      {cx:176,cy:160,size:13,opacity:0,angle:-28},
      {cx:222,cy:158,size:13,opacity:0,angle:32},
    ],
    vtop:[{cx:148,cy:140,opacity:0},{cx:176,cy:140,opacity:0},{cx:224,cy:140,opacity:0},{cx:252,cy:140,opacity:0}],
    vbot:[{cx:148,cy:140,opacity:0},{cx:176,cy:140,opacity:0},{cx:224,cy:140,opacity:0},{cx:252,cy:140,opacity:0}],
    reformTop:{cy:88,rx:50,ry:34,opacity:0}, reformBot:{cy:192,rx:50,ry:34,opacity:0},
    dcTopCy:140, dcBotCy:140, dcRx:114, dcRy:58, dcOp:0,
  },
  // 1 ─ PROPHASE
  {
    cellRx:155, cellRy:110, cellOp:1,
    nucR:56, nucOp:0.35, nuclOp:0, chromatinOp:0,
    centroTopY:54, centroTopOp:1, centroBotY:226, centroBotOp:1,
    spindleOp:0.22, plateOp:0, furrowDepth:0,
    xchroms:[
      {cx:180,cy:122,size:13,opacity:1,angle:22},
      {cx:218,cy:122,size:13,opacity:1,angle:-18},
      {cx:176,cy:160,size:13,opacity:1,angle:-28},
      {cx:222,cy:158,size:13,opacity:1,angle:32},
    ],
    vtop:[{cx:180,cy:122,opacity:0},{cx:218,cy:122,opacity:0},{cx:176,cy:160,opacity:0},{cx:222,cy:158,opacity:0}],
    vbot:[{cx:180,cy:122,opacity:0},{cx:218,cy:122,opacity:0},{cx:176,cy:160,opacity:0},{cx:222,cy:158,opacity:0}],
    reformTop:{cy:88,rx:50,ry:34,opacity:0}, reformBot:{cy:192,rx:50,ry:34,opacity:0},
    dcTopCy:140, dcBotCy:140, dcRx:114, dcRy:58, dcOp:0,
  },
  // 2 ─ METAPHASE
  // xchroms are invisible here. vtop[i] + vbot[i] both sit at cy=140, forming the X shape.
  // During M→A the vtop rises and vbot falls with no opacity change — pure physical separation.
  {
    cellRx:155, cellRy:110, cellOp:1,
    nucR:56, nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:30, centroTopOp:1, centroBotY:250, centroBotOp:1,
    spindleOp:0.55, plateOp:0.55, furrowDepth:0,
    xchroms:[
      {cx:148,cy:140,size:13,opacity:0,angle:0},
      {cx:176,cy:140,size:13,opacity:0,angle:0},
      {cx:224,cy:140,size:13,opacity:0,angle:0},
      {cx:252,cy:140,size:13,opacity:0,angle:0},
    ],
    vtop:[{cx:148,cy:140,opacity:1},{cx:176,cy:140,opacity:1},{cx:224,cy:140,opacity:1},{cx:252,cy:140,opacity:1}],
    vbot:[{cx:148,cy:140,opacity:1},{cx:176,cy:140,opacity:1},{cx:224,cy:140,opacity:1},{cx:252,cy:140,opacity:1}],
    reformTop:{cy:88,rx:50,ry:34,opacity:0}, reformBot:{cy:192,rx:50,ry:34,opacity:0},
    dcTopCy:140, dcBotCy:140, dcRx:114, dcRy:58, dcOp:0,
  },
  // 3 ─ ANAPHASE
  // vtop[i] and vbot[i] share the same cx as xchroms[i] at metaphase so each
  // equator position clearly splits into one chromatid going up + one going down.
  // xchroms[0,1] parked at top pole (opacity 0); xchroms[2,3] at bottom pole (opacity 0).
  {
    cellRx:133, cellRy:126, cellOp:1,
    nucR:56, nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:1, centroBotY:256, centroBotOp:1,
    spindleOp:0.55, plateOp:0, furrowDepth:0,
    xchroms:[
      {cx:148,cy:82, size:13,opacity:0,angle:0},
      {cx:176,cy:82, size:13,opacity:0,angle:0},
      {cx:224,cy:198,size:13,opacity:0,angle:0},
      {cx:252,cy:198,size:13,opacity:0,angle:0},
    ],
    vtop:[{cx:148,cy:82,opacity:1},{cx:176,cy:82,opacity:1},{cx:224,cy:82,opacity:1},{cx:252,cy:82,opacity:1}],
    vbot:[{cx:148,cy:198,opacity:1},{cx:176,cy:198,opacity:1},{cx:224,cy:198,opacity:1},{cx:252,cy:198,opacity:1}],
    reformTop:{cy:88,rx:50,ry:34,opacity:0}, reformBot:{cy:192,rx:50,ry:34,opacity:0},
    dcTopCy:140, dcBotCy:140, dcRx:114, dcRy:58, dcOp:0,
  },
  // 4 ─ TELOPHASE
  {
    cellRx:133, cellRy:126, cellOp:1,
    nucR:56, nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:0, centroBotY:256, centroBotOp:0,
    spindleOp:0.08, plateOp:0, furrowDepth:1,
    xchroms:[
      {cx:185,cy:88, size:8,opacity:0.45,angle:0},
      {cx:210,cy:88, size:8,opacity:0.45,angle:0},
      {cx:185,cy:192,size:8,opacity:0.45,angle:0},
      {cx:210,cy:192,size:8,opacity:0.45,angle:0},
    ],
    vtop:[{cx:148,cy:88, opacity:0},{cx:176,cy:88, opacity:0},{cx:224,cy:88, opacity:0},{cx:252,cy:88, opacity:0}],
    vbot:[{cx:148,cy:192,opacity:0},{cx:176,cy:192,opacity:0},{cx:224,cy:192,opacity:0},{cx:252,cy:192,opacity:0}],
    reformTop:{cy:88, rx:50,ry:34,opacity:1}, reformBot:{cy:192,rx:50,ry:34,opacity:1},
    dcTopCy:72, dcBotCy:208, dcRx:114, dcRy:58, dcOp:0,
  },
  // 5 ─ CYTOKINESIS
  {
    cellRx:133, cellRy:126, cellOp:0,
    nucR:56, nucOp:0, nuclOp:0, chromatinOp:0,
    centroTopY:24, centroTopOp:0, centroBotY:256, centroBotOp:0,
    spindleOp:0, plateOp:0, furrowDepth:0,
    xchroms:[
      {cx:190,cy:72, size:6,opacity:0.3,angle:0},
      {cx:210,cy:72, size:6,opacity:0.3,angle:0},
      {cx:190,cy:208,size:6,opacity:0.3,angle:0},
      {cx:210,cy:208,size:6,opacity:0.3,angle:0},
    ],
    vtop:[{cx:148,cy:72, opacity:0},{cx:176,cy:72, opacity:0},{cx:224,cy:72, opacity:0},{cx:252,cy:72, opacity:0}],
    vbot:[{cx:148,cy:208,opacity:0},{cx:176,cy:208,opacity:0},{cx:224,cy:208,opacity:0},{cx:252,cy:208,opacity:0}],
    reformTop:{cy:72, rx:26,ry:26,opacity:1}, reformBot:{cy:208,rx:26,ry:26,opacity:1},
    dcTopCy:72, dcBotCy:208, dcRx:114, dcRy:58, dcOp:1,
  },
];

// ─── Interpolated cell SVG ────────────────────────────────────────────────────

function InterpolatedCell({ progress, viewBox: vb = "0 0 400 280" }: { progress: number; viewBox?: string }) {
  const clamped = Math.max(0, Math.min(progress, PS.length - 1));
  const fi = Math.min(Math.floor(clamped), PS.length - 1);
  const ci = Math.min(fi + 1, PS.length - 1);
  const t  = fi === ci ? 0 : clamped - fi;
  const s  = lerpState(PS[fi], PS[ci], t);

  // Furrow inner-x moves toward centre as depth increases
  const fwL = 112 + s.furrowDepth * 38;
  const fwR = 288 - s.furrowDepth * 38;

  // ── Label opacity pre-computation ────────────────────────────────────────────
  // How separated are the rightmost pair of sister chromatids?
  // 0 = joined at equator (metaphase), 1 = fully pulled apart (anaphase)
  const sep3 = Math.min(Math.abs(s.vtop[3].cy - s.vbot[3].cy) / 60, 1);
  const together3 = 1 - sep3;

  // "Chromosome" label: visible when xchroms present (prophase) OR vtop+vbot joined (metaphase).
  // Xchroms are intentionally faint in telophase/cytokinesis (opacity 0.3–0.45) but we want the
  // label to stay readable, so clamp the xchrom contribution to a minimum of 0.85 when non-zero.
  const chromLabelOp = Math.max(
    s.xchroms[3].opacity > 0.01 ? Math.max(s.xchroms[3].opacity, 0.85) : 0,
    s.vtop[3].opacity * together3
  );

  // "Sister chromatid" label: fades in as the chromatids physically pull apart
  const chromatidLabelOp = s.vtop[3].opacity * sep3;

  // "Centromere" label: shown at leftmost chromosome when plate is visible and chromatids joined
  const sep0 = Math.min(Math.abs(s.vtop[0].cy - s.vbot[0].cy) / 60, 1);
  const centromereOp = s.plateOp * Math.max(s.xchroms[0].opacity, s.vtop[0].opacity * (1 - sep0));

  // Label follows xchroms[3] in prophase, vtop[3] from metaphase onward
  const anchorCx = s.xchroms[3].opacity > 0.05 ? s.xchroms[3].cx : s.vtop[3].cx;
  const anchorCy = s.xchroms[3].opacity > 0.05 ? s.xchroms[3].cy : s.vtop[3].cy;
  const centAnchorCx = s.xchroms[0].opacity > 0.05 ? s.xchroms[0].cx : s.vtop[0].cx;
  const centAnchorCy = s.xchroms[0].opacity > 0.05 ? s.xchroms[0].cy : s.vtop[0].cy;

  return (
    <svg viewBox={vb} className="w-full h-full" aria-label="Mitosis cell diagram">

      {/* ── Main cell ── */}
      <ellipse cx={200} cy={140} rx={s.cellRx} ry={s.cellRy}
        fill="rgba(16,185,129,0.05)" stroke={C.membrane} strokeWidth={2.5}
        strokeDasharray="12 5" opacity={s.cellOp} />

      {/* ── Cleavage furrow notches ── */}
      {s.furrowDepth > 0.01 && <>
        <path d={`M 67 140 Q ${fwL-18} 136 ${fwL} 140 Q ${fwL-18} 144 67 140`}
          fill={C.furrow} fillOpacity={0.12} stroke={C.furrow} strokeWidth={1.4}
          opacity={s.cellOp * s.furrowDepth} />
        <path d={`M 333 140 Q ${fwR+18} 136 ${fwR} 140 Q ${fwR+18} 144 333 140`}
          fill={C.furrow} fillOpacity={0.12} stroke={C.furrow} strokeWidth={1.4}
          opacity={s.cellOp * s.furrowDepth} />
      </>}

      {/* ── Daughter cells ── */}
      {s.dcOp > 0.01 && <>
        <ellipse cx={200} cy={s.dcTopCy} rx={s.dcRx} ry={s.dcRy}
          fill="rgba(16,185,129,0.07)" stroke={C.membrane} strokeWidth={2.5}
          strokeDasharray="12 5" opacity={s.dcOp} />
        <ellipse cx={200} cy={s.dcBotCy} rx={s.dcRx} ry={s.dcRy}
          fill="rgba(16,185,129,0.07)" stroke={C.membrane} strokeWidth={2.5}
          strokeDasharray="12 5" opacity={s.dcOp} />
      </>}

      {/* ── Nuclear envelope (interphase / prophase) ── */}
      {s.nucOp > 0.01 &&
        <circle cx={200} cy={140} r={s.nucR}
          fill="rgba(139,92,246,0.07)" stroke={C.nucleus} strokeWidth={2}
          strokeDasharray={s.nucOp > 0.6 ? "7 3" : "4 7"} opacity={s.nucOp} />}

      {/* ── Nucleolus ── */}
      {s.nuclOp > 0.01 && <>
        <circle cx={196} cy={136} r={20} fill="rgba(139,92,246,0.28)" opacity={s.nuclOp} />
        <circle cx={196} cy={136} r={11} fill="rgba(109,40,217,0.42)" opacity={s.nuclOp} />
      </>}

      {/* ── Chromatin (interphase) ── */}
      {s.chromatinOp > 0.01 && ["M 184 150 Q 192 141 188 129","M 209 150 Q 216 141 211 129",
        "M 196 162 Q 207 156 212 164","M 177 140 Q 169 133 174 123",
        "M 220 146 Q 230 140 226 131","M 201 123 Q 208 116 217 121",
      ].map((d,i) => (
        <path key={i} d={d} fill="none" stroke={C.nucleus} strokeWidth={2}
          opacity={s.chromatinOp * 0.4} strokeLinecap="round" />
      ))}

      {/* ── Centrosomes ── */}
      {s.centroTopOp > 0.01 &&
        <circle cx={200} cy={s.centroTopY} r={5.5} fill={C.spindle} opacity={s.centroTopOp} />}
      {s.centroBotOp > 0.01 &&
        <circle cx={200} cy={s.centroBotY} r={5.5} fill={C.spindle} opacity={s.centroBotOp} />}

      {/* ── Spindle fibers to X-chromosomes ── */}
      {s.spindleOp > 0.01 && s.xchroms.map((xc, i) => xc.opacity > 0.01 ? (
        <g key={`xsp${i}`} opacity={s.spindleOp * xc.opacity}>
          {s.centroTopOp > 0.01 && <line x1={200} y1={s.centroTopY} x2={xc.cx} y2={xc.cy}
            stroke={C.spindle} strokeWidth={0.9} opacity={s.centroTopOp} />}
          {s.centroBotOp > 0.01 && <line x1={200} y1={s.centroBotY} x2={xc.cx} y2={xc.cy}
            stroke={C.spindle} strokeWidth={0.9} opacity={s.centroBotOp} />}
        </g>
      ) : null)}

      {/* ── Spindle fibers to V-chromatids ── */}
      {s.spindleOp > 0.01 && <>
        {s.vtop.map((vt, i) => vt.opacity > 0.01 && s.centroTopOp > 0.01 ? (
          <line key={`vtsp${i}`} x1={200} y1={s.centroTopY} x2={vt.cx} y2={vt.cy}
            stroke={C.spindle} strokeWidth={0.9} opacity={s.spindleOp * vt.opacity * s.centroTopOp} />
        ) : null)}
        {s.vbot.map((vb, i) => vb.opacity > 0.01 && s.centroBotOp > 0.01 ? (
          <line key={`vbsp${i}`} x1={200} y1={s.centroBotY} x2={vb.cx} y2={vb.cy}
            stroke={C.spindle} strokeWidth={0.9} opacity={s.spindleOp * vb.opacity * s.centroBotOp} />
        ) : null)}
      </>}

      {/* ── Metaphase plate ── */}
      {s.plateOp > 0.01 &&
        <line x1={52} y1={140} x2={348} y2={140}
          stroke={C.plate} strokeWidth={1} strokeDasharray="6 4" opacity={s.plateOp} />}

      {/* ── X-chromosomes ── */}
      {s.xchroms.map((xc, i) => xc.opacity > 0.01 ? (
        <g key={`xc${i}`} transform={`translate(${xc.cx},${xc.cy}) rotate(${xc.angle})`}
          opacity={xc.opacity}>
          <line x1={0} y1={-xc.size} x2={0} y2={xc.size}
            stroke={C.chrom[i]} strokeWidth={4.5} strokeLinecap="round" />
          <line x1={-xc.size*0.72} y1={-xc.size*0.32} x2={xc.size*0.72} y2={xc.size*0.32}
            stroke={C.chrom[i]} strokeWidth={4.5} strokeLinecap="round" />
          {xc.size > 5 && <circle r={2} fill="white" opacity={0.55} />}
        </g>
      ) : null)}

      {/* ── V-chromatids (top — arms point up) ── */}
      {s.vtop.map((vt, i) => vt.opacity > 0.01 ? (
        <g key={`vt${i}`} opacity={vt.opacity}>
          <line x1={vt.cx} y1={vt.cy} x2={vt.cx-7.5} y2={vt.cy-10}
            stroke={C.chrom[i]} strokeWidth={4} strokeLinecap="round" />
          <line x1={vt.cx} y1={vt.cy} x2={vt.cx+7.5} y2={vt.cy-10}
            stroke={C.chrom[i]} strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : null)}

      {/* ── V-chromatids (bottom — arms point down) ── */}
      {s.vbot.map((vb, i) => vb.opacity > 0.01 ? (
        <g key={`vb${i}`} opacity={vb.opacity}>
          <line x1={vb.cx} y1={vb.cy} x2={vb.cx-7.5} y2={vb.cy+10}
            stroke={C.chrom[i]} strokeWidth={4} strokeLinecap="round" />
          <line x1={vb.cx} y1={vb.cy} x2={vb.cx+7.5} y2={vb.cy+10}
            stroke={C.chrom[i]} strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : null)}

      {/* ── Reform nuclei ── */}
      {s.reformTop.opacity > 0.01 &&
        <ellipse cx={200} cy={s.reformTop.cy} rx={s.reformTop.rx} ry={s.reformTop.ry}
          fill="rgba(139,92,246,0.07)" stroke={C.nucleus} strokeWidth={1.7}
          strokeDasharray="5 3" opacity={s.reformTop.opacity} />}
      {s.reformBot.opacity > 0.01 &&
        <ellipse cx={200} cy={s.reformBot.cy} rx={s.reformBot.rx} ry={s.reformBot.ry}
          fill="rgba(139,92,246,0.07)" stroke={C.nucleus} strokeWidth={1.7}
          strokeDasharray="5 3" opacity={s.reformBot.opacity} />}

      {/* ── Centromere dots — white dot where sister chromatids are still joined.
             Dissolves naturally as vtop and vbot pull apart (no discrete fade). ── */}
      {s.vtop.map((vt, i) => {
        const dist = Math.abs(vt.cy - s.vbot[i].cy);
        const centOp = Math.max(0, 1 - dist / 45) * Math.min(vt.opacity, s.vbot[i].opacity);
        return centOp > 0.01 ? (
          <circle key={`centdot${i}`}
            cx={vt.cx} cy={lerp(vt.cy, s.vbot[i].cy, 0.5)}
            r={2.8} fill="white" opacity={centOp * 0.7} />
        ) : null;
      })}

      {/* ── Labels — rendered last, sit above all other elements ── */}

      {/* Chromatin (interphase) — right of nucleus, above centre */}
      {s.chromatinOp > 0.05 && (
        <g opacity={s.chromatinOp} fontFamily="system-ui, -apple-system, sans-serif">
          <line x1={239} y1={131} x2={259} y2={121} stroke={C.nucleus} strokeWidth={0.9} opacity={0.45} />
          <text x={262} y={118} fontSize={11} fontWeight="700" fill={C.nucleus}>Chromatin</text>
        </g>
      )}

      {/* Chromosome / 2 sister chromatids — RIGHT side, follows rightmost chromosome */}
      {chromLabelOp > 0.05 && (
        <g opacity={chromLabelOp} fontFamily="system-ui, -apple-system, sans-serif">
          <line x1={anchorCx + 9} y1={anchorCy - 7} x2={anchorCx + 21} y2={anchorCy - 20}
            stroke={C.chrom[3]} strokeWidth={0.9} opacity={0.45} />
          <text x={anchorCx + 23} y={anchorCy - 23} fontSize={11} fontWeight="700" fill={C.chrom[3]}>
            Chromosome
          </text>
          <text x={anchorCx + 23} y={anchorCy - 11} fontSize={9} fill={C.chrom[3]} opacity={0.75}>
            2 sister chromatids
          </text>
        </g>
      )}

      {/* Centromere — LEFT side at chromosome height, clear of spindle lines below */}
      {centromereOp > 0.05 && (
        <g opacity={centromereOp} fontFamily="system-ui, -apple-system, sans-serif">
          <line x1={72} y1={centAnchorCy} x2={centAnchorCx - 4} y2={centAnchorCy}
            stroke={C.plate} strokeWidth={0.9} opacity={0.5} />
          <text x={8} y={centAnchorCy + 4} fontSize={10} fontWeight="600" fill={C.plate}>
            Centromere
          </text>
        </g>
      )}

      {/* Spindle fiber — LEFT side (vtop[0] spindle), clear of Sister chromatid on right */}
      {s.spindleOp > 0.12 && s.vtop[0].opacity > 0.01 && (() => {
        const mx = lerp(200, s.vtop[0].cx, 0.5);
        const my = lerp(s.centroTopY, s.vtop[0].cy, 0.5);
        const ty = my - 5;
        return (
          <g opacity={Math.min(s.spindleOp * 1.5, 0.88)} fontFamily="system-ui, -apple-system, sans-serif">
            <line x1={84} y1={ty + 3} x2={mx} y2={my}
              stroke={C.spindle} strokeWidth={0.9} opacity={0.55} />
            <text x={8} y={ty} fontSize={11} fontWeight="700" fill={C.spindle}>Spindle fiber</text>
          </g>
        );
      })()}

      {/* Sister chromatid / now a chromosome — RIGHT side, follows rightmost top chromatid */}
      {chromatidLabelOp > 0.05 && (
        <g opacity={chromatidLabelOp} fontFamily="system-ui, -apple-system, sans-serif">
          <line x1={s.vtop[3].cx + 10} y1={s.vtop[3].cy - 9}
                x2={s.vtop[3].cx + 22} y2={s.vtop[3].cy - 22}
            stroke={C.chrom[3]} strokeWidth={0.9} opacity={0.45} />
          <text x={s.vtop[3].cx + 24} y={s.vtop[3].cy - 25}
            fontSize={11} fontWeight="700" fill={C.chrom[3]}>Sister chromatid</text>
          <text x={s.vtop[3].cx + 24} y={s.vtop[3].cy - 13}
            fontSize={9} fill={C.chrom[3]} opacity={0.75}>
            <tspan>now a </tspan><tspan fontWeight="900" fontSize={12}>chromosome</tspan>
          </text>
        </g>
      )}

    </svg>
  );
}

// ─── Phase metadata ───────────────────────────────────────────────────────────

const PHASES = [
  {
    name:"Interphase", subtitle:"G₂ — Preparation", accent:"#10b981",
    accentBg:"rgba(16,185,129,0.08)", dotClass:"bg-emerald-500",
    description:"The cell has already duplicated its DNA and is growing in preparation for division. Chromosomes exist as loosely coiled chromatin — not yet condensed into visible X shapes.",
    keyPoints:["DNA was fully replicated during S phase","Cell grows and synthesizes division proteins","Centrosomes have been duplicated"],
  },
  {
    name:"Prophase", subtitle:"Chromosomes Condense", accent:"#8b5cf6",
    accentBg:"rgba(139,92,246,0.08)", dotClass:"bg-violet-500",
    description:"Chromosomes coil tightly and become visible as distinct X-shaped structures. The nuclear envelope begins to dissolve and centrosomes migrate toward opposite poles, forming the mitotic spindle.",
    keyPoints:["Chromatin coils into distinct condensed chromosomes","Nuclear envelope breaks down","Spindle fibers begin extending from centrosomes"],
  },
  {
    name:"Metaphase", subtitle:"Alignment", accent:"#38bdf8",
    accentBg:"rgba(56,189,248,0.08)", dotClass:"bg-sky-400",
    description:"Spindle fibers push and pull chromosomes until all align along the cell's equator — the metaphase plate. This is the cell's checkpoint: every chromosome must be correctly attached before division proceeds.",
    keyPoints:["Chromosomes align at the metaphase plate (equator)","Spindle fibers attach to centromeres from both poles","Spindle assembly checkpoint ensures correct attachment"],
  },
  {
    name:"Anaphase", subtitle:"Separation", accent:"#fb923c",
    accentBg:"rgba(251,146,60,0.08)", dotClass:"bg-orange-400",
    description:"Spindle fibers shorten, pulling sister chromatids apart toward opposite poles. Each chromatid is now a full chromosome. The cell visibly elongates as the poles are pushed further apart.",
    keyPoints:["Sister chromatids separate at the centromere","Shortening spindle fibers pull chromatids to poles","46 chromosomes move to each pole (in human cells)"],
  },
  {
    name:"Telophase", subtitle:"Envelopes Reform", accent:"#a78bfa",
    accentBg:"rgba(167,139,250,0.08)", dotClass:"bg-violet-400",
    description:"A nuclear envelope reassembles around each cluster of chromosomes at the poles. Chromosomes begin to decondense back into chromatin. The cleavage furrow starts to form at the cell's equator.",
    keyPoints:["Nuclear envelopes reform around each chromosome set","Chromosomes begin decondensing into chromatin","Cleavage furrow starts forming at the equator"],
  },
  {
    name:"Cytokinesis", subtitle:"Cell Splits", accent:"#10b981",
    accentBg:"rgba(16,185,129,0.08)", dotClass:"bg-emerald-500",
    description:"A contractile ring of actin filaments pinches the plasma membrane inward, deepening the cleavage furrow until the cytoplasm splits in two — producing two genetically identical daughter cells.",
    keyPoints:["Actin–myosin ring contracts to form cleavage furrow","Cytoplasm divides (cytokinesis)","Two diploid (2n) daughter cells — genetically identical to the parent"],
  },
] as const;

const PHASE_COUNT = PHASES.length;
const DRAG_PER_PHASE = 108;

// ─── Shared context ───────────────────────────────────────────────────────────

interface MitosisCtxValue {
  clampedProgress: number;
  snapIdx: number;
  progressPct: number;
  cur: (typeof PHASES)[number];
  springTo: (target: number) => void;
  setProgressDirect: (value: number) => void;
  animRef: React.MutableRefObject<AnimationPlaybackControls | null>;
}

const MitosisCtx = createContext<MitosisCtxValue | null>(null);
function useMitosis() {
  const ctx = useContext(MitosisCtx);
  if (!ctx) throw new Error("Must be used inside MitosisProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MitosisProvider({ children }: { children: React.ReactNode }) {
  const progress = useMotionValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  useMotionValueEvent(progress, "change", setDisplayProgress);
  const animRef = useRef<AnimationPlaybackControls | null>(null);

  function springTo(target: number) {
    animRef.current?.stop();
    animRef.current = animate(progress, target, { type:"spring", stiffness:380, damping:30 });
  }
  function setProgressDirect(value: number) {
    animRef.current?.stop();
    progress.set(value);
  }

  const clamped = Math.max(0, Math.min(displayProgress, PHASE_COUNT - 1));
  const snapIdx = Math.round(clamped);

  return (
    <MitosisCtx.Provider value={{
      clampedProgress: clamped,
      snapIdx,
      progressPct: (clamped / (PHASE_COUNT - 1)) * 100,
      cur: PHASES[snapIdx],
      springTo, setProgressDirect, animRef,
    }}>
      {children}
    </MitosisCtx.Provider>
  );
}

// ─── MitosisViewer ────────────────────────────────────────────────────────────

export function MitosisViewer() {
  const { clampedProgress, snapIdx, progressPct, cur, springTo, setProgressDirect, animRef } = useMitosis();

  const [isDragging, setIsDragging]         = useState(false);
  const [hasEverDragged, setHasEverDragged] = useState(false);
  const dragStartX          = useRef(0);
  const progressAtDragStart = useRef(0);

  // Arrow key navigation — only active when viewer is focused or no other input is focused
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
    // +dx → drag right = advance phases
    const raw = progressAtDragStart.current + (e.clientX - dragStartX.current) / DRAG_PER_PHASE;
    setProgressDirect(Math.max(0, Math.min(PHASE_COUNT - 1, raw)));
  }
  function onPointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    springTo(Math.round(clampedProgress));
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

      {/* Phase tabs */}
      <div className="grid grid-cols-6 border-b border-zinc-100">
        {PHASES.map((p, i) => (
          <button key={p.name} onClick={() => springTo(i)}
            className={`py-2.5 text-[11px] font-semibold leading-tight px-1 transition-colors ${
              snapIdx === i ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
            }`}>
            {p.name}
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
        {/* Interpolated SVG */}
        <div className="relative bg-gradient-to-br from-zinc-50 to-white">
          <div className="relative w-full" style={{ aspectRatio: "400 / 280" }}>
            <InterpolatedCell progress={clampedProgress} />
          </div>
          {!hasEverDragged && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2.5 rounded-full bg-black/55 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span aria-hidden="true">←</span>drag to explore phases<span aria-hidden="true">→</span>
              </div>
            </div>
          )}
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

// ─── MitosisPanel ─────────────────────────────────────────────────────────────

export function MitosisPanel() {
  const { snapIdx, progressPct, cur, springTo } = useMitosis();
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="p-5" style={{ background: cur.accentBg }}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:cur.accent }}>
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

// ─── MitosisAnimation — single-column wrapper ─────────────────────────────────

export function MitosisAnimation() {
  return (
    <MitosisProvider>
      <div className="space-y-3">
        <MitosisViewer />
        <MitosisPanel />
      </div>
    </MitosisProvider>
  );
}

// ─── Lesson card emblem (telophase snapshot) ──────────────────────────────────

export function MitosisEmblem({ className }: { className?: string }) {
  return (
    <div className={className ?? "w-full h-full"}>
      <InterpolatedCell progress={4} viewBox="80 20 240 240" />
    </div>
  );
}
