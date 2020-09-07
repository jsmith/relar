import * as f from "firebase-functions";
import {
  deleteAllUserData,
  adminStorage,
  adminDb,
  deleteAlbumIfSingleSong,
  deleteArtistSingleSong,
} from "./utils";
import { Sentry, setSentryUser, wrapAndReport } from "./sentry";
import { admin } from "./admin";
import { Playlist, SongType } from "./shared/types";
import { createAlbumId, decode } from "./shared/utils";

const db = admin.firestore();

export const onDeleteUser = f.auth.user().onDelete(async (user) => {
  setSentryUser({ id: user.uid, email: user.email });
  await deleteAllUserData(db, admin.storage(), user.uid);
});

export const onDeleteSong = f.firestore.document("user_data/{userId}/songs/{songId}").onDelete(
  wrapAndReport(async (snapshot, context) => {
    const userId = context.params.userId;
    setSentryUser({ id: userId });

    const song = decode(snapshot.data(), SongType)._unsafeUnwrap();

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
          const keep = songId !== snapshot.id;
          if (!keep) found = true;
          return keep;
        });

        // No TS typechecking here
        if (found) writes.push(() => transaction.update(playlist.ref, { songs }));
      });

      const snap = await transaction.get(userData);
      if (snap.exists) {
        const decrement = admin.firestore.FieldValue.increment(-1);
        writes.push(() => transaction.update(userData, { songCount: decrement }));
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
      const file = adminStorage(admin.storage(), userId).song(snapshot.id, song.fileName);
      await file.delete();
    } catch (e) {
      if (e.code === 404) {
        Sentry.captureMessage(`Couldn't find song to delete for ${snapshot.id}.`, {
          extra: { song },
        });
      } else {
        throw e;
      }
    }
  }),
);
