// Lesson id → card thumbnail. Add an emblem here for each new lesson as it's built.
import type React from "react";
import { MitosisEmblem } from "@/components/visualizations/MitosisAnimation";
import { MeiosisEmblem } from "@/components/visualizations/MeiosisAnimation";
import { OrganelleEmblem } from "@/components/visualizations/OrganellesVisualization";
import { CellMembraneEmblem } from "@/components/visualizations/CellMembraneVisualization";
import { OsmosisEmblem } from "@/components/visualizations/OsmosisSimulator";
import { CellularRespirationEmblem } from "@/components/visualizations/CellularRespirationVisualization";
import { PhotosynthesisEmblem } from "@/components/visualizations/PhotosynthesisVisualization";
import { DnaStructureEmblem } from "@/components/visualizations/DnaStructureVisualization";
import { DnaReplicationEmblem } from "@/components/visualizations/DnaReplicationVisualization";

export const LESSON_EMBLEMS: Record<string, React.ComponentType<{ className?: string }>> = {
  mitosis: MitosisEmblem,
  meiosis: MeiosisEmblem,
  organelles: OrganelleEmblem,
  "cell-membrane": CellMembraneEmblem,
  osmosis: OsmosisEmblem,
  "cellular-respiration": CellularRespirationEmblem,
  photosynthesis: PhotosynthesisEmblem,
  "dna-structure": DnaStructureEmblem,
  "dna-replication": DnaReplicationEmblem,
};
