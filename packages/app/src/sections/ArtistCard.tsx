import React from "react";
import { Album, Artist } from "../shared/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "../routes";
import { useArtistSongs } from "../queries/artist";

export const ArtistCard = ({
  artist,
  className,
}: {
  artist: firebase.firestore.QueryDocumentSnapshot<Artist>;
  className?: string;
}) => {
  const data = artist.data();
  const { goTo } = useRouter();
  const artistSongs = useArtistSongs(artist.id);

  return (
    <ThumbnailCard
      snapshot={artistSongs.data}
      title={data.name}
      subtitle={""}
      onClick={() => goTo(routes.artist, { artistName: data.name })}
      className={className}
    />
  );
};
