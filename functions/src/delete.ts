import * as f from "firebase-functions";
import { adminDb, deleteAllUserData, serverTimestamp } from "./shared/node/utils";
import { setSentryUser, wrapAndReport } from "./sentry";
import { admin } from "./admin";
import { Playlist, SongType, UserData } from "./shared/universal/types";
import { decode } from "./shared/universal/utils";

export const onDeleteUser = f.auth.user().onDelete(async (user) => {
  setSentryUser({ id: user.uid, email: user.email });
  await deleteAllUserData(user.uid);
});

export const onDeleteSong = f.firestore.document("user_data/{userId}/songs/{songId}").onUpdate(
  wrapAndReport(async (snapshot, context) => {
    const userId = context.params.userId;
    setSentryUser({ id: userId });

    const before = decode(snapshot.before.data(), SongType)._unsafeUnwrap();
    const after = decode(snapshot.after.data(), SongType)._unsafeUnwrap();

    // If the "deleted attribute" hasn't changed then don't run
    if (before.deleted === after.deleted) return;

    // Also, if the change set "delete" to not true, then don't run the following code
    if (!after.deleted) return;

    const song = after;

    const userData = adminDb(userId).doc();

    const writes: Array<undefined | (() => void)> = [];
    await admin.firestore().runTransaction(async (transaction) => {
      const playlists = await transaction.get(adminDb(userId).playlists());
      playlists.forEach((playlist) => {
        const songs: Playlist["songs"] = playlist
          .data()
          .songs?.filter(({ songId }) => songId !== song.id);

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
  }),
);
