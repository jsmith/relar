import supertest from "supertest";
import { deleteAllUserData } from "./utils";
import { adminDb } from "./shared/node/utils";
import { testFunctions } from "./configure-tests";
import {
  noOp,
  createTestUser,
  songOne,
  songTwo,
  songTwoAlbum,
  songTwoArtist,
  createAndUploadTestSong,
  assertExists,
  assertDoesNotExists,
} from "./test-utils";
import { admin } from "./admin";

import { app } from "./edit";
import { test } from "uvu";
import assert from "uvu/assert";
import { MetadataAPI } from "./shared/universal/types";
import { createAlbumId } from "./shared/universal/utils";

const firestore = admin.firestore();
noOp(testFunctions);
const db = adminDb(firestore, "testUser");

let idToken: string;

const editSongData: MetadataAPI["/edit"]["POST"]["body"]["update"] = {
  title: "Wow",
  artist: "Greg",
  albumArtist: "Greg G",
  albumName: "Wow Wow",
  genre: "Pop",
  year: "2000",
};

const editAlbumId = createAlbumId(editSongData);

const createBody = (
  songId: string,
  update: MetadataAPI["/edit"]["POST"]["body"]["update"],
): MetadataAPI["/edit"]["POST"]["body"] => {
  return {
    idToken,
    songId,
    update: {
      ...update,
    },
  };
};

test.before(async () => {
  // await deleteCollection(await firestore.collection("beta_signups"));
  const result = await createTestUser();
  idToken = result.token;
});

test.before.each(async () => {
  await deleteAllUserData(firestore, undefined, "testUser");
});

test("can successfully edit a song", async () => {
  const ref = await createAndUploadTestSong("test", songOne);
  const body = createBody("test", editSongData);
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "success",
  });
  const updated = await ref.get().then((snap) => snap.data());
  assert.equal(body.update.title, updated?.title);
  assert.equal(body.update.year, updated?.year);
  assert.equal(body.update.artist, updated?.artist);
  assert.equal(body.update.genre, updated?.genre);
  assert.equal(body.update.albumArtist, updated?.albumArtist);
  assert.equal(body.update.albumName, updated?.albumName);
  assert.equal(createAlbumId(body.update), updated?.albumId);
  await assertExists(db.artist("Greg"));
  await assertExists(db.album(editAlbumId));
});

test("fails if the song doesn't exist", async () => {
  const body = createBody("test", editSongData);
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "error",
    code: "song-does-not-exist",
  });
});

test("deletes old album and artist", async () => {
  await createAndUploadTestSong("test", songTwo);
  await db.album(songTwo.albumId).create(songTwoAlbum);
  await db.artist(songTwo.artist).create(songTwoArtist);
  // await assertExists(db.album(songTwo.albumId));
  // await assertExists(db.artist(songTwoArtist.name));
  const body = createBody("test", editSongData);
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "success",
  });
  await assertDoesNotExists(db.album(songTwo.albumId));
  await assertDoesNotExists(db.artist(songTwo.artist));
});

test("doesn't delete old album and artist", async () => {
  // Create two songs (with different IDs) that have the same artist/album
  await createAndUploadTestSong("one", songTwo);
  await createAndUploadTestSong("two", songTwo);
  await db.album(songTwo.albumId).create(songTwoAlbum);
  await db.artist(songTwo.artist).create(songTwoArtist);
  const body = createBody("one", editSongData);
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "success",
  });
  await assertExists(db.album(songTwo.albumId));
  await assertExists(db.artist(songTwo.artist));
});

test.run();
