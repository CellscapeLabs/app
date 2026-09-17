"use client";
/*
 * Biology concept: DNA Replication — the replication fork
 * Follows one fork through seven stages:
 *   Stage 1 Parent DNA: antiparallel double strand (top 3′→5′, bottom 5′→3′)
 *   Stage 2 Unzipping: helicase breaks H-bonds, topoisomerase relieves supercoiling ahead,
 *           single-strand binding proteins (SSBs) keep the separated strands apart
 *   Stage 3 Priming: primase lays short RNA primers — polymerase can only extend a 3′ end
 *   Stage 4 Leading strand: DNA polymerase III builds continuously 5′→3′, toward the fork
 *   Stage 5 Lagging strand: built 5′→3′ away from the fork in Okazaki fragments
 *   Stage 6 Sealing: DNA polymerase I swaps RNA primers for DNA; ligase seals the nicks
 *   Stage 7 Result: two daughter molecules, each one old + one new strand (semiconservative)
 * Interactions: Drag right to advance stages, left to go back (or ← → keys / stage tabs).
 * The fork slides open as you scrub and new strands grow continuously. EnzymeRoster
 * shares state via DnaReplicationProvider — tapping an enzyme jumps to the stage where it works.
 */

import { useState, useRef, createContext, useContext, useEffect } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControls,
} from "framer-motion";
import type React from "react";
import { lerp, fadeLerp } from "@/lib/scrub";

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  parent:   "#64748b",   // slate-500 — original (template) strands
  newDna:   "#10b981",   // emerald-500 — newly built DNA
  primer:   "#f43f5e",   // rose-500 — RNA primer
  rung:     "#cbd5e1",   // slate-300 — base pairs
  helicase: "#f59e0b",   // amber-500
  topo:     "#0ea5e9",   // sky-500
  ssb:      "#94a3b8",   // slate-400
  primase:  "#84cc16",   // lime-500
  pol3:     "#8b5cf6",   // violet-500
  pol1:     "#6366f1",   // indigo-500
  ligase:   "#ec4899",   // pink-500
  label:    "#52525b",   // zinc-600
  muted:    "#a1a1aa",   // zinc-400
};

// ─── Geometry ─────────────────────────────────────────────────────────────────
// Unreplicated duplex sits right of the fork; the two template arms spread apart
// to its left. The fork moves right as replication proceeds.
const X_L = 20, X_R = 380;
const DUP_TOP = 118, DUP_BOT = 142;          // duplex strand heights
const ARM_TOP = 62,  ARM_BOT = 198;          // separated template arms
const NEW_TOP = ARM_TOP + 18;                // leading strand (pairs with top template)
const NEW_BOT = ARM_BOT - 18;                // lagging strand (pairs with bottom template)
const TRANS = 44;                            // length of the fork's opening curve
const PRIMER = 12;                           // primer length
const LEAD_START = 26;
const ROW_TOP = 46, ROW_BOT = 214, ROW_BOT2 = 228;  // label rows above / below the arms

// Lagging-strand Okazaki fragments, oldest (left) to newest (right).
// Each is built right → left from a primer at its right (5′) end.
const FRAGS = [
  { l: 40,  r: 110 },
  { l: 116, r: 186 },
  { l: 192, r: 248 },
  { l: 254, r: 314 },
  { l: 320, r: 376 },
] as const;

function smooth(t: number) { return t * t * (3 - 2 * t); }

/** Height of a template strand at x, given where the fork currently is. */
function strandY(x: number, fork: number, armY: number, dupY: number) {
  const d = fork - x;
  if (d <= 0) return dupY;
  if (d >= TRANS) return armY;
  return lerp(dupY, armY, smooth(d / TRANS));
}

