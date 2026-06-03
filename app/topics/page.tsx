import Link from "next/link";
import { TOPICS } from "@/content/topics";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";

export const metadata = { title: "Topics — Cellscape" };

export default function TopicsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <CellscapeIcon />
            <span className="font-black text-zinc-900 tracking-tight">Cellscape</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-3">Topics</h1>
        <p className="text-zinc-500 mb-12">Pick a subject and start exploring.</p>

        <div className="grid gap-6 md:grid-cols-3">
          {TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.id}`}
              className="group block rounded-2xl border-2 border-zinc-100 p-6 transition-all hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1"
            >
              <h2 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">
                {topic.title}
              </h2>
              <p className="text-sm text-zinc-500 leading-relaxed">{topic.description}</p>
              <div className="mt-4 text-sm font-semibold text-emerald-500">
                {topic.lessons.length} lessons →
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
