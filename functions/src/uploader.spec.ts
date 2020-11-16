import { Song } from "./shared/universal/types";
import * as uuid from "uuid";
import * as path from "path";
import { adminDb, deleteAllUserData, md5Hash } from "./shared/node/utils";
import { assertFileDoesNotExist, assertFileExists, createTestSong } from "./test-utils";
import { test } from "uvu";
import assert from "uvu/assert";
import functions from "firebase-functions-test";

// This must go *after* the `functions` init call
import { createSong, parseMetadata } from "./uploader";
import { admin } from "./admin";
import { removedUndefinedValues } from "./shared/universal/utils";

const storage = admin.storage();

const uploadCanCall = async (fileName: string) => {
  const songId = uuid.v4();

  const destination = `testUser/songs/${songId}/${fileName}`;
  await storage.bucket().upload(path.resolve(__dirname, "../assets", fileName), {
    destination,
  });

  const objectMetadata = functions().storage.makeObjectMetadata({
    name: destination,
    contentType: "audio/mpeg",
    bucket: storage.bucket().name,
  });

  const file = storage.bucket().file(destination);

  const wrapped = functions().wrap(createSong);
  try {
    await wrapped(objectMetadata);
  } catch (error) {
    error.songId = songId;
    error.objectMetadata = objectMetadata;
    error.file = file;
    throw error;
  }

  return {
    error: undefined,
    songId,
    file,
    objectMetadata,
  };
};

const getSong = (songId: string) => {
  return adminDb("testUser")
    .song(songId)
    .get()
    .then((o) => o.data());
};

const getAction = (index = 0) => {
  return adminDb("testUser")
    .actions()
    .orderBy("createdAt")
    .get()
    .then((snap) => snap.docs[index].data());
};

const getSongs = () => {
  return adminDb("testUser")
    .songs()
    .get()
    .then((o) => o.docs.map((doc) => doc.data()));
};

const getUserData = () => {
  return adminDb("testUser")
    .doc()
    .get()
    .then((o) => o.data());
};

const initUserData = () => {
  return adminDb("testUser")
    .doc()
    .set(removedUndefinedValues({ songCount: undefined, firstName: "", device: "none" }));
};

test("can parse the tags of an mp3 file", async () => {
  const result = await parseMetadata(
    path.resolve(__dirname, "..", "assets", "file_with_artist_album.mp3"),
  );

  if (result.isErr()) {
    throw Error("" + result.error.message);
  }

  const tags = result.value;
  assert.equal(tags.common.title, "WalloonLilliShort");
  assert.equal(tags.common.albumartist, "Web Samples");
  assert.equal(tags.common.artist, "Hendrik Broekman");
  assert.equal(tags.common.album, "Web Samples");
  assert.equal(tags.common.track, { no: 30, of: 30 });
  assert.equal(tags.common.disk, { no: null, of: 2 });
  assert.equal(Math.round(tags.format.duration * 1000), 13087);
});

test("can hash image", async () => {
  const filePath = path.resolve(__dirname, "..", "assets", "file_with_artist_album.mp3");
  const result = await md5Hash(filePath);
  const hash = result._unsafeUnwrap();
  assert.equal(hash, "b5ecdb659b2df687a1a5aedb3fb1da78");
});

test("works when uploading a valid song with just a title", async () => {
  initUserData();
  const { songId } = await uploadCanCall("file_just_title.mp3");

  const song = await getSong(songId);
  const user = await getUserData();

  assert.equal(user.songCount, 1);
  assert.equal(song && typeof song.createdAt.toMillis(), "number");
  assert.equal(
    song,
    createTestSong({
      id: songId,
      title: "WalloonLilliShort",
      fileName: "file_just_title.mp3",
      createdAt: song?.createdAt,
      duration: 13087,
      updatedAt: song?.updatedAt,
      track: {
        no: 30,
        of: 30,
      },
      disk: {
        no: null,
        of: null,
      },
      hash: "b8ee90edc66d92d2a4b130de59e262d8",
    }),
  );
});

test.before.each(async () => {
  try {
    await deleteAllUserData("testUser");
  } catch (e) {
    console.warn(e);
  }
});

test("works when uploading a valid song with a title, artist and album", async () => {
  initUserData();
  const { songId } = await uploadCanCall("file_with_artist_album.mp3");

  const song = (await getSong(songId)) as Song;
  const user = await getUserData();

  assert.equal(user.songCount, 1);

  const testSong = createTestSong({
    id: songId,
    title: "WalloonLilliShort",
    fileName: "file_with_artist_album.mp3",
    albumName: "Web Samples",
    albumArtist: "Web Samples",
    genre: "Hubbard Demo - web sample",
    artist: "Hendrik Broekman",
    createdAt: song.createdAt,
    duration: 13087,
    updatedAt: song.updatedAt,
    track: {
      no: 30,
      of: 30,
    },
    disk: {
      no: null,
      of: 2,
    },
    hash: "b5ecdb659b2df687a1a5aedb3fb1da78",
  });

  assert.equal(song, testSong);
  const actions = await adminDb("testUser").actions().get();
  assert.equal(actions.docs.length, 1);
  const action = actions.docs[0].data();
  assert.equal(action.songId, song.id);
  assert.equal(action.status, "success");
  assert.equal(action.fileName, "file_with_artist_album.mp3");
});

test("can upload two songs with the same artist/album", async () => {
  initUserData();
  const { songId: s1 } = await uploadCanCall("file_with_artist_album.mp3");

  // This might eventually break when we check for duplicates using hashing
  const { songId: s2 } = await uploadCanCall("file_with_artist_album_with_diff_track.mp3");

  const userData = await getUserData();
  assert.equal(userData?.songCount, 2);

  const songs = await getSongs();
  assert.equal(songs.length, 2);
  assert.equal(
    (songs[0].id === s1 && songs[1].id === s2) || (songs[0].id === s2 && songs[1].id === s1),
    true,
  );

  const actions = await adminDb("testUser").actions().get();
  assert.equal(actions.docs.length, 2);
});

test("can upload artwork", async () => {
  initUserData();
  const { songId } = await uploadCanCall("file_with_artwork.mp3");
  const song = await getSong(songId);
  const file = storage.bucket().file(`testUser/song_artwork/${song?.artwork?.hash}/artwork.jpg`);
  const [exists] = await file.exists();
  assert.equal(exists, true);
});

test("can upload bogus mp3", async () => {
  initUserData();
  const { songId, file } = await uploadCanCall("empty.mp3");
  const action = await getAction();
  assert.equal(action.songId, songId);
  assert.equal(action.status, "error");
  await assertFileDoesNotExist(file);
});

test("can upload corrupt mp3", async () => {
  initUserData();
  const { songId, file } = await uploadCanCall("corrupt.mp3");
  const action = await getAction();
  assert.equal(action.songId, songId);
  assert.equal(action.status, "error");
  await assertFileDoesNotExist(file);
});

test("stops duplicates", async () => {
  initUserData();
  const { songId, file } = await uploadCanCall("file_with_artwork.mp3");
  const action = await getAction();
  assert.equal(action.status, "success");
  await assertFileExists(file);

  const { file: file2 } = await uploadCanCall("file_with_artwork.mp3");
  const action2 = await getAction(1);
  assert.equal(action2.status, "cancelled");
  await assertFileDoesNotExist(file2);

  adminDb("testUser").song(songId).update({
    deleted: true,
  });

  // test doesn't throw an error this time
  await uploadCanCall("file_with_artwork.mp3");
});

test.run();
