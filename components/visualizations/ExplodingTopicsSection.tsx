"use client";
// Biology concept: Topic area navigation — five curriculum sections revealed through a scroll-driven card explosion
// Interactions: scroll-controlled card spread animation; click available topics to navigate

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import Link from "next/link";

type CardDef = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  accent: string;
  available: boolean;
};

const CARDS: CardDef[] = [
  { id: "cell-biology", title: "Cell Biology",  subtitle: "Mitosis · Organelles · Membranes", color: "#059669", accent: "#10b981", available: true  },
  { id: "genetics",     title: "Genetics",      subtitle: "DNA · Replication · Inheritance",  color: "#7c3aed", accent: "#8b5cf6", available: true  },
  { id: "ecosystems",   title: "Ecosystems",    subtitle: "Food Webs · Energy Flow · Cycles",  color: "#0891b2", accent: "#06b6d4", available: true  },
  { id: "microbiology", title: "Microbiology",  subtitle: "Bacteria · Viruses · Immunity",     color: "#c2410c", accent: "#fb923c", available: false },
  { id: "evolution",    title: "Evolution",     subtitle: "Natural Selection · Phylogenetics", color: "#9d174d", accent: "#f472b6", available: false },
];

// Pentagonal spread — no rotation, cards stay upright throughout
const SPREAD = [
  { x: "0vw",   y: "-38vh" },
  { x: "40vw",  y: "-20vh" },
  { x: "34vw",  y: "32vh"  },
  { x: "-34vw", y: "32vh"  },
  { x: "-40vw", y: "-20vh" },
] as const;

// ── Per-topic SVG illustrations (square viewBox, fill the card) ───────────────

function CardIcon({ id, color, accent }: { id: string; color: string; accent: string }) {
  switch (id) {
    case "cell-biology":
      return (
        <svg viewBox="0 0 180 180" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
          <circle cx="90" cy="90" r="74" fill={`${color}22`} stroke={accent} strokeWidth="2" strokeDasharray="12 6" />
          <circle cx="90" cy="90" r="30" fill={`${color}55`} stroke={accent} strokeWidth="1.5" />
          <circle cx="86" cy="86" r="13" fill={accent} opacity="0.55" />
          <ellipse cx="138" cy="50" rx="22" ry="10" fill={`${color}44`} stroke={accent} strokeWidth="1.5" transform="rotate(-30 138 50)" />
          <ellipse cx="46" cy="126" rx="20" ry="9" fill={`${color}44`} stroke={accent} strokeWidth="1.5" transform="rotate(15 46 126)" />
          <ellipse cx="148" cy="130" rx="18" ry="8" fill={`${color}33`} stroke={accent} strokeWidth="1.2" transform="rotate(40 148 130)" />
          <circle cx="58" cy="48" r="5" fill={accent} opacity="0.4" />
          <circle cx="130" cy="136" r="4.5" fill={accent} opacity="0.4" />
          <circle cx="42" cy="68" r="3.5" fill={accent} opacity="0.35" />
        </svg>
      );
    case "genetics": {
      const rungYs = [24, 52, 80, 108, 136, 160];
      return (
        <svg viewBox="0 0 180 180" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M 64 10 Q 82 34 64 58 Q 46 82 64 106 Q 82 130 64 154 Q 82 170 64 178" stroke={accent} strokeWidth="2.5" />
          <path d="M 116 10 Q 98 34 116 58 Q 134 82 116 106 Q 98 130 116 154 Q 98 170 116 178" stroke={color} strokeWidth="2.5" />
          {rungYs.map((y) => (
            <line key={y} x1="66" y1={y} x2="114" y2={y} stroke={`${accent}88`} strokeWidth="1.5" />
          ))}
          <circle cx="64" cy="24" r="4.5" fill={accent} opacity="0.7" />
          <circle cx="116" cy="24" r="4.5" fill={accent} opacity="0.7" />
          <circle cx="62" cy="80" r="4" fill={accent} opacity="0.6" />
          <circle cx="118" cy="80" r="4" fill={accent} opacity="0.6" />
        </svg>
      );
    }
    case "ecosystems": {
      const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
      return (
        <svg viewBox="0 0 180 180" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
          <circle cx="90" cy="28" r="18" fill="#fbbf24" opacity="0.9" />
          {rayAngles.map((a) => (
            <line
              key={a}
              x1={90 + 22 * Math.cos((a * Math.PI) / 180)}
              y1={28 + 22 * Math.sin((a * Math.PI) / 180)}
              x2={90 + 30 * Math.cos((a * Math.PI) / 180)}
              y2={28 + 30 * Math.sin((a * Math.PI) / 180)}
              stroke="#fbbf24" strokeWidth="2.5" opacity="0.75"
            />
          ))}
          <line x1="90" y1="50" x2="90" y2="80" stroke={accent} strokeWidth="2.5" opacity="0.7" />
          <ellipse cx="90" cy="100" rx="28" ry="22" fill={`${color}66`} stroke={accent} strokeWidth="1.5" />
          <line x1="70" y1="112" x2="46" y2="136" stroke={accent} strokeWidth="1.5" opacity="0.7" />
          <line x1="110" y1="112" x2="134" y2="136" stroke={accent} strokeWidth="1.5" opacity="0.7" />
          <circle cx="38" cy="148" r="14" fill={`${accent}44`} stroke={accent} strokeWidth="1.5" />
          <circle cx="142" cy="148" r="16" fill={`${accent}33`} stroke={accent} strokeWidth="1.5" />
        </svg>
      );
    }
    case "microbiology":
      return (
        <svg viewBox="0 0 180 180" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
          <ellipse cx="90" cy="90" rx="36" ry="64" fill={`${color}22`} stroke={accent} strokeWidth="2" />
          <path d="M 126 62 Q 158 44 154 20" stroke={accent} strokeWidth="1.5" opacity="0.6" />
          <path d="M 54 112 Q 22 124 18 148" stroke={accent} strokeWidth="1.5" opacity="0.6" />
          <path d="M 90 26 Q 110 10 106 -2" stroke={accent} strokeWidth="1.5" opacity="0.5" />
          <ellipse cx="90" cy="90" rx="16" ry="28" fill={`${accent}33`} stroke={accent} strokeWidth="1" strokeDasharray="4 3" />
          <circle cx="82" cy="74" r="5" fill={accent} opacity="0.55" />
          <circle cx="98" cy="94" r="5" fill={accent} opacity="0.55" />
          <circle cx="84" cy="110" r="4" fill={accent} opacity="0.45" />
        </svg>
      );
    default: // evolution — tree of life
      return (
        <svg viewBox="0 0 180 180" className="w-full h-full" fill="none" preserveAspectRatio="xMidYMid slice">
          <line x1="90" y1="170" x2="90" y2="130" stroke={accent} strokeWidth="2.5" />
          <line x1="90" y1="134" x2="48" y2="100" stroke={accent} strokeWidth="2" />
          <line x1="90" y1="134" x2="132" y2="100" stroke={accent} strokeWidth="2" />
          <line x1="48" y1="104" x2="24" y2="72" stroke={accent} strokeWidth="1.5" />
          <line x1="48" y1="104" x2="72" y2="72" stroke={accent} strokeWidth="1.5" />
          <line x1="132" y1="104" x2="108" y2="72" stroke={accent} strokeWidth="1.5" />
          <line x1="132" y1="104" x2="156" y2="72" stroke={accent} strokeWidth="1.5" />
          {[24, 72, 108, 156].map((cx) => (
            <circle key={cx} cx={cx} cy={62} r="8" fill={accent} opacity="0.7" />
          ))}
          <circle cx="90" cy="30" r="18" fill={`${color}33`} stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="90" y="36" textAnchor="middle" fontSize="13" fill={accent} fontWeight="bold">?</text>
        </svg>
      );
  }
}

