"use client";
// Biology concept: Animal cell organelles and key structural components
// Interactions: Hover any structure to highlight it (others dim). Click to zoom into
//   a full-panel close-up view; details appear in the side panel. Click again or press
//   the back button to return to the full-cell view. Keyboard-accessible (Enter/Space).

import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type React from "react";
import {
  CELL_COLORS,
  NucleusGroup,
  MitochondrionGroup,
  GolgiGroup,
  LysosomeGroup,
  PeroxisomeGroup,
  CentrosomeGroup,
  RoughERGroup,
  SmoothERGroup,
} from "./CellIllustration";

// ─── Palette shortcuts ────────────────────────────────────────────────────────

const C = CELL_COLORS;
const SER_COLOR = "#0ea5e9";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrganelleId =
  | "nucleus"
  | "mitochondria"
  | "golgi"
  | "rough-er"
  | "smooth-er"
  | "lysosome"
  | "centrosome"
  | "peroxisome"
  | "cell-membrane"
  | "vacuole"
  | "ribosome"
  | "microtubule";

interface OrganelleData {
  id: OrganelleId;
  name: string;
  color: string;
  tagline: string;
  functionText: string;
  analogy: string;
  analogyDetail: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const ORGANELLES: OrganelleData[] = [
  {
    id: "nucleus",
    name: "Nucleus",
    color: C.nucleus,
    tagline: "The cell's command center",
    functionText:
      "Houses the cell's DNA and controls all cellular activity by regulating gene expression. The double nuclear envelope, studded with ~3,000 nuclear pore complexes, controls which proteins and RNA molecules can enter or exit. The nucleolus inside assembles ribosomal subunits.",
    analogy: "School principal's office",
    analogyDetail:
      "It holds all the school's rules and records (DNA), issues instructions to every department (gene expression), and nothing important leaves the building without passing through the front gate (nuclear pores).",
  },
  {
    id: "mitochondria",
    name: "Mitochondria",
    color: C.mito,
    tagline: "The cell's power station",
    functionText:
      "Generates ATP — the cell's energy currency — through cellular respiration. Pyruvate from glycolysis enters the mitochondrial matrix, feeds the Krebs cycle, and drives the electron transport chain on the highly folded inner membrane (cristae), maximising surface area for ATP synthase.",
    analogy: "Power station",
    analogyDetail:
      "Just as a power station burns fuel to generate electricity for the city, mitochondria burn glucose (via pyruvate) to generate ATP — the universal energy currency every cellular process runs on.",
  },
  {
    id: "golgi",
    name: "Golgi Apparatus",
    color: C.golgi,
    tagline: "The cell's postal sorting office",
    functionText:
      "Receives proteins from the rough ER, modifies them (glycosylation, phosphorylation, proteolytic cleavage), then packages them into vesicles and routes them to their final destination: the plasma membrane, lysosomes, or outside the cell via secretion.",
    analogy: "Post office sorting depot",
    analogyDetail:
      "Packages arrive from the ER factory, get stamped with delivery addresses (carbohydrate tags), sorted by destination along the cis-to-trans cisternae, and dispatched via secretory vesicles.",
  },
  {
    id: "rough-er",
    name: "Rough ER",
    color: C.er,
    tagline: "The protein assembly line",
    functionText:
      "An interconnected network of membrane-bound cisternae studded with ribosomes — giving it the 'rough' texture. Ribosomes translate mRNA and thread the nascent polypeptide into the ER lumen, where chaperones fold it, N-linked glycosylation begins, and misfolded proteins are flagged for degradation.",
    analogy: "Factory assembly line",
    analogyDetail:
      "Workers (ribosomes) build products (proteins) on conveyor belts (ER membranes); quality control (chaperones) rejects misfolded goods; finished items are bundled and sent to the warehouse (Golgi).",
  },
  {
    id: "smooth-er",
    name: "Smooth ER",
    color: SER_COLOR,
    tagline: "The lipid factory and detox unit",
    functionText:
      "Lacks ribosomes. Synthesises phospholipids, cholesterol, and steroid hormones. In liver cells, cytochrome P450 enzymes embedded in the smooth ER membrane detoxify drugs and alcohol. In muscle cells, it sequesters and releases Ca²⁺ ions to trigger and relax contraction.",
    analogy: "Refinery and pharmacy combined",
    analogyDetail:
      "Like an oil refinery that converts raw material into usable fuel (lipid synthesis), plus an in-house pharmacy that neutralises toxins before they reach the bloodstream — all in one organelle.",
  },
  {
    id: "lysosome",
    name: "Lysosome",
    color: C.lysosome,
    tagline: "The cell's recycling plant",
    functionText:
      "A membrane-bound sac filled with ~60 hydrolytic enzymes held at pH ~4.8 by proton pumps. Breaks down worn-out organelles (autophagy), ingested bacteria and debris (phagocytosis), and macromolecules into monomers the cell can reuse. Defects in lysosomal enzymes cause storage diseases.",
    analogy: "Recycling and waste-processing plant",
    analogyDetail:
      "Like a facility that shreds old machinery (autophagy) and sorts raw materials back into reusable parts — keeping the cell clean and ensuring nothing valuable goes permanently to waste.",
  },
  {
    id: "centrosome",
    name: "Centrosome",
    color: C.centrosome,
    tagline: "The cell's division control tower",
    functionText:
      "Sitting just outside the nucleus, the centrosome is the cell's hub for building and organising microtubules — the protein tubes that act as the cell's internal skeleton and transport network. It contains two small barrel-shaped structures called centrioles. When a cell is about to divide, the centrosome duplicates and the two copies move to opposite ends of the cell, where they build the spindle — a set of fibres that grabs each chromosome and pulls it to the right daughter cell so neither ends up with the wrong amount of DNA.",
    analogy: "Railway switching yard",
    analogyDetail:
      "Like a central rail depot that lays down tracks in every direction, the centrosome sends microtubule 'tracks' across the whole cell so organelles and cargo can be moved to exactly the right place — and during cell division, it uses those same tracks to sort the chromosomes.",
  },
  {
    id: "peroxisome",
    name: "Peroxisome",
    color: C.peroxisome,
    tagline: "The detox and fat-burning unit",
    functionText:
      "A small single-membrane organelle packed with oxidative enzymes. Breaks down very-long-chain fatty acids (>22 carbons) via β-oxidation, and neutralises reactive oxygen species — most notably converting toxic hydrogen peroxide (H₂O₂) into water via catalase.",
    analogy: "Water treatment facility",
    analogyDetail:
      "Just as a water treatment plant removes toxins from the supply (H₂O₂ → H₂O + O₂), peroxisomes detoxify the cytoplasm and process fats that mitochondria cannot directly handle.",
  },
  {
    id: "cell-membrane",
    name: "Cell Membrane",
    color: C.membrane,
    tagline: "The cell's selective barrier",
    functionText:
      "A phospholipid bilayer (~8 nm thick) that separates the cell from its environment and controls what enters and exits. Embedded transmembrane proteins act as channels, pumps, receptors, and adhesion molecules. Cholesterol in the bilayer regulates fluidity across temperature ranges.",
    analogy: "A building's security entrance",
    analogyDetail:
      "Like a security checkpoint that lets authorised personnel in (ion channels/pumps), receives deliveries (endocytosis), and posts notices to the outside world (surface receptors signalling nearby cells).",
  },
  {
    id: "vacuole",
    name: "Vacuole",
    color: C.vacuole,
    tagline: "The cell's storage and pressure tank",
    functionText:
      "A membrane-bound storage compartment. In animal cells, vacuoles are small and transient — used for storing nutrients, waste products, or water. The bounding membrane is called the tonoplast. Contractile vacuoles in some protists actively pump excess water out to prevent the cell from bursting.",
    analogy: "Storage tank and pressure regulator",
    analogyDetail:
      "Like a pressurised water tank in a building that stores reserves, maintains pressure, and releases contents on demand — keeping the cell's internal chemistry stable.",
  },
  {
    id: "ribosome",
    name: "Ribosome",
    color: C.er,
    tagline: "The universal protein-building machine",
    functionText:
      "Every cell in every living organism makes proteins using ribosomes. Each ribosome is a complex of rRNA and ~80 proteins assembled in two subunits (large + small). Free ribosomes in the cytoplasm make proteins for internal use; ribosomes on the rough ER make proteins for secretion or membranes.",
    analogy: "3D printer",
    analogyDetail:
      "Given a digital blueprint (mRNA), a ribosome reads it codon-by-codon and precisely assembles the specified polymer (protein) one amino-acid building block at a time.",
  },
  {
    id: "microtubule",
    name: "Microtubules",
    color: C.centrosome,
    tagline: "The cell's structural railway and scaffold",
    functionText:
      "Hollow tubes (25 nm diameter) built from α/β-tubulin dimers arranged in 13 protofilaments. They form the tracks that motor proteins (kinesin, dynein) use to transport cargo vesicles across the cell, build the mitotic spindle during division, and maintain cell shape via the cytoskeleton.",
    analogy: "Railway network",
    analogyDetail:
      "Like a city's railway system, microtubules provide high-speed, directional tracks for cargo transport (motor proteins carrying vesicles), with the centrosome acting as the central terminus where all lines originate.",
  },
];

// ─── Viewboxes for the close-up zoom mode ─────────────────────────────────────
// Each entry is the SVG viewBox string that crops the full-cell SVG to focus on
// that structure. The full-cell viewBox is "-55 -55 590 590".

const CLOSEUP_VIEWBOX: Record<OrganelleId, string> = {
  nucleus:        "144 144 192 192",
  mitochondria:   "278 100 165 110",
  golgi:          "226 292 148 132",
  "rough-er":     "188 158 212 170",   // includes nucleus edge for context
  "smooth-er":    "188 162 240 162",   // includes nucleus + RER + SER
  lysosome:       "278 338 152 112",
  centrosome:     "158 82 130 102",
  peroxisome:     "382 156 108 108",
  "cell-membrane":"12  12  456 456",
  vacuole:        "84  86  128 128",
  ribosome:       "120 298 174 174",
  microtubule:    "96  46  302 234",
};

// ─── Beacon positions (pulsing dots that invite clicking) ─────────────────────

const BEACON_POS: Record<OrganelleId, [number, number]> = {
  nucleus:         [240, 240],
  mitochondria:    [355, 152],
  golgi:           [298, 341],
  "rough-er":      [357, 240],
  "smooth-er":     [392, 240],
  lysosome:        [351, 387],
  centrosome:      [220, 125],
  peroxisome:      [426, 205],
  "cell-membrane": [240,  36],
  vacuole:         [145, 148],
  ribosome:        [200, 380],
  microtubule:     [295, 165],
};

// ─── Hover glow shapes ────────────────────────────────────────────────────────
// Returns an SVG subtree that appears behind the organelle on hover.

function HoverGlow({ id }: { id: OrganelleId }): React.ReactElement {
  switch (id) {
    case "nucleus":
      return <circle cx={240} cy={240} r={96} fill={C.nucleus} opacity={0.2} />;
    case "mitochondria":
      return (
        <g>
          <ellipse cx={355} cy={152} rx={56} ry={30} transform="rotate(-30 355 152)" fill={C.mito} opacity={0.22} />
          <ellipse cx={118} cy={290} rx={48} ry={25} transform="rotate(18 118 290)"  fill={C.mito} opacity={0.16} />
          <ellipse cx={368} cy={345} rx={42} ry={22} transform="rotate(42 368 345)"  fill={C.mito} opacity={0.16} />
        </g>
      );
    case "golgi":
      return <ellipse cx={298} cy={346} rx={58} ry={52} fill={C.golgi} opacity={0.2} />;
    case "rough-er":
      return <rect x={326} y={180} width={76} height={120} rx={10} fill={C.er} opacity={0.2} />;
    case "smooth-er":
      return <rect x={370} y={194} width={54} height={96} rx={8}  fill={SER_COLOR} opacity={0.2} />;
    case "lysosome":
      return <ellipse cx={348} cy={387} rx={54} ry={38} fill={C.lysosome} opacity={0.22} />;
    case "centrosome":
      return <ellipse cx={220} cy={125} rx={40} ry={30} fill={C.centrosome} opacity={0.22} />;
    case "peroxisome":
      return <ellipse cx={428} cy={205} rx={34} ry={38} fill={C.peroxisome} opacity={0.24} />;
    case "cell-membrane":
      return <circle cx={240} cy={240} r={208} fill="none" stroke={C.membrane} strokeWidth="18" opacity={0.2} />;
    case "vacuole":
      return <circle cx={145} cy={148} r={44} fill={C.vacuole} opacity={0.24} />;
    case "ribosome":
      return <ellipse cx={215} cy={385} rx={62} ry={46} fill={C.er} opacity={0.16} />;
    case "microtubule":
      return <ellipse cx={292} cy={155} rx={88} ry={60} fill={C.centrosome} opacity={0.15} />;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface OrganellesCtx {
  selected: OrganelleId | null;
  select:   (id: OrganelleId | null) => void;
}

const Ctx = createContext<OrganellesCtx>({ selected: null, select: () => {} });
const useOrganelles = () => useContext(Ctx);

export function OrganellesProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<OrganelleId | null>(null);
  return (
    <Ctx.Provider value={{ selected, select: setSelected }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── Cell SVG content ─────────────────────────────────────────────────────────
// Renders the entire cell diagram. In interactive mode, organelle groups get
// hover/click handlers, dimming, hover glows, and pulsing beacons.

const FULL_VIEWBOX = "-55 -55 590 590";

const FREE_RIBOSOMES: [number, number][] = [
  [180, 146], [286, 150], [158, 202], [164, 172],
  [144, 256], [200, 364], [282, 368], [258, 142],
  [108, 262], [132, 224], [136, 338], [172, 138],
  [104, 356], [150, 316], [174, 180], [80,  306],
  [108, 184], [410, 146], [430, 264], [388, 168],
  [432, 302], [178, 400], [212, 420], [254, 410],
  [82,  234], [96,  380], [422, 358], [442, 190],
];

const MICROTUBULES: [number, number, number, number][] = [
  [220, 125, 144, 246], [220, 125, 246, 152], [220, 125, 148, 194],
  [220, 125, 246, 240], [220, 125, 362, 160], [220, 125, 370, 348],
  [220, 125, 116, 292], [220, 125, 292, 392],
];

interface CellSVGProps {
  interactive: boolean;
  hovered:     OrganelleId | null;
  onHover?:    (id: OrganelleId | null) => void;
  onSelect?:   (id: OrganelleId) => void;
  selected?:   OrganelleId | null;
}

function CellSVG({ interactive, hovered, onHover, onSelect, selected }: CellSVGProps) {
  const anyHovered = hovered !== null;

  function groupProps(id: OrganelleId) {
    if (!interactive) return {};
    const isHovered = hovered === id;
    const dimmed    = anyHovered && !isHovered;
    return {
      role:          "button" as const,
      "aria-label":  `Learn about the ${ORGANELLES.find(o => o.id === id)?.name ?? id}`,
      "aria-pressed": selected === id,
      tabIndex:      0,
      onClick:       () => onSelect?.(id),
      onMouseEnter:  () => onHover?.(id),
      onMouseLeave:  () => onHover?.(null),
      onKeyDown:     (e: React.KeyboardEvent<SVGGElement>) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(id); }
      },
      style: {
        cursor:     "pointer",
        opacity:    dimmed ? 0.38 : 1,
        transition: "opacity 0.18s ease",
      } as React.CSSProperties,
    };
  }

  function showBeacon(id: OrganelleId) {
    return interactive && !anyHovered;
  }

  return (
    <>
      <defs>
        <radialGradient id="org-cellGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={C.membrane} stopOpacity="0.22" />
          <stop offset="100%" stopColor={C.membrane} stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="org-nucleusGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={C.nucleus}  stopOpacity="0.34" />
          <stop offset="100%" stopColor={C.nucleus}  stopOpacity="0"    />
        </radialGradient>
        <radialGradient id="org-vacuoleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={C.vacuole}  stopOpacity="0.28" />
          <stop offset="100%" stopColor={C.vacuole}  stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="240" cy="240" r="235" fill="url(#org-cellGlow)" />

      {/* ── Cell membrane ── */}
      <g {...groupProps("cell-membrane")}>
        {interactive && hovered === "cell-membrane" && <HoverGlow id="cell-membrane" />}
        <circle cx="240" cy="240" r="212" fill="none"
          stroke={C.membrane} strokeWidth="1.2" opacity="0.22" />
        <circle cx="240" cy="240" r="208" fill="rgba(236,253,245,0.55)"
          stroke={C.membrane} strokeWidth="2.5" strokeDasharray="14 6" />
        <circle cx="240" cy="240" r="196" fill="rgba(236,253,245,0.38)" />
        {/* Wide transparent stroke hit ring around membrane */}
        {interactive && (
          <circle cx="240" cy="240" r="208"
            fill="none" stroke="rgba(0,0,0,0.001)" strokeWidth="40" />
        )}
        {showBeacon("cell-membrane") && (
          <Beacon cx={BEACON_POS["cell-membrane"][0]} cy={BEACON_POS["cell-membrane"][1]} color={C.membrane} />
        )}
      </g>

      {/* Microtubules */}
      <g {...groupProps("microtubule")}>
        {interactive && hovered === "microtubule" && <HoverGlow id="microtubule" />}
        {MICROTUBULES.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={C.centrosome} strokeWidth="0.75" opacity="0.18" />
        ))}
        {interactive && (
          <ellipse cx={292} cy={155} rx={88} ry={60} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("microtubule") && (
          <Beacon cx={BEACON_POS.microtubule[0]} cy={BEACON_POS.microtubule[1]} color={C.centrosome} />
        )}
      </g>

      {/* ── Vacuole ── */}
      <g {...groupProps("vacuole")}>
        {interactive && hovered === "vacuole" && <HoverGlow id="vacuole" />}
        <circle cx="145" cy="148" r="36" fill="url(#org-vacuoleGlow)"
          stroke={C.vacuole} strokeWidth="1.8" />
        <circle cx="145" cy="148" r="20" fill={`${C.vacuole}20`} />
        <circle cx="149" cy="145" r="8"  fill={`${C.vacuole}30`} />
        {interactive && (
          <circle cx="145" cy="148" r="44" fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("vacuole") && (
          <Beacon cx={BEACON_POS.vacuole[0]} cy={BEACON_POS.vacuole[1]} color={C.vacuole} />
        )}
      </g>

      {/* ── Peroxisomes ── */}
      <g {...groupProps("peroxisome")}>
        {interactive && hovered === "peroxisome" && <HoverGlow id="peroxisome" />}
        <PeroxisomeGroup cx={418} cy={192} r={12} />
        <PeroxisomeGroup cx={438} cy={218} r={9}  />
        {interactive && (
          <ellipse cx={428} cy={205} rx={32} ry={38} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("peroxisome") && (
          <Beacon cx={BEACON_POS.peroxisome[0]} cy={BEACON_POS.peroxisome[1]} color={C.peroxisome} />
        )}
      </g>

      {/* ── Mitochondria ── */}
      <g {...groupProps("mitochondria")}>
        {interactive && hovered === "mitochondria" && <HoverGlow id="mitochondria" />}
        <MitochondrionGroup cx={355} cy={152} rx={42} ry={20} angle={-30} />
        <MitochondrionGroup cx={118} cy={290} rx={36} ry={17} angle={18}  />
        <MitochondrionGroup cx={368} cy={345} rx={30} ry={14} angle={42}  />
        {interactive && (
          <>
            <ellipse cx={355} cy={152} rx={56} ry={30} transform="rotate(-30 355 152)" fill="rgba(0,0,0,0.001)" />
            <ellipse cx={118} cy={290} rx={48} ry={25} transform="rotate(18 118 290)"  fill="rgba(0,0,0,0.001)" />
            <ellipse cx={368} cy={345} rx={42} ry={22} transform="rotate(42 368 345)"  fill="rgba(0,0,0,0.001)" />
          </>
        )}
        {showBeacon("mitochondria") && (
          <Beacon cx={BEACON_POS.mitochondria[0]} cy={BEACON_POS.mitochondria[1]} color={C.mito} />
        )}
      </g>

      {/* ── Rough ER ── */}
      <g {...groupProps("rough-er")}>
        {interactive && hovered === "rough-er" && <HoverGlow id="rough-er" />}
        <RoughERGroup cx={240} cy={240} />
        {interactive && (
          <rect x={330} y={182} width={72} height={120} rx={8} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("rough-er") && (
          <Beacon cx={BEACON_POS["rough-er"][0]} cy={BEACON_POS["rough-er"][1]} color={C.er} />
        )}
      </g>

      {/* ── Smooth ER ── */}
      <g {...groupProps("smooth-er")}>
        {interactive && hovered === "smooth-er" && <HoverGlow id="smooth-er" />}
        <SmoothERGroup cx={240} cy={240} />
        {interactive && (
          <rect x={374} y={198} width={50} height={90} rx={8} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("smooth-er") && (
          <Beacon cx={BEACON_POS["smooth-er"][0]} cy={BEACON_POS["smooth-er"][1]} color={SER_COLOR} />
        )}
      </g>

      {/* ── Free ribosomes ── */}
      <g {...groupProps("ribosome")}>
        {interactive && hovered === "ribosome" && <HoverGlow id="ribosome" />}
        {FREE_RIBOSOMES.map(([rcx, rcy], i) => (
          <circle key={i} cx={rcx} cy={rcy} r="3.5" fill={C.membrane} opacity="0.52" />
        ))}
        {interactive && (
          <ellipse cx={215} cy={385} rx={62} ry={46} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("ribosome") && (
          <Beacon cx={BEACON_POS.ribosome[0]} cy={BEACON_POS.ribosome[1]} color={C.er} />
        )}
      </g>

      {/* ── Golgi apparatus ── */}
      <g {...groupProps("golgi")}>
        {interactive && hovered === "golgi" && <HoverGlow id="golgi" />}
        <GolgiGroup cx={298} cy={325} />
        {interactive && (
          <rect x={240} y={300} width={120} height={92} rx={8} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("golgi") && (
          <Beacon cx={BEACON_POS.golgi[0]} cy={BEACON_POS.golgi[1]} color={C.golgi} />
        )}
      </g>

      {/* ── Lysosomes ── */}
      <g {...groupProps("lysosome")}>
        {interactive && hovered === "lysosome" && <HoverGlow id="lysosome" />}
        <LysosomeGroup cx={350} cy={386} r={13} />
        <LysosomeGroup cx={318} cy={402} r={10} />
        <LysosomeGroup cx={374} cy={368} r={9}  />
        {interactive && (
          <ellipse cx={348} cy={387} rx={56} ry={38} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("lysosome") && (
          <Beacon cx={BEACON_POS.lysosome[0]} cy={BEACON_POS.lysosome[1]} color={C.lysosome} />
        )}
      </g>

      {/* Nucleus glow behind the nucleus group */}
      <circle cx="240" cy="240" r="88" fill="url(#org-nucleusGlow)" />

      {/* ── Nucleus — rendered last so its hit area is on top in overlap zones ── */}
      <g {...groupProps("nucleus")}>
        {interactive && hovered === "nucleus" && <HoverGlow id="nucleus" />}
        <NucleusGroup cx={240} cy={240} r={88} />
        {interactive && (
          <circle cx={240} cy={240} r={93} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("nucleus") && (
          <Beacon cx={BEACON_POS.nucleus[0]} cy={BEACON_POS.nucleus[1]} color={C.nucleus} />
        )}
      </g>

      {/* ── Centrosome ── */}
      <g {...groupProps("centrosome")}>
        {interactive && hovered === "centrosome" && <HoverGlow id="centrosome" />}
        <CentrosomeGroup cx={220} cy={125} />
        {interactive && (
          <ellipse cx={220} cy={125} rx={38} ry={28} fill="rgba(0,0,0,0.001)" />
        )}
        {showBeacon("centrosome") && (
          <Beacon cx={BEACON_POS.centrosome[0]} cy={BEACON_POS.centrosome[1]} color={C.centrosome} />
        )}
      </g>
    </>
  );
}

// ─── Pulsing beacon ───────────────────────────────────────────────────────────

function Beacon({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <motion.circle
      cx={cx} cy={cy}
      r={5}
      fill={color}
      animate={{ r: [4, 7, 4], opacity: [0.85, 0.15, 0.85] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── Viewer ───────────────────────────────────────────────────────────────────

export function OrganellesViewer() {
  const { selected, select } = useOrganelles();
  const [hovered, setHovered] = useState<OrganelleId | null>(null);

  const isCloseUp = selected !== null;
  const viewBox   = isCloseUp ? CLOSEUP_VIEWBOX[selected] : FULL_VIEWBOX;

  return (
    <div className="relative w-full rounded-2xl border border-zinc-100 bg-zinc-50 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={isCloseUp ? `closeup-${selected}` : "full"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="w-full"
        >
          <svg
            viewBox={viewBox}
            className="w-full h-full"
            aria-label={
              isCloseUp
                ? `Close-up of ${ORGANELLES.find(o => o.id === selected)?.name}`
                : "Interactive animal cell diagram — click any highlighted structure to learn about it"
            }
          >
            <CellSVG
              interactive={!isCloseUp}
              hovered={hovered}
              onHover={setHovered}
              onSelect={select}
              selected={selected}
            />
          </svg>
        </motion.div>
      </AnimatePresence>

      {/* Back button — only shown in close-up mode */}
      <AnimatePresence>
        {isCloseUp && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            onClick={() => select(null)}
            className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm backdrop-blur-sm border border-zinc-200 hover:bg-white hover:text-zinc-900 transition-colors"
          >
            ← Back to cell
          </motion.button>
        )}
      </AnimatePresence>

      <p className="py-1.5 text-center text-xs text-zinc-400 select-none border-t border-zinc-100">
        {isCloseUp ? "Click ← to return to the full cell" : "Click to explore a structure"}
      </p>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function OrganellesPanel() {
  const { selected } = useOrganelles();
  const data = ORGANELLES.find((o) => o.id === selected) ?? null;

  return (
    <AnimatePresence mode="wait">
      {data ? (
        <motion.div
          key={data.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {data.tagline}
            </span>
          </div>

          <h2 className="mb-3 text-2xl font-black tracking-tight text-zinc-900">
            {data.name}
          </h2>

          <p className="mb-5 text-sm leading-relaxed text-zinc-600">
            {data.functionText}
          </p>

          <div
            className="rounded-xl border-l-4 px-4 py-3"
            style={{ borderColor: data.color, backgroundColor: `${data.color}18` }}
          >
            <p
              className="mb-0.5 text-xs font-bold uppercase tracking-wider"
              style={{ color: data.color }}
            >
              Real-world analogy
            </p>
            <p className="text-sm font-semibold text-zinc-800">{data.analogy}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{data.analogyDetail}</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex h-44 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50"
        >
          <p className="text-sm text-zinc-400">← Click to explore a structure</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Emblem (lesson card thumbnail) ──────────────────────────────────────────

export function OrganelleEmblem({ className }: { className?: string }) {
  return (
    <div className={className ?? "w-full h-full"}>
      <svg viewBox="148 142 204 204" className="w-full h-full" aria-hidden="true">
        <circle cx="240" cy="240" r="208"
          fill="rgba(236,253,245,0.4)" stroke={C.membrane} strokeWidth="2.5" strokeDasharray="14 6" />
        <circle cx="240" cy="240" r="88" fill={`${C.nucleus}22`} />
        <NucleusGroup cx={240} cy={240} r={82} />
        <MitochondrionGroup cx={348} cy={162} rx={36} ry={17} angle={-28} />
        <GolgiGroup cx={295} cy={330} />
      </svg>
    </div>
  );
}
