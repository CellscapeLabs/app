// The lesson reading layout: a visualization that stays put on the left while the
// explanation scrolls past it on the right. Collapses to a single column below `lg`.
import type React from "react";
import { TEXT } from "@/components/ui/tokens";

export function LessonSplit({ viewer, caption, children }: {
  viewer: React.ReactNode;
  /** One line telling the student what they can do with the viewer. */
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-8">
      <div className="mb-6 lg:mb-0 lg:sticky lg:top-24">
        {viewer}
        {caption && <p className={`mt-2 text-center text-xs ${TEXT.muted}`}>{caption}</p>}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}