// ── Individual card ───────────────────────────────────────────────────────────

interface CardProps {
  card: CardDef;
  spreadX: string;
  spreadY: string;
  progress: MotionValue<number>;
  zIndex: number;
}

function TopicCard({ card, spreadX, spreadY, progress, zIndex }: CardProps) {
  const x = useTransform(progress, [0, 0.6], ["0vw", spreadX]);
  const y = useTransform(progress, [0, 0.6], ["0vh", spreadY]);

  // Full-bleed square card: illustration fills entire card, text overlaid at bottom
  const visual = (
    <div
      className="relative w-full h-full rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${card.color}cc 0%, #0f172a 100%)`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${card.accent}33`,
      }}
    >
      {/* Full-bleed illustration */}
      <div className="absolute inset-0">
        <CardIcon id={card.id} color={card.color} accent={card.accent} />
      </div>

      {/* Gradient overlay — darkens bottom for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to top, ${card.color}f0 0%, ${card.color}66 35%, transparent 65%)`,
        }}
      />

      {/* Text pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <h3 className="font-bold text-white text-sm leading-tight drop-shadow">{card.title}</h3>
        {card.available ? (
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
            Explore →
          </span>
        ) : (
          <span className="mt-1 inline-block text-xs font-semibold text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      className="absolute"
      style={{
        width: 175,
        height: 175,
        left: "50%",
        top: "50%",
        marginLeft: -87,
        marginTop: -87,
        x,
        y,
        zIndex,
      }}
      whileHover={card.available ? { scale: 1.07 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      {card.available ? (
        <Link href={`/topics/${card.id}`} className="block w-full h-full">
          {visual}
        </Link>
      ) : (
        visual
      )}
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export function ExplodingTopicsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const textOpacity = useTransform(scrollYProgress, [0.55, 0.88], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.55, 0.88], [28, 0]);

  return (
    <section ref={trackRef} style={{ height: "400vh" }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden bg-gray-950 flex items-center justify-center">
        {/* Subtle green radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Five exploding topic cards */}
        {CARDS.map((card, i) => (
          <TopicCard
            key={card.id}
            card={card}
            spreadX={SPREAD[i].x}
            spreadY={SPREAD[i].y}
            progress={scrollYProgress}
            zIndex={CARDS.length - i}
          />
        ))}

        {/* Center text — fades in once cards have cleared the middle */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-0 px-8"
          style={{ opacity: textOpacity, y: textY }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
            Five fields.
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Infinite curiosity.
            </span>
          </h2>
          <p className="mt-6 text-gray-400 text-lg max-w-md">
            Drag, simulate, and explore. Each topic is hands-on from the first click.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
