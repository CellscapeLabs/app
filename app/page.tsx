"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { CellIllustration } from "@/components/visualizations/CellIllustration";
import { ExplodingTopicsSection } from "@/components/visualizations/ExplodingTopicsSection";
import { VineDecoration } from "@/components/ui/VineDecoration";
import { FloatingBioParticles } from "@/components/ui/FloatingBioParticles";
import { CellscapeIcon } from "@/components/ui/CellscapeIcon";

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE = "easeOut" as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 44 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.65, ease: EASE } },
};

const staggerContainer: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.13 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.55, ease: EASE } },
};

const viewportOpts = { once: true, margin: "-80px" };

// ─── DNA separator ────────────────────────────────────────────────────────────

function DnaSeparator() {
  const RUNG_XS = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900, 990, 1080, 1170, 1260, 1350];
  return (
    <div className="relative h-14 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      <svg viewBox="0 0 1440 56" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="none">
        <path d="M 0 18 C 120 8 240 28 360 18 C 480 8 600 28 720 18 C 840 8 960 28 1080 18 C 1200 8 1320 28 1440 18"
          stroke="#10b981" strokeWidth="1.5" opacity="0.28" />
        <path d="M 0 38 C 120 48 240 28 360 38 C 480 48 600 28 720 38 C 840 48 960 28 1080 38 C 1200 48 1320 28 1440 38"
          stroke="#8b5cf6" strokeWidth="1.5" opacity="0.28" />
        {RUNG_XS.map((x, i) => (
          <line key={x} x1={x} y1={i % 2 === 0 ? 20 : 24} x2={x} y2={i % 2 === 0 ? 36 : 32}
            stroke={i % 2 === 0 ? "#10b981" : "#8b5cf6"} strokeWidth="1.2" opacity="0.35" />
        ))}
      </svg>
    </div>
  );
}

// ─── Floating atom decoration ─────────────────────────────────────────────────

function AtomIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 60 60" className={className} style={style} fill="none" aria-hidden="true">
      <circle cx="30" cy="30" r="4" fill="currentColor" opacity="0.7" />
      <ellipse cx="30" cy="30" rx="26" ry="10" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
      <ellipse cx="30" cy="30" rx="26" ry="10" stroke="currentColor" strokeWidth="1.2" opacity="0.4"
        transform="rotate(60 30 30)" />
      <ellipse cx="30" cy="30" rx="26" ry="10" stroke="currentColor" strokeWidth="1.2" opacity="0.4"
        transform="rotate(120 30 30)" />
    </svg>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🔬",
    title: "See Biology in Motion",
    description:
      "Watch mitosis unfold step by step, zoom into organelles, and manipulate 3D molecular structures — all in your browser.",
    colorClasses: "bg-emerald-50 border-emerald-200",
    glow: "rgba(16,185,129,0.08)",
  },
  {
    icon: "🧪",
    title: "Learn by Doing",
    description:
      "Run osmosis experiments, build food webs, and simulate DNA replication with hands-on virtual labs you control.",
    colorClasses: "bg-violet-50 border-violet-200",
    glow: "rgba(139,92,246,0.08)",
  },
  {
    icon: "⚡",
    title: "Actually Remember It",
    description:
      "Spaced repetition quizzes and visual progress tracking keep concepts fresh and build toward real mastery.",
    colorClasses: "bg-orange-50 border-orange-200",
    glow: "rgba(251,146,60,0.08)",
  },
] as const;

