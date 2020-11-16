import { test } from "uvu";
import assert from "uvu/assert";
import admin from "firebase-admin";
import { adminDb, adminStorage } from "./utils";

// Duplicate code from admin.ts
admin.initializeApp({
  projectId: "relar-test",
  storageBucket: "relar-test.appspot.com",
  credential: admin.credential.applicationDefault(),
});

export const check = (f: () => string, expected: string) => {
  test(expected, () => {
    assert.equal(f(), expected);
  });
};

// Getting these paths right is crucial
// DB
check(() => adminDb("1234").userId, "1234");
check(() => adminDb("1234").doc().path, "user_data/1234");
check(() => adminDb("1234").songs().path, "user_data/1234/songs");
check(() => adminDb("1234").song("abc").path, "user_data/1234/songs/abc");
check(() => adminDb("1234").actions().path, "user_data/1234/actions");
check(() => adminDb("1234").action("abc").path, "user_data/1234/actions/abc");
check(() => adminDb("1234").playlist("abc").path, "user_data/1234/playlists/abc");
check(() => adminDb("1234").playlists().path, "user_data/1234/playlists");

// Storage
check(
  () => adminStorage("1234").artworks("abc", "jpg")[32]().name,
  "1234/song_artwork/abc/thumb@32_artwork.jpg",
);
check(
  () => adminStorage("1234").artworks("abc", "jpg").original().name,
  "1234/song_artwork/abc/artwork.jpg",
);
check(() => adminStorage("1234").song("abc", "test.mp3").name, "1234/songs/abc/test.mp3");

test.run();
