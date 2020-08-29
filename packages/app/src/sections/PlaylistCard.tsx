import React from "react";
import { Playlist } from "../shared/types";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "../routes";
import { useFirebaseUpdater } from "../watcher";

export const PlaylistCard = ({
  playlist,
  className,
}: {
  playlist: firebase.firestore.QueryDocumentSnapshot<Playlist>;
  className?: string;
}) => {
  const [data] = useFirebaseUpdater(playlist);
  // const thumbnail = useThumbnail(album, "128");
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      thumbnail={undefined}
      // TODO maybe??
      // letterArt
      title={data.name}
      subtitle={""}
      onClick={() => goTo(routes.playlist, { playlistId: playlist.id })}
      className={className}
    />
  );
};
