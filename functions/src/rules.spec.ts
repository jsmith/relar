import { test } from "uvu";
import * as firebase from "@firebase/rules-unit-testing";
import fs from "fs";
import path from "path";
import { createTestSong } from "./test-utils";

const app = firebase.initializeTestApp({
  projectId: "my-test-project",
  auth: { uid: "testUser", email: "test@user.com" },
});

const admin = firebase.initializeAdminApp({ projectId: "my-test-project" });

firebase.loadFirestoreRules({
  projectId: "my-test-project",
  rules: fs.readFileSync(path.join(__dirname, "..", "..", "firestore.rules"), "utf8"),
});

// FIXME type these
let ref: any;
let adminRef: any;
test.before.each(async () => {
  ref = app.firestore().doc(`user_data/testUser/songs/1`);
  adminRef = admin.firestore().doc(`user_data/testUser/songs/1`);
});

test("user can't create song", () => {
  const song = createTestSong();
  firebase.assertFails(ref.set(song));
});

test("user must pass use updatedAt", async () => {
  const song = createTestSong();
  await adminRef.set(song);
  await firebase.assertFails(ref.update({ title: "TEST" }));
});

test("user must pass valid title", async () => {
  const song = createTestSong();
  await adminRef.set(song);
  await firebase.assertFails(
    ref.update({ title: "", updatedAt: firebase.firestore.FieldValue.serverTimestamp() }),
  );
});

test("user can pass valid title", async () => {
  const song = createTestSong();
  await adminRef.set(song);
  await firebase.assertSucceeds(
    ref.update({ title: "WOW", updatedAt: firebase.firestore.FieldValue.serverTimestamp() }),
  );
});

test("user can edit liked, played, lastPlayed, downloadUrl, artwork and whenLiked", async () => {
  const song = createTestSong();
  await adminRef.set(song);
  await firebase.assertSucceeds(
    // ref.update({ title: "WOW", updatedAt: firebase.firestore.FieldValue.serverTimestamp() }),
    ref.update({
      // The following attributes are not all the right type but I don't currently have schema validation
      liked: "",
      played: "",
      downloadUrl: "",
      lastPlayed: "",
      artwork: "",
      whenLiked: "",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }),
  );
});

test("user can edit metadata attributes", async () => {
  const song = createTestSong();
  await adminRef.set(song);
  await firebase.assertSucceeds(
    ref.update({
      // The following attributes are not all the right type but I don't currently have schema validation
      artist: "",
      albumArtist: "",
      albumName: "",
      genre: "",
      year: "",
      track: "",
      disk: "",
      title: "New Title",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }),
  );
});

test.after(() => {
  Promise.all(firebase.apps().map((app) => app.delete()));
});

test.run();
