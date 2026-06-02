// Static botanical vine — always fully visible on xl+ screens, no animation

const STEM = "M 80 0 C 60 180 108 360 78 540 C 50 720 98 810 70 900";

const LEAVES = [
  { d: "M 72 78  C 52 60  18 68  10 88  C 34 80  62 76  72 78",  fill: "#bbf7d0" },
  { d: "M 76 278 C 56 260 22 268 14 288 C 38 280 66 276 76 278", fill: "#a7f3d0" },
  { d: "M 72 478 C 52 460 18 468 10 488 C 34 480 62 476 72 478", fill: "#bbf7d0" },
  { d: "M 68 678 C 48 660 14 668  6 688 C 30 680 58 676 68 678", fill: "#a7f3d0" },
  { d: "M 76 178 C 96 160 130 168 138 188 C 114 180 84 176 76 178", fill: "#86efac" },
  { d: "M 80 378 C 100 360 134 368 142 388 C 118 380 88 376 80 378", fill: "#bbf7d0" },
  { d: "M 76 578 C 96  560 130 568 138 588 C 114 580 84 576 76 578", fill: "#86efac" },
  { d: "M 70 778 C 90  760 124 768 132 788 C 108 780 78 776 70 778", fill: "#bbf7d0" },
  { d: "M 74 128 C 64 114 50 116 48 126 C 58 122 70 120 74 128", fill: "#bbf7d0" },
  { d: "M 78 328 C 68 314 54 316 52 326 C 62 322 74 320 78 328", fill: "#a7f3d0" },
  { d: "M 74 528 C 64 514 50 516 48 526 C 58 522 70 520 74 528", fill: "#bbf7d0" },
] as const;

const BUDS = [
  { cx: 79,  cy: 35,  r: 5 },
  { cx: 100, cy: 230, r: 4.5 },
  { cx: 74,  cy: 430, r: 5 },
  { cx: 62,  cy: 630, r: 4.5 },
  { cx: 71,  cy: 830, r: 5 },
] as const;

const TENDRILS = [
  "M 72 50  Q 92 38  90 22  Q 88 10 80 13",
  "M 80 248 Q 100 236 98 220 Q 96 208 88 211",
  "M 72 448 Q 54 436 56 420 Q 58 408 66 411",
  "M 64 648 Q 46 636 48 620 Q 50 608 58 611",
] as const;

export function VineDecoration({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} h-screen w-28 overflow-hidden pointer-events-none z-0 hidden xl:block`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 900"
        preserveAspectRatio="xMidYMin slice"
        className="h-full w-full"
        fill="none"
        style={side === "right" ? { transform: "scaleX(-1)" } : undefined}
      >
        {LEAVES.map((leaf, i) => (
          <path key={i} d={leaf.d} fill={leaf.fill} stroke="#4ade80" strokeWidth="0.7" opacity="0.65" />
        ))}
        {BUDS.map((bud, i) => (
          <circle key={i} cx={bud.cx} cy={bud.cy} r={bud.r} fill="#4ade80" opacity="0.55" />
        ))}
        {TENDRILS.map((d, i) => (
          <path key={i} d={d} stroke="#86efac" strokeWidth="1" opacity="0.45" />
        ))}
        {/* Full-length stem — always fully drawn */}
        <path
          d={STEM}
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.65"
        />
      </svg>
    </div>
  );
}
