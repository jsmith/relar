import { deleteAllUserData, adminDb } from "./utils";
import { testFunctions } from "./configure-tests";
import {
  createAndUploadTestSong,
  songTwo,
  songTwoAlbum,
  songTwoArtist,
  assertDoesNotExists,
} from "./test-utils";
import { test } from "uvu";
import assert from "uvu/assert";

// This must go *after* the `functions` init call
import { onDeleteSong } from "./delete";
import { admin } from "./admin";

const firestore = admin.firestore();
const db = adminDb(firestore, "testUser");

test.before.each(async () => {
  await deleteAllUserData(firestore, undefined, "testUser");
});

test("deletes album and artist and decrements song count", async () => {
  const wrapped = testFunctions.wrap(onDeleteSong);
  const ref = await createAndUploadTestSong("test", songTwo);
  await db.doc().set({ songCount: 1 });
  await db.album(songTwo.albumId).create(songTwoAlbum);
  await db.artist(songTwo.artist).create(songTwoArtist);
  await wrapped(await ref.get(), { params: { userId: "testUser" } });
  await assertDoesNotExists(db.album(songTwo.albumId));
  await assertDoesNotExists(db.artist(songTwo.artist));
  await assert.equal((await db.doc().get()).data(), { songCount: 0 });
});

test.run();
