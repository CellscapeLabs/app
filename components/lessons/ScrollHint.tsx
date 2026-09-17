"use client";
// "Scroll to continue" pill for lesson pages. Appears shortly after load when there's more
// lesson below the fold, and fades out for good once the student starts scrolling.

import { useEffect, useState } from "react";

const SHOW_DELAY_MS = 1200;
const DISMISS_AFTER_PX = 80;

export function ScrollHint() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = window.setTimeout(() => {
      const hasMoreBelow = document.documentElement.scrollHeight - window.innerHeight > DISMISS_AFTER_PX * 2;
      if (hasMoreBelow && window.scrollY < DISMISS_AFTER_PX) setVisible(true);
    }, SHOW_DELAY_MS);
    function onScroll() {
      if (window.scrollY > DISMISS_AFTER_PX) {
        setVisible(false);
        setDismissed(true);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dismissed]);

  function scrollDown() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollBy({ top: window.innerHeight * 0.8, behavior: reduce ? "auto" : "smooth" });
  }

  if (dismissed) return null;

  return (
    <div className={`pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center transition-all duration-500 ${
      visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
    }`}>
      <button onClick={scrollDown} tabIndex={visible ? 0 : -1} aria-hidden={!visible}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-zinc-900/85 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
        Scroll to continue
        <span aria-hidden="true" className="motion-safe:animate-bounce">↓</span>
      </button>
    </div>
  );
}
