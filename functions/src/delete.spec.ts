import { deleteAllUserData } from "./utils";
import { adminDb } from "./shared/node/utils";
import { testFunctions } from "./configure-tests";
import {
  createAndUploadTestSong,
  createAndUploadPlaylist,
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

test("deletes album & artist, decrements song count, and deletes playlist items", async () => {
  const wrapped = testFunctions.wrap(onDeleteSong);
  const ref = await createAndUploadTestSong("test", songTwo);
  const playlist = await createAndUploadPlaylist("playlist name", [ref]);
  await db.doc().set({ songCount: 1 });
  await db.album(songTwo.albumId).create(songTwoAlbum);
  await db.artist(songTwo.artist).create(songTwoArtist);
  await wrapped(await ref.get(), { params: { userId: "testUser" } });
  await assertDoesNotExists(db.album(songTwo.albumId));
  await assertDoesNotExists(db.artist(songTwo.artist));
  await assert.equal((await db.doc().get()).data(), { songCount: 0 });
  const data = await playlist.get().then((snap) => snap.data());
  await assert.equal(data, {
    name: "playlist name",
    songs: [],
    id: playlist.id,
    createdAt: data?.createdAt,
  });
});

test.run();
