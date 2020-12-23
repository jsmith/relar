import { adminDb, deleteAllUserData } from "./shared/node/utils";
import {
  createAndUploadTestSong,
  createAndUploadPlaylist,
  songTwo,
  createTestUser,
} from "./test-utils";
import { test } from "uvu";
import assert from "uvu/assert";
import { app } from "./delete";
import supertest from "supertest";
import { userInfo } from "os";

let idToken: string;

test.before(async () => {
  const result = await createTestUser();
  idToken = result.token;
});

test.before.each(async () => {
  await deleteAllUserData("testUser");
});

test("decrements song count and deletes song playlist", async () => {
  const db = adminDb("testUser");
  const song = await createAndUploadTestSong("test1", songTwo);
  const original = await song.get().then((r) => r.data());
  const playlist = await createAndUploadPlaylist("playlist name", [song]);
  await db.doc().set({ songCount: 1, firstName: "", device: "android" });

  await supertest(app).delete(`/songs/${song.id}`).send({ idToken }).expect(200, {
    type: "success",
  });

  const userData = await db
    .doc()
    .get()
    .then((r) => r.data());
  assert.equal(userData, {
    songCount: 0,
    firstName: "",
    device: "android",
  });

  const updated = await db
    .song(song.id)
    .get()
    .then((r) => r.data());

  assert.equal(updated, { ...original, deleted: true, updatedAt: updated.updatedAt });

  const data = await playlist.get().then((snap) => snap.data());
  assert.equal(data, {
    name: "playlist name",
    songs: [],
    id: playlist.id,
    createdAt: data?.createdAt,
    updatedAt: data.updatedAt,
    deleted: false,
  });
});

test.run();
