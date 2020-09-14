import React from "react";
import { Album } from "../../universal/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "@graywolfai/react-tiniest-router";
import { routes } from "../../../routes";
import { useAlbumSongs } from "../queries/album";
import { useFirebaseUpdater } from "../watcher";
import { useQueue } from "../queue";

export const AlbumCard = ({
  album,
  className,
}: {
  album: firebase.firestore.QueryDocumentSnapshot<Album>;
  className?: string;
}) => {
  const { setQueue } = useQueue();
  const [data] = useFirebaseUpdater(album);
  const { goTo } = useRouter();
  const songs = useAlbumSongs(data.id);

  return (
    <ThumbnailCard
      snapshot={album}
      title={data.album ?? ""}
      subtitle={data.albumArtist}
      onClick={() => goTo(routes.album, { albumId: album.id })}
      className={className}
      play={() =>
        setQueue({
          songs: songs.data,
          source: { type: "album", id: data.id, sourceHumanName: data.album ?? "Unknown Album" },
        })
      }
    />
  );
};
