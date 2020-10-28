import React from "react";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { SongsOverview } from "../sections/SongsOverview";
import { useGeneratedTypeSongs } from "../../queries/songs";
import { GeneratedType, generatedTypeToName } from "../../queue";

export const Generated = () => {
  const { params } = useRouter();
  // FIXME validation
  const { generatedType } = params as { generatedType: GeneratedType };
  const songs = useGeneratedTypeSongs(generatedType);

  return (
    <SongsOverview
      songs={songs}
      title={generatedTypeToName[generatedType]}
      includeDateAdded={generatedType === "recently-added"}
      source={{ type: "generated", id: generatedType }}
    />
  );
};

export default Generated;
