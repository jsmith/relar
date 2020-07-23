import * as functions from "firebase-functions";
import { deleteAllUserData, adminStorage, deleteAllFiles } from "./utils";
import { Sentry } from "./sentry";
import { admin } from "./admin";
import { Song, UserData } from "./shared/types";
import { adminDb } from "./shared/utils";

const storage = admin.storage();
const firestore = admin.firestore();

export const onDeleteUser = functions.auth.user().onDelete((user) => {
  try {
    deleteAllUserData(firestore, storage, user.uid);
  } catch (e) {
    // Although firebase will capture this, we need to make sure that this is logged to Sentry
    // This log includes enough context to fix the error
    Sentry.captureException(e, { user: { id: user.uid, email: user.email } });
    throw e;
  }
});

// TODO test
export const onDeleteSong = functions.firestore
  .document("user_data/{userId}/songs/{songId}")
  .onDelete(async (snapshot, context) => {
    const userId = context.params.userId;
    // FIXME validation
    const song = snapshot.data() as Song;

    const userData = adminDb(firestore, userId).doc();

    const decrement = admin.firestore.FieldValue.increment(-1);
    await userData.update({ songCount: decrement });

    // There could be a weird race condition where an album is updated to use this artwork
    // But it's a slim chance and we'll handle this in the frontend
    if (song.artwork) {
      const albums = await adminDb(firestore, userId)
        .albums()
        .collection()
        .where("artwork.hash", "==", song.artwork.hash)
        .get();

      if (albums.docs.length === 0) {
        await adminStorage(storage, userId)
          .artworks(song.artwork.hash, song.artwork.type)
          .all()
          .then(deleteAllFiles);
      }
    }

    const file = adminStorage(storage, userId).song(song.id, song.fileName);
    await file.delete();
  });
