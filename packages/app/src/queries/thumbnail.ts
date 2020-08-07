import { getDownloadURL } from "../storage";
import { useDefinedUser } from "../auth";
import { Artwork } from "../shared/types";
import { clientStorage } from "../shared/utils";
import * as Sentry from "@sentry/browser";
import { useEffect, useState } from "react";
import { storage } from "../firebase";

export const useThumbnail = (
  snapshot?: firebase.firestore.DocumentSnapshot<{ id: string; artwork: Artwork | undefined }>,
) => {
  const user = useDefinedUser();
  const [thumbnailUrl, setThumbnailUrl] = useState<string>();

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    tryToGetDownloadUrlOrLog(user, snapshot, "32").then(setThumbnailUrl);
  }, [user, snapshot]);

  return thumbnailUrl;
};

const keyLookup = {
  "32": "artworkDownloadUrl32",
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
  size: "32",
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

  console.log(
    artwork.hash,
    artwork.type,
    clientStorage(storage, user.uid).artworks(artwork.hash, artwork.type)[size](),
  );
  const result = await getDownloadURL(
    clientStorage(storage, user.uid).artworks(artwork.hash, artwork.type)[size](),
  );

  console.log(result);

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
