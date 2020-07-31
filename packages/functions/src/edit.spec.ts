import supertest from "supertest";
import { deleteCollection, adminDb, deleteAllUserData } from "./utils";
import { testFunctions, noOp, createTestSong, createTestUser } from "./test-utils";
import { admin } from "./admin";

import { app } from "./edit";
import { test } from "uvu";
import assert from "uvu/assert";
import { MetadataAPI, Song, Album, Artist } from "./shared/types";
import { createAlbumId } from "./shared/utils";

const firestore = admin.firestore();
noOp(testFunctions);
const db = adminDb(firestore, "testUser");

let idToken: string;

const SONG_ID = "test";

const editSongData: MetadataAPI["/edit"]["POST"]["body"]["update"] = {
  title: "Wow",
  artist: "Greg",
  albumArtist: "Greg G",
  albumName: "Wow Wow",
  genre: "Pop",
  year: "2000",
};

const songOne: Partial<Song> = {
  title: "one",
};

const songTwo: Partial<Song> = {
  title: "two",
  artist: "Old Ar",
  albumArtist: "Old AA",
  albumName: "Old Al",
  albumId: createAlbumId({ artist: "Old Ar", albumArtist: "Old AA", albumName: "Old Al" }),
};

const songTwoAlbum: Album = {
  id: songTwo.albumId,
  album: songTwo.albumName,
  albumArtist: songTwo.albumArtist,
  artwork: undefined,
};

const songTwoArtist: Artist = {
  name: songTwo.artist,
};

const editAlbumId = createAlbumId(editSongData);

const createBody = (
  update: MetadataAPI["/edit"]["POST"]["body"]["update"],
  songId = SONG_ID,
): MetadataAPI["/edit"]["POST"]["body"] => {
  return {
    idToken,
    songId,
    update: {
      ...update,
    },
  };
};

export const createAndUploadTestSong = async (options: Partial<Song>, songId = SONG_ID) => {
  const song = createTestSong(options);
  const ref = await adminDb(firestore, "testUser").song(songId);
  await ref.set(song);
  return ref;
};

const assertExists = async (ref: FirebaseFirestore.DocumentReference<unknown>) => {
  assert.ok((await ref.get()).exists);
};

const assertDoesNotExists = async (ref: FirebaseFirestore.DocumentReference<unknown>) => {
  assert.not((await ref.get()).exists);
};

test.before(async () => {
  // await deleteCollection(await firestore.collection("beta_signups"));
  const result = await createTestUser();
  idToken = result.token;
});

test.before.each(async () => {
  await deleteAllUserData(firestore, undefined, "testUser");
  // await deleteCollection(await firestore.collection("beta_signups"));
  // await db.song(SONG_ID).delete();
  // await db.album(editAlbumId).delete();
  // await db.artist("Greg").delete();
});

test("can successfully edit a song", async () => {
  const ref = await createAndUploadTestSong(songOne);
  const body = createBody(editSongData);
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "success",
  });
  const updated = await ref.get().then((snap) => snap.data());
  assert.equal(body.update.title, updated.title);
  assert.equal(body.update.year, updated.year);
  assert.equal(body.update.artist, updated.artist);
  assert.equal(body.update.genre, updated.genre);
  assert.equal(body.update.albumArtist, updated.albumArtist);
  assert.equal(body.update.albumName, updated.albumName);
  await assertExists(db.artist("Greg"));
  await assertExists(db.album(editAlbumId));
});

test("fails if the song doesn't exist", async () => {
  const body = createBody(editSongData);
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "error",
    code: "song-does-not-exist",
  });
});

test("deletes old album and artist", async () => {
  await createAndUploadTestSong(songTwo);
  await db.album(songTwo.albumId).create(songTwoAlbum);
  await db.artist(songTwo.artist).create(songTwoArtist);
  // await assertExists(db.album(songTwo.albumId));
  // await assertExists(db.artist(songTwoArtist.name));
  const body = createBody(editSongData);
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "success",
  });
  await assertDoesNotExists(db.album(songTwo.albumId));
  await assertDoesNotExists(db.artist(songTwo.artist));
});

test("doesn't delete old album and artist", async () => {
  // Create two songs (with different IDs) that have the same artist/album
  await createAndUploadTestSong(songTwo, "one");
  await createAndUploadTestSong(songTwo, "two");
  await db.album(songTwo.albumId).create(songTwoAlbum);
  await db.artist(songTwo.artist).create(songTwoArtist);
  const body = createBody(editSongData, "one");
  await supertest(app).post("/edit").send(body).expect(200, {
    type: "success",
  });
  await assertExists(db.album(songTwo.albumId));
  await assertExists(db.artist(songTwo.artist));
});

test.run();
