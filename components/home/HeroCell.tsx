// Home hero visual: the animal cell illustration on flat pastel blobs, with sticker-style
// annotation chips and a doodled "tap the cell" note. The whole cell links to the Organelles lesson.

import Link from "next/link";
import { CellIllustration } from "@/components/visualizations/CellIllustration";

function Chip({ title, body, fill, className, delay }: { title: string; body: string; fill: string; className: string; delay: string }) {
  return (
    <div className={`pointer-events-none absolute animate-float-y ${className}`} style={{ animationDelay: delay }}>
      <div className={`rounded-2xl border-2 border-zinc-950 px-3.5 py-2 shadow-[3px_3px_0_0_#09090b] ${fill}`}>
        <span className="block font-display text-sm font-bold leading-tight text-zinc-950">{title}</span>
        <span className="block text-[11px] font-medium leading-snug text-zinc-800">{body}</span>
      </div>
    </div>
  );
}

export function HeroCell() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px]">
      {/* Flat pastel blobs */}
      <svg aria-hidden="true" viewBox="0 0 540 540" className="absolute inset-0 h-full w-full">
        <path d="M 270 40 C 390 30, 500 120, 505 250 C 510 380, 420 500, 280 505 C 140 510, 40 420, 35 290 C 30 150, 150 50, 270 40 Z" fill="#d1fae5" />
        <path d="M 430 330 C 480 340, 520 400, 500 450 C 480 500, 410 515, 370 480 C 330 445, 350 380, 380 350 C 395 335, 410 326, 430 330 Z" fill="#ddd6fe" />
        <path d="M 90 60 C 120 50, 150 75, 145 105 C 140 135, 105 150, 80 135 C 55 120, 60 70, 90 60 Z" fill="#fde68a" />
      </svg>

      <Link href="/topics/cell-biology/organelles" aria-label="Explore the organelles lesson"
        className="group absolute inset-[7%] block rounded-full transition-transform duration-500 hover:rotate-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950">
        <CellIllustration labels={false} />
      </Link>

      {/* Handwritten nudge */}
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-2 right-[4%] hidden rotate-[-6deg] items-end gap-1 sm:flex">
        <svg viewBox="0 0 60 40" className="h-8 w-12 text-zinc-950" fill="none">
          <path d="M 56 34 C 40 36, 20 30, 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 4 16 L 10 8 L 17 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-display text-lg font-semibold italic text-zinc-950">tap the cell!</span>
      </div>

      <Chip title="Nucleus" body="Holds your 46 chromosomes" fill="bg-violet-300"
        className="left-0 top-[10%] hidden -rotate-3 sm:block" delay="0s" />
      <Chip title="Mitochondria" body="~36 ATP per glucose" fill="bg-orange-300"
        className="right-0 top-[38%] rotate-2" delay="1.5s" />
      <Chip title="Golgi" body="Packs proteins to ship" fill="bg-lime-300"
        className="bottom-[12%] left-[1%] hidden rotate-1 sm:block" delay="3s" />
    </div>
  );
}
