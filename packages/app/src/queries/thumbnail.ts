import { getDownloadURL } from "../storage";
import { useDefinedUser } from "../auth";
import { Artwork } from "../shared/types";
import { clientStorage } from "../shared/utils";
import * as Sentry from "@sentry/browser";
import { useEffect, useState, useMemo } from "react";
import { storage } from "../firebase";

export type ThumbnailSize = "32" | "64" | "128" | "256";

export interface ThumbnailObject {
  id: string;
  artwork: Artwork | undefined;
}

export type ThumbnailObjectSnapshot = firebase.firestore.DocumentSnapshot<ThumbnailObject>;

export const useThumbnail = (
  snapshot: ThumbnailObjectSnapshot | undefined,
  size: ThumbnailSize = "32",
) => {
  const snapshots = useMemo(() => (snapshot ? [snapshot] : []), [snapshot]);
  const thumbnails = useThumbnails(snapshots, size);
  return thumbnails[0];
};

export const useThumbnails = (
  snapshots: Array<
    firebase.firestore.DocumentSnapshot<{ id: string; artwork: Artwork | undefined }>
  >,
  size: ThumbnailSize = "32",
) => {
  const user = useDefinedUser();
  const [thumbnails, setThumbnails] = useState<Array<string | undefined>>([]);

  useEffect(() => {
    let ignore = false;
    const thumbnails = snapshots.map((snapshot) => tryToGetDownloadUrlOrLog(user, snapshot, size));
    Promise.all(thumbnails).then((thumbnails) => !ignore && setThumbnails(thumbnails));
    return () => {
      ignore = true;
    };
  }, [user, snapshots, size]);

  return thumbnails;
};

const keyLookup = {
  "32": "artworkDownloadUrl32",
  "64": "artworkDownloadUrl64",
  "128": "artworkDownloadUrl128",
  "256": "artworkDownloadUrl256",
} as const;

/**
 *
 * @param user
 * @param artwork
 * @param size The size. Only one for now but there will be more.
 */
export const tryToGetDownloadUrlOrLog = async (
  user: firebase.User,
  snapshot: firebase.firestore.DocumentSnapshot<{ artwork: Artwork | undefined }>,
  size: ThumbnailSize,
): Promise<string | undefined> => {
  const ref = snapshot.ref;
  const data = snapshot.data();
  if (!data || !data.artwork) {
    return;
  }

  const { artwork } = data;
  const key = keyLookup[size];
  const value = artwork[key];
  if (typeof value === "string") {
    return value;
  }

  if (artwork[key] === null) {
    return;
  }

  // console.log(
  //   artwork.hash,
  //   artwork.type,
  //   clientStorage(storage, user.uid).artworks(artwork.hash, artwork.type)[size](),
  // );
  const result = await getDownloadURL(
    clientStorage(storage, user.uid).artworks(artwork.hash, artwork.type)[size](),
  );

  if (result.isOk()) {
    artwork[key] = result.value;
    // we are explicitly not awaiting this since we don't care when it finishes
    ref.update({ artwork });
    return result.value;
  }

  if (result.error === "storage/object-not-found") {
    // This means that there isn't any artwork
    artwork[key] = null;
    // again, we are not awaiting
    ref.update({ artwork });
    return;
  }

  Sentry.captureMessage(
    `Unknown error when getting thumbnail (${artwork.hash}): ${result.error}`,
    Sentry.Severity.Error,
  );
};
