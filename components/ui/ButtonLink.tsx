// Chunky outlined link-button with an offset shadow — the site's primary call-to-action style.
import Link from "next/link";
import type React from "react";

const VARIANTS = {
  lime:  "bg-lime-300 text-zinc-950 hover:bg-lime-200",
  white: "bg-white text-zinc-950 hover:bg-zinc-50",
  dark:  "bg-zinc-950 text-white hover:bg-zinc-800",
} as const;

const SIZES = {
  md: "px-6 py-3 text-sm",
  sm: "px-4 py-2 text-sm",
} as const;

export function ButtonLink({ href, children, variant = "lime", size = "md", className = "" }: {
  href: string; children: React.ReactNode; variant?: keyof typeof VARIANTS; size?: keyof typeof SIZES; className?: string;
}) {
  return (
    <Link href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full border-2 border-zinc-950 font-bold shadow-[3px_3px_0_0_#09090b] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#09090b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}>
      {children}
    </Link>
  );
}
