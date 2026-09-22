"use client";
/*
 * Biology concept: Genetic variation from meiosis — independent assortment + crossing over
 * A 2n = 6 cell holds three homologous pairs: a maternal copy (violet) and a paternal copy
 * (amber) of each. Pair 1 carries genes A and B; pairs 2 and 3 carry D and E. Maternal alleles
 * are uppercase, paternal lowercase.
 *   - Independent assortment: at metaphase I each pair lines up with either copy facing the top
 *     pole, independently of the others → 2³ = 8 combinations
 *   - Crossing over: in prophase I, non-sister chromatids of pair 1 swap their B-carrying ends,
 *     making recombinant chromosomes (Ab, aB) → 16 possible gametes in this cell
 *   - Meiosis I sends one copy of each pair to each pole; meiosis II splits sister chromatids,
 *     giving four haploid gametes
 * Interactions: flip each pair's orientation or shuffle all three, toggle crossing over, then
 * Divide to see the four gametes. Every gamete found fills a slot on a 16-gamete collection
 * board. Four challenges tick off as the student explores.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { VIZ_FRAME } from "@/components/visualizations/vizChrome";

// ─── Model ────────────────────────────────────────────────────────────────────
type Origin = "M" | "P";   // maternal / paternal

const COLOR: Record<Origin, string> = { M: "#8b5cf6", P: "#f59e0b" };
const TEXT:  Record<Origin, string> = { M: "#6d28d9", P: "#b45309" };

/** One chromatid: which parent each half came from (pole-side half, plate-side half). */
interface Chromatid { pole: Origin; plate: Origin }

export interface Gamete { pair1: Chromatid; pair2: Origin; pair3: Origin }

const allele = (gene: string, o: Origin) => (o === "M" ? gene.toUpperCase() : gene.toLowerCase());
export const genotype = (g: Gamete) =>
  `${allele("a", g.pair1.pole)}${allele("b", g.pair1.plate)} ${allele("d", g.pair2)} ${allele("e", g.pair3)}`;

const other = (o: Origin): Origin => (o === "M" ? "P" : "M");

/** topCopies[i] = which parent's copy of pair i faces the top pole at metaphase I. */
export function divide(topCopies: readonly [Origin, Origin, Origin], crossover: boolean): Gamete[] {
  const [t1, t2, t3] = topCopies;
  const b1 = other(t1), b2 = other(t2), b3 = other(t3);
  // Crossing over swaps the plate-side halves of the two inner (right-hand) non-sister chromatids
  const topInner:    Chromatid = { pole: t1, plate: crossover ? b1 : t1 };
  const bottomInner: Chromatid = { pole: b1, plate: crossover ? t1 : b1 };
  return [
    { pair1: { pole: t1, plate: t1 }, pair2: t2, pair3: t3 },
    { pair1: topInner,                pair2: t2, pair3: t3 },
    { pair1: bottomInner,             pair2: b2, pair3: b3 },
    { pair1: { pole: b1, plate: b1 }, pair2: b2, pair3: b3 },
  ];
}

// Every gamete this cell could make, in a fixed order for the collection board
const ALL_GENOTYPES: string[] = (["MM", "PP", "MP", "PM"] as const).flatMap((p1) =>
  (["M", "P"] as const).flatMap((p2) =>
    (["M", "P"] as const).map((p3) =>
      genotype({ pair1: { pole: p1[0] as Origin, plate: p1[1] as Origin }, pair2: p2, pair3: p3 }))));

// ─── Challenges ───────────────────────────────────────────────────────────────
const CHALLENGES: { id: string; prompt: string; done: (found: ReadonlySet<string>) => boolean; reveal: string }[] = [
  {
    id: "all-maternal",
    prompt: "Make a gamete carrying only the mother's chromosomes.",
    done: (f) => f.has("AB D E"),
    reveal: "Line all three maternal copies up on the same side and one gamete gets them all. With 23 pairs in humans, the odds of that are 1 in 2²³ — about 1 in 8.4 million.",
  },
  {
    id: "recombinant",
    prompt: "Make a gamete with a recombinant chromosome — one that's part mother, part father.",
    done: (f) => [...f].some((g) => g.startsWith("Ab") || g.startsWith("aB")),
    reveal: "Crossing over in prophase I swapped segments between non-sister chromatids. That chromosome carries a combination of alleles that neither parent had on a single chromosome.",
  },
  {
    id: "eight",
    prompt: "Find 8 different gametes.",
    done: (f) => f.size >= 8,
    reveal: "Three pairs, each lining up 2 ways, gives 2³ = 8 combinations from independent assortment alone.",
  },
  {
    id: "sixteen",
    prompt: "Collect all 16 possible gametes.",
    done: (f) => f.size >= 16,
    reveal: "Crossing over on just one pair doubled the possibilities. Real chromosomes cross over at many points, so the true number of possible gametes is astronomically large.",
  },
];

