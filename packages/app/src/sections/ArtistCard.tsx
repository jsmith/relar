import React from "react";
import { Album, Artist } from "../shared/types";
import { useThumbnail, ThumbnailSize } from "../queries/thumbnail";
import { ThumbnailCard } from "../components/ThumbnailCard";
import { useRouter } from "react-tiniest-router";
import { routes } from "../routes";

export const ArtistCard = ({
  artist,
  className,
}: {
  artist: firebase.firestore.QueryDocumentSnapshot<Artist>;
  className?: string;
}) => {
  const data = artist.data();
  // const thumbnail = useThumbnail(album, "128");
  const { goTo } = useRouter();

  return (
    <ThumbnailCard
      thumbnail={undefined}
      // TODO maybe??
      // letterArt
      title={data.name}
      subtitle={""}
      onClick={() => goTo(routes.artist, { artistName: data.name })}
      className={className}
    />
  );
};
