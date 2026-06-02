// Decorative floating biology symbols for the hero background
// All positions and timings are pre-defined (no randomness) for SSR compatibility

const PARTICLES = [
  // DNA bases — corners and edges so they don't block hero text
  { symbol: "A",    x: "4%",  y: "12%", delay: "0s",    dur: "6s",  cls: "animate-bio-float-1", color: "#10b981", size: 13 },
  { symbol: "T",    x: "91%", y: "18%", delay: "1.3s",  dur: "7s",  cls: "animate-bio-float-2", color: "#8b5cf6", size: 13 },
  { symbol: "G",    x: "3%",  y: "70%", delay: "2.1s",  dur: "5.5s",cls: "animate-bio-float-3", color: "#10b981", size: 13 },
  { symbol: "C",    x: "90%", y: "72%", delay: "0.7s",  dur: "8s",  cls: "animate-bio-float-1", color: "#8b5cf6", size: 13 },
  // Molecules
  { symbol: "ATP",  x: "7%",  y: "83%", delay: "1.8s",  dur: "6.5s",cls: "animate-bio-float-2", color: "#fb923c", size: 11 },
  { symbol: "H₂O", x: "87%", y: "44%", delay: "3.2s",  dur: "7.5s",cls: "animate-bio-float-3", color: "#06b6d4", size: 11 },
  { symbol: "CO₂", x: "5%",  y: "45%", delay: "0.4s",  dur: "9s",  cls: "animate-bio-float-1", color: "#94a3b8", size: 10 },
  { symbol: "RNA",  x: "88%", y: "86%", delay: "2.6s",  dur: "6s",  cls: "animate-bio-float-2", color: "#f472b6", size: 11 },
  // Greek letters / symbols
  { symbol: "α",    x: "12%", y: "30%", delay: "1s",    dur: "5s",  cls: "animate-bio-float-3", color: "#a78bfa", size: 18 },
  { symbol: "β",    x: "82%", y: "60%", delay: "2.4s",  dur: "7s",  cls: "animate-bio-float-1", color: "#34d399", size: 18 },
  { symbol: "γ",    x: "8%",  y: "57%", delay: "3.8s",  dur: "6s",  cls: "animate-bio-float-2", color: "#fb923c", size: 16 },
  { symbol: "Δ",    x: "86%", y: "32%", delay: "0.9s",  dur: "8.5s",cls: "animate-bio-float-3", color: "#60a5fa", size: 16 },
  // Hexagons (glucose / benzene ring)
  { symbol: "⬡",   x: "14%", y: "88%", delay: "1.5s",  dur: "7s",  cls: "animate-bio-float-1", color: "#10b981", size: 20 },
  { symbol: "⬡",   x: "80%", y: "10%", delay: "4s",    dur: "6.5s",cls: "animate-bio-float-2", color: "#8b5cf6", size: 16 },
  // Atoms / orbits
  { symbol: "⚛",   x: "92%", y: "8%",  delay: "2s",    dur: "9s",  cls: "animate-bio-float-3", color: "#06b6d4", size: 18 },
  { symbol: "⚛",   x: "2%",  y: "93%", delay: "0.3s",  dur: "7.5s",cls: "animate-bio-float-1", color: "#a78bfa", size: 15 },
  // Infinity (membrane potential)
  { symbol: "∞",   x: "88%", y: "78%", delay: "3s",    dur: "6s",  cls: "animate-bio-float-2", color: "#fb923c", size: 18 },
  // Pi (used in biology ratios)
  { symbol: "π",   x: "10%", y: "22%", delay: "4.2s",  dur: "8s",  cls: "animate-bio-float-3", color: "#4ade80", size: 16 },
] as const;

export function FloatingBioParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className={`absolute select-none font-bold ${p.cls}`}
          style={{
            left: p.x,
            top: p.y,
            color: p.color,
            fontSize: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
            opacity: 0.4,
          }}
        >
          {p.symbol}
        </div>
      ))}
    </div>
  );
}
