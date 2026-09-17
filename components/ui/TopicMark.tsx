// Small hand-drawn-style icon for each topic.
import type { TopicId } from "@/content/topics";

export function TopicMark({ id, className }: { id: TopicId; className?: string }) {
  const common = { viewBox: "0 0 48 48", className, fill: "none", "aria-hidden": true } as const;
  switch (id) {
    case "cell-biology":
      return (
        <svg {...common}>
          <ellipse cx={24} cy={24} rx={19} ry={16} fill="#d1fae5" stroke="#09090b" strokeWidth={2.5} />
          <circle cx={25} cy={25} r={7} fill="#8b5cf6" stroke="#09090b" strokeWidth={2.5} />
          <ellipse cx={13} cy={17} rx={4.5} ry={2.5} transform="rotate(-25 13 17)" fill="#fb923c" stroke="#09090b" strokeWidth={2} />
          <circle cx={35} cy={16} r={2} fill="#09090b" />
          <circle cx={34} cy={32} r={2} fill="#09090b" />
        </svg>
      );
    case "genetics":
      return (
        <svg {...common}>
          <path d="M 14 5 C 34 15, 14 33, 34 43" stroke="#09090b" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M 34 5 C 14 15, 34 33, 14 43" stroke="#8b5cf6" strokeWidth={2.5} strokeLinecap="round" />
          {[[18, 11, 30], [21, 19, 27], [21, 29, 27], [18, 37, 30]].map(([x1, y, x2]) => (
            <line key={y} x1={x1} y1={y} x2={x2} y2={y} stroke="#f472b6" strokeWidth={2.5} strokeLinecap="round" />
          ))}
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx={34} cy={13} r={6} fill="#fcd34d" stroke="#09090b" strokeWidth={2.5} />
          <path d="M 8 40 C 8 24, 20 16, 34 22 C 32 36, 22 42, 8 40 Z" fill="#7dd3fc" stroke="#09090b" strokeWidth={2.5} strokeLinejoin="round" />
          <path d="M 10 38 C 16 32, 22 28, 30 25" stroke="#09090b" strokeWidth={2} strokeLinecap="round" />
        </svg>
      );
  }
}
