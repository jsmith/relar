import * as functions from "firebase-functions";
import {
  deleteAllUserData,
  adminStorage,
  adminDb,
  deleteAlbumIfSingleSong,
  deleteArtistSingleSong,
} from "./utils";
import { Sentry, startScope } from "./sentry";
import { admin } from "./admin";
import { Song } from "./shared/types";
import { createAlbumId } from "./shared/utils";

const db = admin.firestore();

export const onDeleteUser = functions.auth.user().onDelete(async (user) => {
  startScope({ id: user.uid, email: user.email });
  await deleteAllUserData(db, admin.storage(), user.uid);
});

export const onDeleteSong = functions.firestore
  .document("user_data/{userId}/songs/{songId}")
  .onDelete(async (snapshot, context) => {
    const userId = context.params.userId;
    startScope({ id: userId });

    // FIXME validation
    const song = snapshot.data() as Song;

    const userData = adminDb(db, userId).doc();

    const writes: Array<undefined | (() => void)> = [];
    const albumId = createAlbumId(song);
    await db.runTransaction(async (transaction) => {
      writes.push(await deleteAlbumIfSingleSong({ db, userId, transaction, albumId }));
      if (song.artist) {
        writes.push(await deleteArtistSingleSong({ db, userId, transaction, artist: song.artist }));
      }

      const snap = await transaction.get(userData);
      if (snap.exists) {
        const decrement = admin.firestore.FieldValue.increment(-1);
        await transaction.update(userData, { songCount: decrement });
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
  });
