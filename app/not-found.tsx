import type { Metadata } from "next";
import { SiteNav } from "@/components/ui/SiteNav";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Sticker } from "@/components/ui/Sticker";

export const metadata: Metadata = { title: "Page not found — Cellscape" };

// A lone cell that has drifted off the page
function LostCell() {
  return (
    <svg viewBox="0 0 200 200" className="h-44 w-44" aria-hidden="true">
      <ellipse cx={100} cy={104} rx={78} ry={66} fill="#d1fae5" stroke="#09090b" strokeWidth={4} />
      <circle cx={140} cy={122} r={20} fill="#c4b5fd" stroke="#09090b" strokeWidth={4} />
      <circle cx={135} cy={117} r={6} fill="#7c3aed" />
      <ellipse cx={132} cy={68} rx={15} ry={7} transform="rotate(20 132 68)" fill="#fdba74" stroke="#09090b" strokeWidth={3} />
      <circle cx={52} cy={138} r={4} fill="#09090b" />
      {/* worried face */}
      <circle cx={70} cy={96} r={5} fill="#09090b" />
      <circle cx={98} cy={96} r={5} fill="#09090b" />
      <path d="M 72 120 Q 84 111 96 120" fill="none" stroke="#09090b" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M 104 70 q 4 -8 0 -14" fill="none" stroke="#0ea5e9" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-950">
      <SiteNav />
      <main className="flex flex-1 items-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
          <div className="rotate-6"><LostCell /></div>
          <Sticker className="mt-4 bg-pink-300">Error 404</Sticker>
          <h1 className="mt-5 font-display text-5xl font-extrabold tracking-[-0.035em] sm:text-6xl">This cell wandered off.</h1>
          <p className="mt-4 text-lg text-zinc-600">
            We couldn&apos;t find the page you were looking for. It may have moved, or the link might be wrong.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/topics">Browse lessons <span aria-hidden="true">→</span></ButtonLink>
            <ButtonLink href="/" variant="white">Go home</ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
