"use client";
// Decorative paper airplane trail — winding dashed paths that connect page sections

import { motion } from "framer-motion";

interface PlaneStop {
  x: number;
  y: number;
  /** Degrees clockwise from pointing-right (0°). Use atan2(dy,dx) of the path tangent. */
  angle: number;
  /** 0–1: fraction of total path length where this plane sits — used to time its pop-in */
  progress: number;
}

interface PaperTrailProps {
  d: string;
  viewBox: string;
  planes: PlaneStop[];
  color?: string;
  className?: string;
}

function Plane({ x, y, angle, color }: { x: number; y: number; angle: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M -13 0 L 13 -6 L 9 0 L 13 6 Z" fill={color} />
      <line x1="9" y1="0" x2="-2" y2="2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
    </g>
  );
}

const DRAW_DURATION = 2.4;

export function PaperTrail({ d, viewBox, planes, color = "#10b981", className = "" }: PaperTrailProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox={viewBox} className="w-full h-full" fill="none" preserveAspectRatio="none">
        <motion.path
          d={d}
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="12 8"
          strokeLinecap="round"
          opacity={0.32}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.32 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            pathLength: { duration: DRAW_DURATION, ease: "easeInOut" },
            opacity: { duration: 0.4 },
          }}
        />
        {planes.map((p, i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 0.6, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.45,
              ease: "backOut",
              delay: p.progress * DRAW_DURATION + 0.05,
            }}
          >
            <Plane x={p.x} y={p.y} angle={p.angle} color={color} />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}
