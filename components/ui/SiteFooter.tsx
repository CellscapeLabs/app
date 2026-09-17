// Site footer: brand, topic links, and a few lessons to try.
import Link from "next/link";
import { TOPICS } from "@/content/topics";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";
import { TOPIC_THEME } from "@/components/ui/topicTheme";

const TRY = [
  { title: "Leaf disk lab", href: "/topics/cell-biology/photosynthesis" },
  { title: "Break the pipeline", href: "/topics/cell-biology/cellular-respiration" },
  { title: "Gamete builder", href: "/topics/cell-biology/meiosis" },
  { title: "DNA Replication", href: "/topics/genetics/dna-replication" },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-zinc-950 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <CellscapeIcon className="h-8 w-8" />
            <span className="font-display text-xl font-bold tracking-tight">Cellscape</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600">
            Interactive biology for curious students — built for AP and intro college courses.
          </p>
        </div>
        <div>
          <h3 className="font-display text-base font-bold">Topics</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            {TOPICS.map((t) => (
              <li key={t.id}>
                <Link href={`/topics/${t.id}`} className="inline-flex items-center gap-2 transition-colors hover:text-zinc-950">
                  <span className={`h-2 w-2 rounded-full ${TOPIC_THEME[t.id].dot}`} />{t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-base font-bold">Try something</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            {TRY.map((l) => (
              <li key={l.href}><Link href={l.href} className="transition-colors hover:text-zinc-950">{l.title}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-6 py-5 text-xs text-zinc-500">
          <span>© 2026 Cellscape</span>
          <span>Made for students who learn by poking at things.</span>
        </div>
      </div>
    </footer>
  );
}
