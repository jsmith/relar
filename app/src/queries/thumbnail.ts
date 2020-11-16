import { getDownloadURL } from "../storage";
import { useUser } from "../auth";
import { Song } from "../shared/universal/types";
import * as Sentry from "@sentry/browser";
import { useEffect, useState, useMemo } from "react";
import firebase from "firebase/app";
import { getUserDataOrError, serverTimestamp } from "../firestore";
import { captureAndLog, clientStorage } from "../utils";

export type ThumbnailSize = "32" | "64" | "128" | "256";

export const useThumbnail = (song: Song | undefined, size: ThumbnailSize = "32") => {
  const objects = useMemo(() => (song ? [song] : []), [song]);
  const thumbnails = useThumbnails(objects, size);
  return thumbnails[0];
};

export const useThumbnails = (songs: Array<Song>, size: ThumbnailSize = "32") => {
  const { user } = useUser();
  const [thumbnails, setThumbnails] = useState<Array<string | undefined>>([]);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    const thumbnails = songs.map((song) => tryToGetDownloadUrlOrLog(user, song, size));
    Promise.all(thumbnails).then((thumbnails) => !ignore && setThumbnails(thumbnails));
    return () => {
      ignore = true;
    };
  }, [user, songs, size]);

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
  data: Song,
  size: ThumbnailSize,
  batch?: firebase.firestore.WriteBatch,
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

  const update: Partial<Song> = {
    artwork,
    updatedAt: serverTimestamp(),
  };

  const ref = getUserDataOrError().song(data.id);

  if (result.isOk()) {
    artwork[key] = result.value;
    // we are explicitly not awaiting this since we don't care when it finishes
    if (batch) batch.update(ref, update);
    else ref.update(update).catch(captureAndLog);
    return result.value;
  }

  if (result.error === "storage/object-not-found") {
    // Sentry.captureMessage(`Artwork data not found for ${ref.path}`, Sentry.Severity.Warning);
    // This means that there isn't any artwork
    // artwork[key] = null;
    // again, we are not awaiting
    // Edit: This logic is actually bad. If the artwork isn't there, it might not have generated yet.
    // Because of this, I'm going just ignoring this error
    // This *could* also happen if the thumbnail creation fails though
    // ref.update(update).catch(captureAndLog);
    return;
  }

  Sentry.captureMessage(
    `Unknown error when getting thumbnail (${artwork.hash}): ${result.error}`,
    Sentry.Severity.Error,
  );
};