// ─── Metaphase I cell ─────────────────────────────────────────────────────────
const PAIR_X = [100, 180, 260] as const;
const PAIR_LEN = [72, 54, 40] as const;
const PLATE_Y = 115;
const GAP = 5;
const SIS = 6;     // sister chromatid offset from pair centre
const BAR_W = 8;

function Homolog({ x, len, side, chromatids, genes }: {
  x: number; len: number; side: "top" | "bottom";
  chromatids: [Chromatid, Chromatid];
  genes: { gene: string; t: number; half: "pole" | "plate" }[];
}) {
  // t = 0 at the pole end, 1 at the plate end
  const yAt = (t: number) => side === "top" ? PLATE_Y - GAP - len + t * len : PLATE_Y + GAP + len - t * len;
  const yMid = yAt(0.5);
  return (
    <g>
      {chromatids.map((c, i) => {
        const cx = x + (i === 0 ? -SIS : SIS);
        const halves: ["pole" | "plate", number, number][] = [["pole", 0, 0.5], ["plate", 0.5, 1]];
        return (
          <g key={i}>
            {halves.map(([half, a, b]) => {
              const y1 = Math.min(yAt(a), yAt(b)), y2 = Math.max(yAt(a), yAt(b));
              return <rect key={half} x={cx - BAR_W / 2} y={y1} width={BAR_W} height={y2 - y1}
                fill={COLOR[c[half]]} />;
            })}
            {genes.map(({ gene, t, half }) => (
              <text key={gene} x={i === 0 ? cx - 8 : cx + 8} y={yAt(t) + 3.5}
                textAnchor={i === 0 ? "end" : "start"} fontSize={10} fontWeight={800}
                fill={TEXT[c[half]]} fontFamily="system-ui">{allele(gene, c[half])}</text>
            ))}
          </g>
        );
      })}
      {/* Centromere */}
      <circle cx={x} cy={yMid} r={4} fill="#27272a" />
    </g>
  );
}

