import { adminDb, deleteAllUserData } from "./shared/node/utils";
import { testFunctions } from "./configure-tests";
import {
  createAndUploadTestSong,
  createAndUploadPlaylist,
  songTwo,
  songTwoAlbum,
  songTwoArtist,
  assertDeleted,
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
  const before = await createAndUploadTestSong("test1", songTwo);
  const after = await createAndUploadTestSong("test2", { ...songTwo, deleted: true });
  const playlist = await createAndUploadPlaylist("playlist name", [after]);
  await db.doc().set({ songCount: 1, firstName: "", device: "android" });
  await db.album(songTwo.albumId).create(songTwoAlbum);
  await db.artist(songTwo.artist).create(songTwoArtist);
  await wrapped(
    { before: await before.get(), after: await after.get() },
    { params: { userId: "testUser" } },
  );
  assertDeleted(db.album(songTwo.albumId));
  assertDeleted(db.artist(songTwo.artist));
  await assert.equal((await db.doc().get()).data(), { songCount: 0 });
  const data = await playlist.get().then((snap) => snap.data());
  await assert.equal(data, {
    name: "playlist name",
    songs: [],
    id: playlist.id,
    createdAt: data?.createdAt,
    updatedAt: data.updatedAt,
    deleted: false,
  });
});

test.run();
