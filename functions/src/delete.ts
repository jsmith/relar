import * as f from "firebase-functions";
import { adminDb, deleteAllUserData, serverTimestamp } from "./shared/node/utils";
import { setSentryUser } from "./sentry";
import { admin } from "./admin";
import * as functions from "firebase-functions";
import { Playlist, Song, SongAPI, UserData } from "./shared/universal/types";
import { configureExpress } from "./express-utils";
import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";

export const onDeleteUser = f.auth.user().onDelete(async (user) => {
  setSentryUser({ id: user.uid, email: user.email });
  await deleteAllUserData(user.uid);
});

export const app = configureExpress((app) => {
  const router = TypedAsyncRouter<SongAPI>(app);

  router.delete("/songs/:songId", async (req) => {
    const { body } = req;
    let user: admin.auth.DecodedIdToken;
    const auth = admin.auth();
    try {
      user = await auth.verifyIdToken(body.idToken);
    } catch (e) {
      return {
        type: "error",
        code: "unauthorized",
      };
    }

    const songId = req.params.songId;
    if (!songId) return { type: "error", code: "does-not-exist" };

    const song = adminDb(user.uid).song(songId);
    const userData = adminDb(user.uid).doc();

    const writes: Array<undefined | (() => void)> = [];
    await admin.firestore().runTransaction(async (transaction) => {
      const update: Partial<Song> = {
        deleted: true,
        updatedAt: serverTimestamp(),
      };

      // FIXME switch this to an "array-contains" query in a few weeks when *all* playlist songs
      // are just lists of IDs
      const playlists = await transaction.get(adminDb(user.uid).playlists());
      playlists.forEach((playlist) => {
        const songs: Playlist["songs"] = playlist
          .data()
          .songs?.filter((item) =>
            typeof item === "string" ? item !== song.id : item.songId !== song.id,
          );

        const update: Partial<Playlist> = {
          songs,
          updatedAt: serverTimestamp(),
        };

        if (playlist.data().songs?.length !== songs?.length)
          writes.push(() => transaction.update(playlist.ref, update));
      });

      const snap = await transaction.get(userData);
      if (snap.exists) {
        const decrement = admin.firestore.FieldValue.increment(-1);
        const update: Partial<UserData> = { songCount: (decrement as unknown) as number };
        writes.push(() => transaction.update(userData, update));
      }

      transaction.update(song, update);
      writes.forEach((write) => write && write());
    });

    // Ok so we are ignoring artwork for now
    // // There could be a weird race condition where an album is updated to use this artwork
    // // But it's a slim chance and we'll handle this in the frontend
    // if (song.artwork) {
    //   const albums = await adminDb(userId)
    //     .albums()
    //     .collection()
    //     .where("artwork.hash", "==", song.artwork.hash)
    //     .get();

    //   if (albums.docs.length === 0) {
    //     await adminStorage(userId)
    //       .artworks(song.artwork.hash, song.artwork.type)
    //       .all()
    //       .then(deleteAllFiles);
    //   }
    // }

    // try {
    //   const file = adminStorage(userId).song(song.id, song.fileName);
    //   await file.delete();
    // } catch (e) {
    //   if (e.code === 404) {
    //     Sentry.captureMessage(`Couldn't find song to delete for ${song.id}.`, {
    //       extra: { song },
    //     });
    //   } else {
    //     throw e;
    //   }
    // }

    return {
      type: "success",
    };
  });
});

export const songApp = functions.https.onRequest(app);
