// Chrome shared by every visualization.
//
// The outer card of a viewer, panel, simulator, or lab was written out longhand in ~20
// places with two slightly different borders. It lives here now, so retheming the
// visualizations is a one-line change rather than a sweep through 11k lines of SVG.
import { FRAME, INSET } from "@/components/ui/tokens";

/** The outer card of any visualization surface. */
export const VIZ_FRAME = `overflow-hidden ${FRAME}`;

/** A quiet surface nested inside a visualization — legends, readouts, stage backdrops. */
export const VIZ_INSET = INSET;