const STATS = [
  { value: "3",   label: "Topic Areas" },
  { value: "15+", label: "Interactive Visualizations" },
  { value: "∞",   label: "Lab Experiments" },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  // Scroll to top on every mount so hero animations and the sticky
  // card section always start from their initial state.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="relative bg-white">
      {/* Growing botanical vines — fixed, appear on xl+ screens */}
      <VineDecoration side="left" />
      <VineDecoration side="right" />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <CellscapeIcon />
            <span className="font-black text-zinc-900 tracking-tight">Cellscape</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/topics" className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:block">
              Topics
            </Link>
            <Link href="/topics" className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-100 transition-all hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-[1400px] px-6 pt-20 pb-10 lg:pt-28 lg:pb-6">
        {/* Floating biology particles behind content */}
        <FloatingBioParticles />

        {/* Subtle radial gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 70% 60% at 70% 50%, rgba(16,185,129,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(139,92,246,0.05) 0%, transparent 70%)" }}
        />

        <div className="grid items-center gap-8 lg:grid-cols-[5fr_8fr] lg:gap-10">
          {/* ── Hero copy ── */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="relative z-10"
          >
            <motion.h1 variants={fadeUp}
              className="text-5xl font-black leading-[1.05] tracking-tight text-zinc-900 lg:text-6xl"
            >
              Biology{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                clicks
              </span>
              <br />
              when you can
              <br />
              see it{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                move.
              </span>
            </motion.h1>

            <motion.p variants={fadeUp}
              className="mt-6 max-w-md text-lg leading-relaxed text-zinc-500"
            >
              Watch mitosis happen in real time. Build a food web. Simulate osmosis.
              Biology makes sense when you can actually touch it.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link href="/topics"
                className="group relative rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-200 hover:-translate-y-0.5"
              >
                Start Learning Free
                <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/topics"
                className="rounded-full border-2 border-zinc-200 px-7 py-3.5 text-sm font-bold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:-translate-y-0.5"
              >
                Explore Topics
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-5 text-xs text-zinc-400">
              No account required · Works on any device
            </motion.p>
          </motion.div>

          {/* ── Hero illustration ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="relative z-10"
          >
            {/* Gradient card behind cell */}
            <div className="absolute inset-0 rounded-3xl"
              style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(139,92,246,0.1) 0%, transparent 60%), linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #faf5ff 100%)" }}
            />

            {/* Decorative atom icons */}
            <AtomIcon className="absolute -top-4 -right-4 w-10 h-10 text-emerald-400 opacity-60 animate-bio-float-2"
              style={{ animationDuration: "8s", animationDelay: "1s" }}
            />
            <AtomIcon className="absolute -bottom-4 -left-4 w-8 h-8 text-violet-400 opacity-50 animate-bio-float-1"
              style={{ animationDuration: "7s", animationDelay: "3s" }}
            />

            <Link
              href="/topics/cell-biology/organelles"
              className="relative block p-3 lg:p-5 rounded-2xl transition-all hover:ring-2 hover:ring-emerald-400/50 hover:ring-offset-2 cursor-pointer group"
              aria-label="Explore cell organelles — interactive lesson"
            >
              <CellIllustration />
              <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Explore organelles →
              </span>
            </Link>

          </motion.div>
        </div>
      </section>

      {/* ── DNA separator ── */}
      <DnaSeparator />

      {/* ── Stats bar ── */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewportOpts}
        variants={fadeUp}
        className="border-y border-zinc-100 bg-gradient-to-r from-zinc-50 via-white to-zinc-50"
      >
        <div className="mx-auto max-w-6xl px-6 py-8">
          <motion.div variants={staggerContainer} className="flex flex-wrap justify-center gap-10 text-center lg:gap-20">
            {STATS.map(({ value, label }) => (
              <motion.div key={label} variants={cardVariant}>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-400 bg-clip-text text-5xl font-black text-transparent">
                  {value}
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-500">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOpts}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="mb-14 text-center">
            <h2 className="text-4xl font-black tracking-tight text-zinc-900">Why Cellscape?</h2>
            <p className="mt-3 text-zinc-500">Built for the way visual learners actually learn.</p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon, title, description, colorClasses, glow }) => (
              <motion.div
                key={title}
                variants={cardVariant}
                whileHover={{ y: -6, boxShadow: `0 20px 40px ${glow}` }}
                className={`rounded-3xl border-2 p-8 transition-colors ${colorClasses} cursor-default`}
              >
                <div className="mb-4 text-4xl">{icon}</div>
                <h3 className="mb-2 text-lg font-bold text-zinc-900">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Exploding topics — pinned scroll reveals cards outward ── */}
      <ExplodingTopicsSection />

      {/* ── Final CTA ── */}
      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={viewportOpts}
        variants={fadeUp}
        className="relative overflow-hidden py-28 text-center"
      >
        {/* Background gradient blob */}
        <div className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)" }}
        />

        {/* Decorative atoms */}
        <AtomIcon className="absolute left-8 top-8 w-16 h-16 text-emerald-300 opacity-40 animate-bio-float-1"
          style={{ animationDuration: "9s" }}
        />
        <AtomIcon className="absolute right-8 bottom-8 w-12 h-12 text-violet-300 opacity-40 animate-bio-float-3"
          style={{ animationDuration: "7s", animationDelay: "2s" }}
        />

        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-5xl font-black tracking-tight text-zinc-900 lg:text-6xl">
            Ready to actually
            <br />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              get it?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-lg text-zinc-500">
            Every concept is something you can drag, break, and put back together.
          </p>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-10 inline-block"
          >
            <Link href="/topics"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-10 py-4 text-base font-bold text-white shadow-2xl shadow-emerald-200 transition-colors hover:bg-emerald-600"
            >
              Start Learning Free →
            </Link>
          </motion.div>
          <p className="mt-4 text-xs text-zinc-400">Free · No account needed · Works on mobile</p>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm">
          <div className="flex items-center gap-2">
            <CellscapeIcon className="h-6 w-6 shadow-none" />
            <span className="font-black tracking-tight text-zinc-800">Cellscape</span>
          </div>
          <span className="text-zinc-400">Interactive biology for everyone.</span>
        </div>
      </footer>
    </div>
  );
}
