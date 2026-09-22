"use client";
// Makes every Framer Motion component in the app honour the OS "reduce motion" setting.
//
// Framer Motion does NOT read prefers-reduced-motion on its own — without this, the
// animated visualizations kept moving for students who had asked the OS to stop it.
// `reducedMotion="user"` disables transform and layout animations for those users while
// keeping opacity transitions, so interfaces still signal state changes.
//
// Animations driven outside React (imperative `animate()` and `useAnimationFrame` loops)
// don't read this context — those are guarded with `useReducedMotion()` at their call
// sites inside /components/visualizations.
import { MotionConfig } from "framer-motion";
import type React from "react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
