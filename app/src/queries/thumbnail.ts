import { getDownloadURL } from "../storage";
import { useDefinedUser, useUser } from "../auth";
import { Album, Artwork, Song } from "../shared/universal/types";
import { clientStorage } from "../shared/universal/utils";
import * as Sentry from "@sentry/browser";
import { useEffect, useState, useMemo } from "react";
import firebase from "firebase/app";
import { getUserDataOrError, serverTimestamp } from "../firestore";
import { captureAndLog } from "../utils";

export type ThumbnailType = "song" | "album";

export type ThumbnailSize = "32" | "64" | "128" | "256";

export interface ThumbnailObject {
  id: string;
  artwork: Artwork | undefined;
  updatedAt: firebase.firestore.Timestamp;
}

export const useThumbnail = (
  object: ThumbnailObject | undefined,
  type: ThumbnailType,
  size: ThumbnailSize = "32",
) => {
  const objects = useMemo(() => (object ? [object] : []), [object]);
  const thumbnails = useThumbnails(objects, type, size);
  return thumbnails[0];
};

export const useThumbnails = (
  objects: Array<ThumbnailObject>,
  type: ThumbnailType,
  size: ThumbnailSize = "32",
) => {
  const { user } = useUser();
  const [thumbnails, setThumbnails] = useState<Array<string | undefined>>([]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const thumbnails = objects.map((object) => tryToGetDownloadUrlOrLog(user, object, type, size));
    Promise.all(thumbnails).then((thumbnails) => !ignore && setThumbnails(thumbnails));
    return () => {
      ignore = true;
    };
  }, [user, objects, size, type]);

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
  data: ThumbnailObject,
  type: ThumbnailType,
  size: ThumbnailSize,
): Promise<string | undefined> => {
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

  const result = await getDownloadURL(
    clientStorage(firebase.storage(), user.uid).artworks(artwork.hash, artwork.type)[size](),
  );

  const update: Partial<Album & Song> = {
    artwork,
    updatedAt: serverTimestamp(),
  };

  const ref =
    type === "album" ? getUserDataOrError().album(data.id) : getUserDataOrError().song(data.id);

  if (result.isOk()) {
    artwork[key] = result.value;
    // we are explicitly not awaiting this since we don't care when it finishes
    ref.update(update);
    return result.value;
  }

  if (result.error === "storage/object-not-found") {
    // This means that there isn't any artwork
    artwork[key] = null;
    // again, we are not awaiting
    ref.update(update).catch(captureAndLog);
    return;
  }

  Sentry.captureMessage(
    `Unknown error when getting thumbnail (${artwork.hash}): ${result.error}`,
    Sentry.Severity.Error,
  );
};