function MetaphaseCell({ topCopies, crossover }: { topCopies: readonly [Origin, Origin, Origin]; crossover: boolean }) {
  return (
    <svg viewBox="0 0 360 230" className="h-full w-full" role="img"
      aria-label={`Metaphase I: ${topCopies.map((o, i) => `pair ${i + 1} ${o === "M" ? "maternal" : "paternal"} copy on top`).join(", ")}${crossover ? ", crossing over on pair 1" : ""}`}>
      <ellipse cx={180} cy={PLATE_Y} rx={172} ry={108} fill="#ecfdf5" stroke="#10b981" strokeWidth={2.5} />
      <line x1={30} y1={PLATE_Y} x2={330} y2={PLATE_Y} stroke="#94a3b8" strokeWidth={1.2} strokeDasharray="5 4" />
      <circle cx={180} cy={14} r={5} fill="#38bdf8" />
      <circle cx={180} cy={216} r={5} fill="#38bdf8" />

      {PAIR_X.map((x, p) => {
        const len = PAIR_LEN[p];
        const top = topCopies[p], bottom = other(top);
        const genes = p === 0
          ? [{ gene: "a", t: 0.25, half: "pole" as const }, { gene: "b", t: 0.78, half: "plate" as const }]
          : [{ gene: p === 1 ? "d" : "e", t: 0.25, half: "pole" as const }];
        const cross = p === 0 && crossover;
        const topChromatids: [Chromatid, Chromatid] = [
          { pole: top, plate: top },
          { pole: top, plate: cross ? bottom : top },
        ];
        const bottomChromatids: [Chromatid, Chromatid] = [
          { pole: bottom, plate: bottom },
          { pole: bottom, plate: cross ? top : bottom },
        ];
        return (
          <g key={p}>
            {/* Spindle fibres to each homolog's centromere */}
            <line x1={180} y1={14} x2={x} y2={PLATE_Y - GAP - len / 2} stroke="#38bdf8" strokeWidth={1} opacity={0.6} />
            <line x1={180} y1={216} x2={x} y2={PLATE_Y + GAP + len / 2} stroke="#38bdf8" strokeWidth={1} opacity={0.6} />
            <Homolog x={x} len={len} side="top" chromatids={topChromatids} genes={genes} />
            <Homolog x={x} len={len} side="bottom" chromatids={bottomChromatids} genes={genes} />
            {cross && (
              <g>
                <circle cx={x + SIS} cy={PLATE_Y} r={7} fill="none" stroke="#10b981" strokeWidth={2} />
                <text x={x + SIS + 11} y={PLATE_Y + 16} fontSize={8} fontWeight={700} fill="#047857" fontFamily="system-ui">chiasma</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── A single gamete ──────────────────────────────────────────────────────────
function GameteCard({ g, index, isNew }: { g: Gamete; index: number; isNew: boolean }) {
  const bars: { x: number; len: number; pole: Origin; plate: Origin }[] = [
    { x: 30, len: 38, pole: g.pair1.pole, plate: g.pair1.plate },
    { x: 50, len: 29, pole: g.pair2, plate: g.pair2 },
    { x: 70, len: 22, pole: g.pair3, plate: g.pair3 },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.3 }}
      className="flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-2">
      <svg viewBox="0 0 100 70" className="w-full max-w-[120px]" aria-hidden="true">
        <circle cx={50} cy={35} r={32} fill="#ecfdf5" stroke="#10b981" strokeWidth={2} />
        {bars.map((b, i) => {
          const y0 = 35 - b.len / 2;
          return (
            <g key={i}>
              <rect x={b.x - 4} y={y0} width={8} height={b.len / 2} rx={2} fill={COLOR[b.pole]} />
              <rect x={b.x - 4} y={y0 + b.len / 2} width={8} height={b.len / 2} rx={2} fill={COLOR[b.plate]} />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 font-mono text-sm font-black tracking-wide text-zinc-800">{genotype(g)}</div>
      {isNew && <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">new!</div>}
    </motion.div>
  );
}

// ─── GameteBuilder ────────────────────────────────────────────────────────────
export function GameteBuilder() {
  const [topCopies, setTopCopies] = useState<[Origin, Origin, Origin]>(["M", "M", "P"]);
  const [crossover, setCrossover] = useState(false);
  const [gametes, setGametes] = useState<Gamete[] | null>(null);
  const [newOnes, setNewOnes] = useState<ReadonlySet<string>>(new Set());
  const [found, setFound] = useState<ReadonlySet<string>>(new Set());
  const [round, setRound] = useState(0);

  function setupChanged() { setGametes(null); }

  function flip(p: number) {
    setTopCopies((tc) => tc.map((o, i) => (i === p ? other(o) : o)) as [Origin, Origin, Origin]);
    setupChanged();
  }
  function shuffle() {
    setTopCopies([0, 1, 2].map(() => (Math.random() < 0.5 ? "M" : "P")) as [Origin, Origin, Origin]);
    setupChanged();
  }
  function runDivision() {
    const result = divide(topCopies, crossover);
    const types = result.map(genotype);
    setNewOnes(new Set(types.filter((t) => !found.has(t))));
    setFound(new Set([...found, ...types]));
    setGametes(result);
    setRound((r) => r + 1);
  }

  const completed = CHALLENGES.filter((c) => c.done(found));

  return (
    <div className={VIZ_FRAME}>
      <div className="grid lg:grid-cols-[3fr_2fr]">
        {/* Cell */}
        <div className="border-b border-zinc-100 bg-gradient-to-br from-zinc-50 to-white p-4 lg:border-b-0 lg:border-r">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-zinc-700">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR.M }} />From mother (A B D E)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR.P }} />From father (a b d e)</span>
            <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-slate-400" />Metaphase plate · pairs 1–3, left to right</span>
          </div>
          <div className="w-full" style={{ aspectRatio: "360 / 230" }}>
            <MetaphaseCell topCopies={topCopies} crossover={crossover} />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">1 · Line up the pairs</h3>
            <p className="mb-2 text-xs text-zinc-700">Choose which copy of each pair faces the top of the cell.</p>
            <div className="grid grid-cols-3 gap-2">
              {topCopies.map((o, p) => (
                <button key={p} onClick={() => flip(p)}
                  aria-label={`Flip pair ${p + 1}. Currently the ${o === "M" ? "mother's" : "father's"} copy is on top.`}
                  className="rounded-xl border border-zinc-200 bg-white px-2 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900">
                  <span className="block">Pair {p + 1}</span>
                  <span className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-zinc-700">
                    <span className="h-2 w-2 rounded-sm" style={{ background: COLOR[o] }} />
                    ⇅ flip
                  </span>
                </button>
              ))}
            </div>
            <button onClick={shuffle} className="mt-2 text-xs font-semibold text-zinc-700 underline-offset-2 hover:underline">
              🎲 Shuffle randomly
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900">2 · Cross over</h3>
            <button role="switch" aria-checked={crossover} onClick={() => { setCrossover(!crossover); setupChanged(); }}
              className={`mt-2 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                crossover ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}>
              <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${crossover ? "bg-zinc-900" : "bg-zinc-300"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${crossover ? "left-[18px]" : "left-0.5"}`} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-zinc-900">Crossing over on pair 1</span>
                <span className="block text-xs text-zinc-700">Non-sister chromatids swap the ends carrying gene B</span>
              </span>
            </button>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-zinc-900">3 · Divide</h3>
            <button onClick={runDivision}
              className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800">
              Run meiosis I + II →
            </button>
          </div>
        </div>
      </div>

      {/* Gametes */}
      <div className="border-t border-zinc-100 p-5">
        <h3 className="mb-3 text-sm font-bold text-zinc-900">Your four gametes</h3>
        {gametes ? (
          <div key={round} className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="polite">
            {gametes.map((g, i) => (
              <GameteCard key={i} g={g} index={i} isNew={newOnes.has(genotype(g)) && gametes.findIndex((x) => genotype(x) === genotype(g)) === i} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-600">
            Set up the cell, then press <span className="font-semibold text-zinc-600">Run meiosis</span> to make gametes.
          </p>
        )}
      </div>

      {/* Collection + challenges */}
      <div className="grid gap-5 border-t border-zinc-100 bg-zinc-50/60 p-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-bold text-zinc-900">
            Gamete collection <span className="font-semibold text-zinc-600">· {found.size} / {ALL_GENOTYPES.length}</span>
          </h3>
          <p className="mb-3 text-xs text-zinc-700">Every different gamete this cell can make.</p>
          <ul className="grid grid-cols-4 gap-1.5">
            {ALL_GENOTYPES.map((gt) => {
              const has = found.has(gt);
              return (
                <li key={gt} className={`rounded-lg border px-1 py-1.5 text-center font-mono text-[11px] font-bold ${
                  has ? "border-violet-200 bg-white text-zinc-800" : "border-dashed border-zinc-200 text-zinc-300"
                }`}>
                  <span className="sr-only">{has ? "Found: " : "Not found yet"}</span>
                  {has ? gt : "?"}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold text-zinc-900">
            Challenges <span className="font-semibold text-zinc-600">· {completed.length} / {CHALLENGES.length}</span>
          </h3>
          <ul className="space-y-2">
            {CHALLENGES.map((c) => {
              const done = c.done(found);
              return (
                <li key={c.id} className={`rounded-xl border px-4 py-3 text-sm ${done ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-white"}`}>
                  <div className="flex items-start gap-2.5">
                    <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      done ? "bg-emerald-500 text-white" : "border border-zinc-300"
                    }`}>{done ? "✓" : ""}</span>
                    <div>
                      <p className={done ? "font-semibold text-emerald-900" : "text-zinc-700"}>
                        <span className="sr-only">{done ? "Completed: " : "Not yet done: "}</span>{c.prompt}
                      </p>
                      {done && <p className="mt-1 text-xs leading-relaxed text-emerald-800">{c.reveal}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
