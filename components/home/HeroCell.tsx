// Home hero visual: the animal cell illustration with a few floating annotation chips.
// The whole cell links to the Organelles lesson.

import Link from "next/link";
import { CellIllustration } from "@/components/visualizations/CellIllustration";

function Chip({ title, body, dot, className, delay }: { title: string; body: string; dot: string; className: string; delay: string }) {
  return (
    <div className={`pointer-events-none absolute animate-float-y ${className}`} style={{ animationDelay: delay }}>
      <div className="flex items-start gap-2.5 rounded-2xl border border-zinc-200/80 bg-white/90 px-3.5 py-2.5 shadow-lg shadow-zinc-900/[0.06] backdrop-blur">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />
        <span>
          <span className="block text-xs font-semibold text-zinc-900">{title}</span>
          <span className="block text-[11px] leading-snug text-zinc-500">{body}</span>
        </span>
      </div>
    </div>
  );
}

export function HeroCell() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px]">
      {/* Soft colour behind the cell */}
      <div aria-hidden="true" className="absolute inset-[12%] rounded-full bg-emerald-200/50 blur-3xl" />
      <div aria-hidden="true" className="absolute right-[8%] bottom-[10%] h-1/3 w-1/3 rounded-full bg-violet-200/60 blur-3xl" />

      <Link href="/topics/cell-biology/organelles" aria-label="Explore the organelles lesson"
        className="group absolute inset-[6%] block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">
        <CellIllustration labels={false} />
        <span className="absolute bottom-[4%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-zinc-950 px-3.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Explore the organelles →
        </span>
      </Link>

      <Chip title="Nucleus" body="Holds your 46 chromosomes" dot="#8b5cf6"
        className="left-0 top-[12%] hidden sm:block" delay="0s" />
      <Chip title="Mitochondria" body="~36 ATP from one glucose" dot="#fb923c"
        className="right-0 top-[40%]" delay="1.5s" />
      <Chip title="Golgi apparatus" body="Packages proteins to ship" dot="#a78bfa"
        className="bottom-[8%] left-[2%] hidden sm:block" delay="3s" />
    </div>
  );
}
