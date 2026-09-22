"use client";
// Thin scroll-progress bar pinned to the bottom edge of a lesson's sticky nav.
// Fills as the student scrolls, so it's always clear there's more lesson below.

import { useEffect, useState } from "react";

export function LessonProgress({ fill = "bg-zinc-900" }: {
  /** Tailwind background class for the fill — comes from the topic theme. */
  fill?: string;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let frame = 0;
    function measure() {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setPct(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 100);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Interactive sections can grow the page (trial logs, gamete cards), so re-measure on size changes
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  const rounded = Math.round(pct);
  return (
    <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-100" role="progressbar" aria-label="Lesson progress"
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={rounded} aria-valuetext={`${rounded}% through the lesson`}>
      <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
