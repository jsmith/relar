import * as f from "firebase-functions";
import { deleteAllUserData, deleteAlbumIfSingleSong, deleteArtistSingleSong } from "./utils";
import { adminDb, adminStorage } from "./shared/node/utils";
import { Sentry, setSentryUser, wrapAndReport } from "./sentry";
import { admin } from "./admin";
import { Playlist, Song, SongType, UserData } from "./shared/universal/types";
import { createAlbumId, decode } from "./shared/universal/utils";

const db = admin.firestore();

export const onDeleteUser = f.auth.user().onDelete(async (user) => {
  setSentryUser({ id: user.uid, email: user.email });
  await deleteAllUserData(db, admin.storage(), user.uid);
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

    const userData = adminDb(db, userId).doc();

    const writes: Array<undefined | (() => void)> = [];
    const albumId = createAlbumId(song);
    await db.runTransaction(async (transaction) => {
      writes.push(await deleteAlbumIfSingleSong({ db, userId, transaction, albumId }));
      if (song.artist) {
        writes.push(await deleteArtistSingleSong({ db, userId, transaction, artist: song.artist }));
      }

      const playlists = await transaction.get(adminDb(db, userId).playlists());
      playlists.forEach((playlist) => {
        let found = false;
        const songs: Playlist["songs"] = playlist.data().songs?.filter(({ songId }) => {
          const keep = songId !== song.id;
          if (!keep) found = true;
          return keep;
        });

        const update: Partial<Playlist> = {
          songs,
          updatedAt: admin.firestore.FieldValue.serverTimestamp() as firebase.firestore.Timestamp,
        };
        if (found) writes.push(() => transaction.update(playlist.ref, update));
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
    //   const albums = await adminDb(db, userId)
    //     .albums()
    //     .collection()
    //     .where("artwork.hash", "==", song.artwork.hash)
    //     .get();

    //   if (albums.docs.length === 0) {
    //     await adminStorage(storage, userId)
    //       .artworks(song.artwork.hash, song.artwork.type)
    //       .all()
    //       .then(deleteAllFiles);
    //   }
    // }

    try {
      const file = adminStorage(admin.storage(), userId).song(song.id, song.fileName);
      await file.delete();
    } catch (e) {
      if (e.code === 404) {
        Sentry.captureMessage(`Couldn't find song to delete for ${song.id}.`, {
          extra: { song },
        });
      } else {
        throw e;
      }
    }
  }),
);
