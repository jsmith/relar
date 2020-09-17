import React from "react";
import type { Artist } from "../../universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../../../routes";
import { useArtistSongs } from "../queries/artist";
import { useQueue } from "../queue";
import { useFirebaseUpdater } from "../watcher";

export const ArtistCard = ({
  artist,
  className,
}: {
  artist: firebase.firestore.QueryDocumentSnapshot<Artist>;
  className?: string;
}) => {
  const artistSongs = useArtistSongs(artist.id);
  const { setQueue } = useQueue();
  const [data] = useFirebaseUpdater(artist);
  const { goTo } = useRouter();
  const songs = useArtistSongs(data.name);

  return (
    <ThumbnailCard
      snapshot={artistSongs.data}
      title={data.name}
      subtitle={""}
      onClick={() => goTo(routes.artist, { artistName: data.name })}
      className={className}
      play={() =>
        setQueue({
          songs: songs.data,
          source: { type: "artist", id: data.name, sourceHumanName: data.name },
        })
      }
    />
  );
};
