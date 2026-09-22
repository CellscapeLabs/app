// Reusable content blocks for lesson pages.
//
// Every lesson was hand-rolling these five shapes with slightly different markup each time.
// They are data-driven now, so a new lesson supplies content and gets the house style for
// free — and a change to the house style lands everywhere at once.
import type React from "react";
import type { TopicId } from "@/content/topics";
import { TOPIC_THEME } from "@/components/ui/topicTheme";
import { ConceptIcon, type ConceptIconName } from "@/components/lessons/conceptIcons";
import { EYEBROW, FRAME_BASE, HEADING, INSET, TEXT } from "@/components/ui/tokens";

/**
 * Heading depth for a block. Sections that sit directly in a lesson are level 2; sections
 * nested inside a LessonFeature (whose own title is an h2) pass 3 so the outline stays true.
 */
export type Level = 2 | 3;

/** A plain titled section in the lesson's reading column. */
export function ContentSection({ title, lead, children, id, level = 2 }: {
  title: string;
  lead?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  level?: Level;
}) {
  const H = level === 3 ? "h3" : "h2";
  return (
    <section aria-labelledby={id}>
      <H id={id} className={`${HEADING.section} ${TEXT.heading}`}>{title}</H>
      {lead && <p className={`mt-2 text-sm leading-relaxed ${TEXT.body}`}>{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export type KeyConcept = {
  icon: ConceptIconName;
  heading: string;
  body: string;
};

/** The "three things to keep straight" card row. */
export function KeyConcepts({ title = "Three things to keep straight", lead, items, level = 2 }: {
  title?: string;
  lead?: React.ReactNode;
  items: readonly KeyConcept[];
  level?: Level;
}) {
  const H = level === 3 ? "h4" : "h3";
  return (
    <ContentSection title={title} lead={lead} level={level}>
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map(({ icon, heading, body }) => (
          <li key={heading} className={`${INSET} p-4`}>
            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700">
              <ConceptIcon name={icon} className="h-5 w-5" />
            </span>
            <H className={`mb-1 text-sm font-bold ${TEXT.heading}`}>{heading}</H>
            <p className={`text-xs leading-relaxed ${TEXT.muted}`}>{body}</p>
          </li>
        ))}
      </ul>
    </ContentSection>
  );
}

/** The numbered end-of-lesson summary. */
export function QuickRecap({ title = "Quick recap", items, level = 2 }: {
  title?: string;
  items: readonly (readonly [string, string])[];
  level?: Level;
}) {
  return (
    <ContentSection title={title} level={level}>
      <ol className="space-y-2.5">
        {items.map(([term, desc], i) => (
          <li key={term} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <p className="pt-0.5 text-sm">
              <span className={`font-semibold ${TEXT.heading}`}>{term} — </span>
              <span className={TEXT.body}>{desc}</span>
            </p>
          </li>
        ))}
      </ol>
    </ContentSection>
  );
}

/**
 * An aside that steps outside the mechanism: what it looks like in a clinic, a trap the
 * exam likes, or how the science was established. The label tells a student up front which
 * of the three they are reading, so it is skimmable.
 */
const CALLOUT_TONE = {
  clinical: { surface: "bg-rose-50",  label: "bg-rose-200 text-rose-950",   text: "Real world" },
  note:     { surface: "bg-amber-50", label: "bg-amber-200 text-amber-950", text: "Worth knowing" },
  history:  { surface: "bg-sky-50",   label: "bg-sky-200 text-sky-950",     text: "How we know" },
} as const;

export function Callout({ tone = "note", label, title, children, level = 2 }: {
  tone?: keyof typeof CALLOUT_TONE;
  label?: string;
  title: string;
  children: React.ReactNode;
  level?: Level;
}) {
  const t = CALLOUT_TONE[tone];
  const H = level === 3 ? "h3" : "h2";
  return (
    <section className={`${FRAME_BASE} ${t.surface} px-6 py-5`}>
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${t.label}`}>
        {label ?? t.text}
      </span>
      <H className={`mt-2.5 font-display text-base font-bold ${TEXT.heading}`}>{title}</H>
      <div className={`mt-2 text-sm leading-relaxed ${TEXT.body}`}>{children}</div>
    </section>
  );
}

export type TableColumn = {
  header: string;
  /** Drop the column below `sm` — use for the least load-bearing one. */
  hideOnMobile?: boolean;
  /** Render this column in the topic accent, bold. Use for the payoff column. */
  accent?: boolean;
};

/** A comparison table. First column is always the row label. */
export function DataTable({ title, columns, rows, emphasize, level = 2 }: {
  title: string;
  columns: readonly TableColumn[];
  rows: readonly (readonly string[])[];
  /** First-cell value of a summary row to set in bold, e.g. "Total". */
  emphasize?: string;
  level?: Level;
}) {
  return (
    <ContentSection title={title} level={level}>
      <div className="overflow-x-auto rounded-xl border border-zinc-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-300 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">
              {columns.map((c, i) => (
                <th key={i} scope="col" className={`px-4 py-3 ${c.hideOnMobile ? "hidden sm:table-cell" : ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {rows.map((row) => (
              <tr key={row[0]} className={`bg-white transition-colors hover:bg-zinc-50 ${row[0] === emphasize ? "font-semibold" : ""}`}>
                {row.map((cell, i) => {
                  const c = columns[i];
                  const tone = i === 0
                    ? `font-medium ${TEXT.heading}`
                    : c?.accent ? `font-bold ${TEXT.heading}` : TEXT.body;
                  return (
                    <td key={i} className={`px-4 py-3 ${tone} ${c?.hideOnMobile ? "hidden sm:table-cell" : ""}`}>
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentSection>
  );
}

/**
 * A full-width feature that sits above the split view — the virtual lab, the simulator,
 * the builder. Gets an eyebrow so the student knows what kind of thing they are about to do.
 */
export function LessonFeature({ topic, eyebrow, title, lead, children, id }: {
  topic: TopicId;
  eyebrow: string;
  title: string;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  id: string;
}) {
  const theme = TOPIC_THEME[topic];
  return (
    <section className="mb-14 last:mb-0" aria-labelledby={id}>
      <div className="mb-5 max-w-3xl">
        <p className={`${EYEBROW} ${theme.text}`}>{eyebrow}</p>
        <h2 id={id} className={`mt-1.5 ${HEADING.feature} ${TEXT.heading}`}>{title}</h2>
        {lead && <p className={`mt-2 text-sm leading-relaxed ${TEXT.body}`}>{lead}</p>}
      </div>
      {children}
    </section>
  );
}
