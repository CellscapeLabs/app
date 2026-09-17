// Top navigation for the home, topics, topic, and 404 pages.
import Link from "next/link";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <CellscapeIcon />
          <span className="font-display text-xl font-bold tracking-tight text-zinc-950">Cellscape</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/topics" className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:block">Topics</Link>
          <Link href="/#how-it-works" className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 sm:block">How it works</Link>
          <ButtonLink href="/topics" size="sm">Start learning</ButtonLink>
        </div>
      </div>
    </nav>
  );
}