function strandPath(fork: number, armY: number, dupY: number) {
  const xs: number[] = [];
  for (let x = X_L; x < X_R; x += 4) xs.push(x);
  xs.push(X_R);
  if (fork > X_L && fork < X_R) xs.push(fork);
  xs.sort((a, b) => a - b);
  return xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${strandY(x, fork, armY, dupY).toFixed(1)}`).join(" ");
}

// ─── Interpolated state ───────────────────────────────────────────────────────
interface RepState {
  fork:      number;   // x of the fork point
  leadEnd:   number;   // x of the leading strand's growing 3′ end
  g1: number; g2: number; g3: number; g4: number; g5: number;  // fragment growth 0–1

  // Opacities (cross-faded)
  leadPrimerOp: number;
  p1: number; p2: number; p3: number;       // lagging primers still present
  fill1Op:    number;   // F1 primer replaced + nick sealed
  sealAllOp:  number;   // lagging strand fully continuous
  helicaseOp: number;
  topoOp:     number;
  ssbTopOp:   number;
  ssbBotOp:   number;
  primaseOp:  number;
  pol3LeadOp: number;
  pol3LagOp:  number;
  pol1Op:     number;
  ligaseOp:   number;
  forkLabelOp:    number;
  parentLabelOp:  number;
  leadLabelOp:    number;
  lagLabelOp:     number;
  daughterOp:     number;
}

const LINEAR_KEYS = new Set<keyof RepState>(["fork", "leadEnd", "g1", "g2", "g3", "g4", "g5"]);

function lerpState(a: RepState, b: RepState, t: number): RepState {
  const out = { ...a };
  (Object.keys(a) as (keyof RepState)[]).forEach((k) => {
    out[k] = LINEAR_KEYS.has(k) ? lerp(a[k], b[k], t) : fadeLerp(a[k], b[k], t);
  });
  return out;
}

const BASE: RepState = {
  fork: 10, leadEnd: LEAD_START + PRIMER, g1: 0, g2: 0, g3: 0, g4: 0, g5: 0,
  leadPrimerOp: 0, p1: 0, p2: 0, p3: 0, fill1Op: 0, sealAllOp: 0,
  helicaseOp: 0, topoOp: 0, ssbTopOp: 0, ssbBotOp: 0, primaseOp: 0,
  pol3LeadOp: 0, pol3LagOp: 0, pol1Op: 0, ligaseOp: 0,
  forkLabelOp: 0, parentLabelOp: 0, leadLabelOp: 0, lagLabelOp: 0, daughterOp: 0,
};
const ENZYMES_AT_FORK = { helicaseOp: 1, topoOp: 1, forkLabelOp: 1 };

const KS: RepState[] = [
  // 0 — Parent DNA
  { ...BASE, parentLabelOp: 1 },
  // 1 — Unzipping
  { ...BASE, ...ENZYMES_AT_FORK, fork: 220, ssbTopOp: 1, ssbBotOp: 1 },
  // 2 — Priming
  { ...BASE, ...ENZYMES_AT_FORK, fork: 240, ssbTopOp: 1, ssbBotOp: 1, primaseOp: 1,
    leadPrimerOp: 1, p1: 1, p2: 1 },
  // 3 — Leading strand
  { ...BASE, ...ENZYMES_AT_FORK, fork: 260, leadEnd: 212, ssbBotOp: 1,
    leadPrimerOp: 1, p1: 1, p2: 1, pol3LeadOp: 1, leadLabelOp: 1 },
  // 4 — Lagging strand
  { ...BASE, ...ENZYMES_AT_FORK, fork: 294, leadEnd: 246, ssbBotOp: 1, g1: 1, g2: 1, g3: 1,
    leadPrimerOp: 1, p1: 1, p2: 1, p3: 1, pol3LeadOp: 1, pol3LagOp: 1, leadLabelOp: 1, lagLabelOp: 1 },
  // 5 — Sealing
  { ...BASE, ...ENZYMES_AT_FORK, fork: 304, leadEnd: 256, ssbBotOp: 1, g1: 1, g2: 1, g3: 1,
    leadPrimerOp: 1, p2: 1, p3: 1, fill1Op: 1, pol1Op: 1, ligaseOp: 1, leadLabelOp: 1, lagLabelOp: 1 },
  // 6 — Two daughter molecules
  { ...BASE, fork: 440, leadEnd: X_R - 4, g1: 1, g2: 1, g3: 1, g4: 1, g5: 1, sealAllOp: 1, daughterOp: 1 },
];

// ─── Small pieces ─────────────────────────────────────────────────────────────
function Label({ x, y, text, color, op, anchor = "middle" }: {
  x: number; y: number; text: string; color: string; op: number; anchor?: "start" | "middle" | "end";
}) {
  if (op < 0.01) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={8} fontWeight={700} fill={color}
      fontFamily="system-ui" opacity={op}>{text}</text>
  );
}

function Enzyme({ x, y, w, h, color, op }: { x: number; y: number; w: number; h: number; color: string; op: number }) {
  if (op < 0.01) return null;
  return (
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={Math.min(w, h) / 2}
      fill={color} fillOpacity={0.35} stroke={color} strokeWidth={1.8} opacity={op} />
  );
}

// ─── Replication fork diagram ─────────────────────────────────────────────────
function ForkDiagram({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(progress, KS.length - 1));
  const fi = Math.min(Math.floor(clamped), KS.length - 2);
  const s  = lerpState(KS[fi], KS[fi + 1], clamped - fi);
  const fork = s.fork;
  const flatEnd = fork - TRANS;                   // arms are flat left of here
  const growth = [s.g1, s.g2, s.g3, s.g4, s.g5];

  // Lagging fragment extents (DNA grows leftward from its primer)
  const frags = FRAGS.map((f, i) => {
    const dnaRight = f.r - PRIMER;
    const dnaLeft  = dnaRight - growth[i] * (dnaRight - f.l);
    return { ...f, dnaLeft, dnaRight, g: growth[i] };
  });
  const primerOps = [s.p1, s.p2, s.p3, 0, 0];

  // Base-pair rungs
  const rungs: React.ReactNode[] = [];
  for (let x = X_L + 6; x <= X_R; x += 12) {
    if (x > fork + 3) {
      rungs.push(<line key={`d${x}`} x1={x} y1={DUP_TOP + 2} x2={x} y2={DUP_BOT - 2} stroke={C.rung} strokeWidth={2} />);
    } else if (x < flatEnd - 2) {
      const leadPaired = x >= LEAD_START && x <= Math.max(s.leadEnd, LEAD_START + PRIMER) && (s.leadEnd > LEAD_START + PRIMER + 1 || s.leadPrimerOp > 0.01);
      const lagPaired  = s.sealAllOp > 0.5 || frags.some((f, i) =>
        (x >= f.dnaLeft && x <= f.dnaRight && f.g > 0.01) || (x >= f.r - PRIMER && x <= f.r && primerOps[i] > 0.01));
      rungs.push(
        <line key={`t${x}`} x1={x} y1={ARM_TOP + 2} x2={x} y2={leadPaired ? NEW_TOP - 2 : ARM_TOP + 8}
          stroke={C.rung} strokeWidth={2} />,
        <line key={`b${x}`} x1={x} y1={ARM_BOT - 2} x2={x} y2={lagPaired ? NEW_BOT + 2 : ARM_BOT - 8}
          stroke={C.rung} strokeWidth={2} />,
      );
    }
  }

  const ssbXs = [fork - 34, fork - 20];

  return (
    <svg viewBox="0 0 400 280" className="h-full w-full" role="img"
      aria-label="DNA replication fork: two template strands separating, with leading and lagging strands being built">

      {rungs}

      {/* ── Template strands ── */}
      <path d={strandPath(fork, ARM_TOP, DUP_TOP)} fill="none" stroke={C.parent} strokeWidth={3.5} strokeLinecap="round" />
      <path d={strandPath(fork, ARM_BOT, DUP_BOT)} fill="none" stroke={C.parent} strokeWidth={3.5} strokeLinecap="round" />

      {/* ── Leading strand: primer, then continuous DNA ── */}
      {s.leadPrimerOp > 0.01 && (
        <line x1={LEAD_START} y1={NEW_TOP} x2={LEAD_START + PRIMER} y2={NEW_TOP}
          stroke={C.primer} strokeWidth={3.5} opacity={s.leadPrimerOp} />
      )}
      {s.leadEnd > LEAD_START + PRIMER + 0.5 && (
        <line x1={LEAD_START + PRIMER} y1={NEW_TOP} x2={s.leadEnd} y2={NEW_TOP} stroke={C.newDna} strokeWidth={3.5} />
      )}

      {/* ── Lagging strand: Okazaki fragments with primers at their right ends ── */}
      {frags.map((f, i) => (
        <g key={i}>
          {f.g > 0.01 && (
            <line x1={f.dnaLeft} y1={NEW_BOT} x2={f.dnaRight} y2={NEW_BOT} stroke={C.newDna} strokeWidth={3.5} />
          )}
          {primerOps[i] > 0.01 && (
            <line x1={f.r - PRIMER} y1={NEW_BOT} x2={f.r} y2={NEW_BOT} stroke={C.primer} strokeWidth={3.5} opacity={primerOps[i]} />
          )}
        </g>
      ))}
      {s.fill1Op > 0.01 && (
        <line x1={FRAGS[0].r - PRIMER} y1={NEW_BOT} x2={FRAGS[1].l} y2={NEW_BOT} stroke={C.newDna} strokeWidth={3.5} opacity={s.fill1Op} />
      )}
      {s.sealAllOp > 0.01 && (
        <line x1={FRAGS[0].l} y1={NEW_BOT} x2={FRAGS[4].r} y2={NEW_BOT} stroke={C.newDna} strokeWidth={3.5} opacity={s.sealAllOp} />
      )}
      {s.sealAllOp > 0.01 && (
        <line x1={LEAD_START} y1={NEW_TOP} x2={X_R - 4} y2={NEW_TOP} stroke={C.newDna} strokeWidth={3.5} opacity={s.sealAllOp} />
      )}

      {/* ── Enzymes ── */}
      {/* Topoisomerase clamps the duplex ahead of the fork */}
      <Enzyme x={fork + 46} y={(DUP_TOP + DUP_BOT) / 2} w={16} h={40} color={C.topo} op={s.topoOp} />
      <Label x={fork + 46} y={DUP_TOP - 16} text="Topoisomerase" color={C.topo} op={s.topoOp} />

      {/* SSBs coat exposed single strands */}
      {ssbXs.map((x) => (
        <g key={x}>
          {s.ssbTopOp > 0.01 && (
            <circle cx={x} cy={strandY(x, fork, ARM_TOP, DUP_TOP)} r={4.5} fill="#e2e8f0" stroke={C.ssb} strokeWidth={1.5} opacity={s.ssbTopOp} />
          )}
          {s.ssbBotOp > 0.01 && (
            <circle cx={x} cy={strandY(x, fork, ARM_BOT, DUP_BOT)} r={4.5} fill="#e2e8f0" stroke={C.ssb} strokeWidth={1.5} opacity={s.ssbBotOp} />
          )}
        </g>
      ))}
      <Label x={fork - 8} y={92} text="SSBs" color="#64748b" op={s.ssbTopOp} anchor="start" />
      <Label x={fork - 8} y={178} text="SSBs" color="#64748b" op={s.ssbBotOp} anchor="start" />

      {/* Helicase at the fork */}
      {s.helicaseOp > 0.01 && (
        <ellipse cx={fork - 6} cy={(DUP_TOP + DUP_BOT) / 2} rx={10} ry={15}
          fill="white" fillOpacity={0.6} stroke={C.helicase} strokeWidth={4} opacity={s.helicaseOp} />
      )}
      <Label x={fork + 8} y={DUP_BOT + 24} text="Helicase" color="#b45309" op={s.helicaseOp} anchor="start" />

      {/* Primase on both new strands */}
      <Enzyme x={LEAD_START + PRIMER / 2} y={NEW_TOP} w={20} h={12} color={C.primase} op={s.primaseOp} />
      <Label x={LEAD_START + PRIMER / 2} y={ROW_TOP} text="Primase" color="#4d7c0f" op={s.primaseOp} />
      <Enzyme x={FRAGS[1].r - PRIMER / 2} y={NEW_BOT} w={20} h={12} color={C.primase} op={s.primaseOp} />
      <Label x={FRAGS[1].r - PRIMER / 2} y={ROW_BOT} text="Primase" color="#4d7c0f" op={s.primaseOp} />

      {/* DNA polymerase III at each growing 3′ end */}
      <Enzyme x={s.leadEnd} y={NEW_TOP} w={24} h={16} color={C.pol3} op={s.pol3LeadOp} />
      <Label x={s.leadEnd} y={ROW_TOP} text="DNA pol III" color="#6d28d9" op={s.pol3LeadOp} />
      <Enzyme x={frags[2].dnaLeft} y={NEW_BOT} w={24} h={16} color={C.pol3} op={s.pol3LagOp} />
      <Label x={frags[2].dnaLeft} y={ROW_BOT} text="DNA pol III" color="#6d28d9" op={s.pol3LagOp} />

      {/* DNA polymerase I replacing a primer; ligase sealing the nick it left */}
      <Enzyme x={FRAGS[1].r - PRIMER / 2} y={NEW_BOT} w={24} h={16} color={C.pol1} op={s.pol1Op} />
      <Label x={FRAGS[1].r - PRIMER / 2} y={ROW_BOT} text="DNA pol I" color="#4338ca" op={s.pol1Op} />
      {s.ligaseOp > 0.01 && (
        <circle cx={FRAGS[0].r - PRIMER} cy={NEW_BOT} r={7} fill={C.ligase} fillOpacity={0.35}
          stroke={C.ligase} strokeWidth={1.8} opacity={s.ligaseOp} />
      )}
      <Label x={FRAGS[0].r - PRIMER} y={ROW_BOT} text="Ligase" color="#be185d" op={s.ligaseOp} />

      {/* ── Region labels ── */}
      {s.forkLabelOp > 0.01 && (
        <g opacity={s.forkLabelOp} fontFamily="system-ui">
          <text x={fork} y={24} textAnchor="middle" fontSize={8} fontWeight={600} fill={C.muted}>replication fork →</text>
        </g>
      )}
      <Label x={40} y={NEW_TOP + 22} text="Leading strand — continuous" color="#047857" op={s.leadLabelOp} anchor="start" />
      <Label x={40} y={NEW_BOT - 14} text="Lagging strand — Okazaki fragments" color="#047857" op={s.lagLabelOp} anchor="start" />
      {s.parentLabelOp > 0.01 && (
        <text x={200} y={DUP_TOP - 22} textAnchor="middle" fontSize={9} fontWeight={700} fill={C.label}
          fontFamily="system-ui" opacity={s.parentLabelOp}>Parent DNA — two antiparallel strands</text>
      )}
      {s.daughterOp > 0.01 && (
        <g opacity={s.daughterOp} fontFamily="system-ui" fontSize={9} fontWeight={700} textAnchor="middle">
          <text x={200} y={ROW_TOP} fill={C.label}>Daughter DNA 1 — one old strand + one new strand</text>
          <text x={200} y={ROW_BOT2} fill={C.label}>Daughter DNA 2 — one old strand + one new strand</text>
          <text x={200} y={(NEW_TOP + NEW_BOT) / 2 + 3} fontSize={10} fontWeight={800} fill="#047857">Semiconservative replication</text>
        </g>
      )}

      {/* ── 5′ / 3′ ends ── */}
      <g fontFamily="system-ui" fontSize={9} fontWeight={800} fill={C.parent} textAnchor="middle">
        <text x={9}   y={strandY(X_L, fork, ARM_TOP, DUP_TOP) + 3}>3′</text>
        <text x={391} y={strandY(X_R, fork, ARM_TOP, DUP_TOP) + 3}>5′</text>
        <text x={9}   y={strandY(X_L, fork, ARM_BOT, DUP_BOT) + 3}>5′</text>
        <text x={391} y={strandY(X_R, fork, ARM_BOT, DUP_BOT) + 3}>3′</text>
      </g>
      {s.daughterOp > 0.01 && (
        <g fontFamily="system-ui" fontSize={9} fontWeight={800} fill="#047857" textAnchor="middle" opacity={s.daughterOp}>
          <text x={9}   y={NEW_TOP + 3}>5′</text>
          <text x={391} y={NEW_TOP + 3}>3′</text>
          <text x={9}   y={NEW_BOT + 3}>3′</text>
          <text x={391} y={NEW_BOT + 3}>5′</text>
        </g>
      )}

      {/* ── Legend ── */}
      <g fontFamily="system-ui" fontSize={8} fill={C.label}>
        {([[70, C.parent, "original strand"], [180, C.newDna, "new DNA"], [268, C.primer, "RNA primer"]] as const).map(([x, color, text]) => (
          <g key={text}>
            <line x1={x} y1={262} x2={x + 16} y2={262} stroke={color} strokeWidth={3.5} />
            <text x={x + 21} y={265}>{text}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// ─── Stage data ───────────────────────────────────────────────────────────────
const STAGES = [
  {
    name:     "Parent",
    title:    "Parent DNA",
    subtitle: "Two antiparallel template strands",
    accent:   "#64748b",
    accentBg: "rgba(100,116,139,0.08)",
    dotClass: "bg-slate-500",
    description: "Replication starts from a double-stranded parent molecule. Its two strands run in opposite directions — the top strand 3′ → 5′ and the bottom 5′ → 3′ as drawn. Each strand will serve as a template for a brand-new partner, following the base-pairing rules A–T and G–C.",
    keyPoints: [
      "Replication begins at origins of replication — many along each eukaryotic chromosome",
      "Each origin opens into a bubble with a replication fork at each end",
      "Both parent strands act as templates",
      "Direction matters: new DNA can only be built 5′ → 3′",
    ],
  },
  {
    name:     "Unzip",
    title:    "Unzipping the helix",
    subtitle: "Helicase · topoisomerase · SSBs",
    accent:   "#f59e0b",
    accentBg: "rgba(245,158,11,0.08)",
    dotClass: "bg-amber-500",
    description: "Helicase moves along the DNA and breaks the hydrogen bonds between base pairs, prying the strands apart into a Y-shaped replication fork. Unwinding puts strain on the DNA ahead of the fork, so topoisomerase cuts, untwists, and rejoins it. Single-strand binding proteins (SSBs) coat the exposed strands so they don't snap back together.",
    keyPoints: [
      "Helicase breaks hydrogen bonds — not the covalent sugar-phosphate backbone",
      "Topoisomerase relieves supercoiling ahead of the fork",
      "SSB proteins stabilize the single strands until they're copied",
      "The fork keeps moving as more DNA is unzipped",
    ],
  },
  {
    name:     "Prime",
    title:    "Laying down primers",
    subtitle: "Primase adds RNA primers",
    accent:   "#84cc16",
    accentBg: "rgba(132,204,22,0.1)",
    dotClass: "bg-lime-500",
    description: "DNA polymerase can't start a new strand from nothing — it can only add nucleotides to an existing 3′ end. Primase solves this by building a short RNA primer (about 5–10 nucleotides) on each template. The leading strand needs just one primer; the lagging strand needs a new one for every fragment.",
    keyPoints: [
      "Primase is an RNA polymerase — primers are made of RNA, not DNA",
      "A primer provides the free 3′ –OH that DNA polymerase needs",
      "Leading strand: one primer · Lagging strand: many primers",
    ],
  },
  {
    name:     "Leading",
    title:    "Leading strand",
    subtitle: "Continuous synthesis toward the fork",
    accent:   "#8b5cf6",
    accentBg: "rgba(139,92,246,0.08)",
    dotClass: "bg-violet-500",
    description: "DNA polymerase III extends the primer, reading the template 3′ → 5′ and building the new strand 5′ → 3′. On this template, that direction points toward the fork, so polymerase can simply follow helicase and build one long, continuous strand.",
    keyPoints: [
      "DNA polymerase III adds nucleotides to the 3′ end only",
      "Template read 3′ → 5′, new strand built 5′ → 3′",
      "Leading strand synthesis moves in the same direction as the fork",
      "Polymerase proofreads as it goes — about 1 error per 10 billion bases after repair",
    ],
  },
  {
    name:     "Lagging",
    title:    "Lagging strand",
    subtitle: "Okazaki fragments, built away from the fork",
    accent:   "#10b981",
    accentBg: "rgba(16,185,129,0.08)",
    dotClass: "bg-emerald-500",
    description: "The other template runs the opposite way, so building 5′ → 3′ means moving away from the fork. Polymerase can only build a short stretch before the fork opens more template behind it. Each time, primase lays a new primer near the fork and DNA polymerase III builds another short piece — an Okazaki fragment.",
    keyPoints: [
      "Lagging strand is still built 5′ → 3′ — just in the opposite direction to the fork",
      "Made discontinuously as Okazaki fragments (~100–200 nt in eukaryotes)",
      "Each fragment starts with its own RNA primer",
      "AP exam: explain leading vs lagging using antiparallel strands + 5′ → 3′ synthesis",
    ],
  },
  {
    name:     "Seal",
    title:    "Replacing primers & sealing",
    subtitle: "DNA polymerase I · DNA ligase",
    accent:   "#ec4899",
    accentBg: "rgba(236,72,153,0.08)",
    dotClass: "bg-pink-500",
    description: "The RNA primers can't stay. DNA polymerase I removes each primer and fills the gap with DNA. That leaves a nick — a missing bond in the sugar-phosphate backbone between neighboring fragments. DNA ligase seals each nick with a phosphodiester bond, joining the fragments into one continuous strand.",
    keyPoints: [
      "DNA polymerase I: removes RNA primers and replaces them with DNA",
      "DNA ligase: forms the final phosphodiester bond between fragments",
      "Ligase is needed most on the lagging strand, which has many fragments",
    ],
  },
  {
    name:     "Result",
    title:    "Two identical molecules",
    subtitle: "Semiconservative replication",
    accent:   "#047857",
    accentBg: "rgba(4,120,87,0.08)",
    dotClass: "bg-emerald-700",
    description: "When replication finishes, there are two DNA molecules with the same sequence as the parent. Each one keeps one original strand and gains one new strand — replication is semiconservative. Meselson and Stahl confirmed this in 1958 by tracking heavy and light nitrogen isotopes across generations of bacteria.",
    keyPoints: [
      "Each daughter molecule = one parent strand + one new strand",
      "Both copies carry the same sequence as the original",
      "Meselson–Stahl (1958) ruled out conservative and dispersive models",
      "Happens during S phase, before mitosis or meiosis",
    ],
  },
] as const;

const STAGE_COUNT    = STAGES.length;
const DRAG_PER_STAGE = 80;

// ─── Shared context ───────────────────────────────────────────────────────────
interface RepCtxValue {
  clampedProgress:   number;
  snapIdx:           number;
  progressPct:       number;
  cur:               (typeof STAGES)[number];
  springTo:          (target: number) => void;
  setProgressDirect: (value: number) => void;
  animRef:           React.MutableRefObject<AnimationPlaybackControls | null>;
}

const RepCtx = createContext<RepCtxValue | null>(null);
function useRepCtx() {
  const ctx = useContext(RepCtx);
  if (!ctx) throw new Error("Must be inside DnaReplicationProvider");
  return ctx;
}

export function DnaReplicationProvider({ children }: { children: React.ReactNode }) {
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
    <RepCtx.Provider value={{
      clampedProgress: clamped,
      snapIdx,
      progressPct: (clamped / (STAGE_COUNT - 1)) * 100,
      cur: STAGES[snapIdx],
      springTo, setProgressDirect, animRef,
    }}>
      {children}
    </RepCtx.Provider>
  );
}

// ─── DnaReplicationViewer ─────────────────────────────────────────────────────
export function DnaReplicationViewer() {
  const { clampedProgress, snapIdx, progressPct, cur, springTo, setProgressDirect, animRef } = useRepCtx();

  const [isDragging,     setIsDragging]     = useState(false);
  const [hasEverDragged, setHasEverDragged] = useState(false);
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
            aria-label={`Go to stage ${i + 1}: ${st.title}`}
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
            <ForkDiagram progress={clampedProgress} />
          </div>
          {!hasEverDragged && snapIdx === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2.5 rounded-full bg-black/55 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span aria-hidden="true">←</span>drag to open the fork<span aria-hidden="true">→</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrub bar */}
        <div className="border-t border-zinc-100 bg-white px-5 pt-4 pb-5">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-400 select-none pointer-events-none">
            ← drag right to replicate →
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
              <button key={i} onClick={() => springTo(i)} aria-label={`Go to ${st.title}`}
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

// ─── DnaReplicationPanel ──────────────────────────────────────────────────────
export function DnaReplicationPanel() {
  const { snapIdx, progressPct, cur, springTo } = useRepCtx();
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="p-5" style={{ background: cur.accentBg }}>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cur.accent }}>
              Stage {snapIdx + 1} of {STAGE_COUNT}
            </span>
            <h3 className="mt-0.5 text-lg font-bold text-zinc-900">{cur.title}</h3>
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
            <button key={i} onClick={() => springTo(i)} aria-label={`Go to ${st.title}`}
              className={`h-2 rounded-full transition-all ${snapIdx === i ? "w-6 bg-zinc-800" : "w-2 bg-zinc-300 hover:bg-zinc-400"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EnzymeRoster — tap an enzyme to jump to the stage where it works ────────
const ENZYMES = [
  { name: "Helicase",           color: C.helicase, stage: 1, job: "Unzips the double helix by breaking hydrogen bonds between bases." },
  { name: "Topoisomerase",      color: C.topo,     stage: 1, job: "Relieves the twisting strain that builds up ahead of the fork." },
  { name: "SSB proteins",       color: C.ssb,      stage: 1, job: "Hold the separated strands apart so they don't re-pair." },
  { name: "Primase",            color: C.primase,  stage: 2, job: "Builds short RNA primers that give polymerase a 3′ end to extend." },
  { name: "DNA polymerase III", color: C.pol3,     stage: 3, job: "Adds DNA nucleotides 5′ → 3′ to build the new strands." },
  { name: "DNA polymerase I",   color: C.pol1,     stage: 5, job: "Removes RNA primers and replaces them with DNA." },
  { name: "DNA ligase",         color: C.ligase,   stage: 5, job: "Seals nicks between fragments with phosphodiester bonds." },
] as const;

export function EnzymeRoster() {
  const { snapIdx, springTo } = useRepCtx();
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <ul className="divide-y divide-zinc-100">
        {ENZYMES.map((enz) => {
          const active = snapIdx === enz.stage;
          return (
            <li key={enz.name}>
              <button onClick={() => springTo(enz.stage)}
                aria-label={`${enz.name}: ${enz.job} Show stage ${enz.stage + 1}.`}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-600 ${
                  active ? "bg-zinc-50" : "hover:bg-zinc-50"
                }`}>
                <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: enz.color }} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-zinc-900">{enz.name}</span>
                  <span className="block text-xs leading-relaxed text-zinc-500">{enz.job}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                }`}>
                  Stage {enz.stage + 1}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Emblem (lesson card thumbnail) ──────────────────────────────────────────
// A replication fork: parent duplex on the right, new strands growing on the opened arms.
export function DnaReplicationEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -2 120 106" className={className} aria-hidden="true">
      {/* Base pairs */}
      <g stroke={C.rung} strokeWidth={2.2}>
        {[76, 84, 92, 100, 108].map((x) => <line key={x} x1={x} y1={25} x2={x} y2={33} />)}
        {[16, 24, 32, 40].map((x) => (
          <g key={x}>
            <line x1={x} y1={8} x2={x} y2={14} />
            <line x1={x} y1={44} x2={x} y2={50} />
          </g>
        ))}
      </g>
      {/* Template strands opening into a fork */}
      <g fill="none" stroke={C.parent} strokeWidth={4} strokeLinecap="round">
        <path d="M 8 6 H 44 C 58 6, 58 23, 72 23 H 114" />
        <path d="M 8 52 H 44 C 58 52, 58 35, 72 35 H 114" />
      </g>
      {/* New strands: continuous leading (top), Okazaki fragments on lagging (bottom) */}
      <g strokeWidth={4}>
        <line x1={8}  y1={16} x2={15} y2={16} stroke={C.primer} />
        <line x1={15} y1={16} x2={46} y2={16} stroke={C.newDna} />
        <line x1={8}  y1={42} x2={20} y2={42} stroke={C.newDna} />
        <line x1={20} y1={42} x2={26} y2={42} stroke={C.primer} />
        <line x1={30} y1={42} x2={40} y2={42} stroke={C.newDna} />
        <line x1={40} y1={42} x2={46} y2={42} stroke={C.primer} />
      </g>
      {/* Helicase at the fork */}
      <ellipse cx={66} cy={29} rx={6.5} ry={11} fill="white" stroke={C.helicase} strokeWidth={3.5} />
    </svg>
  );
}
