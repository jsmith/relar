import { Song, Artist, Album } from "./shared/universal/types";
import * as uuid from "uuid";
import * as path from "path";
import { testFunctions } from "./configure-tests";
import { removeUndefined } from "./utils";
import { adminDb, adminStorage, deleteAllUserData } from "./shared/node/utils";
import { assertExists, createTestSong } from "./test-utils";
import { test } from "uvu";
import assert from "uvu/assert";

// This must go *after* the `functions` init call
import { createSong, parseID3Tags, md5Hash } from "./uploader";
import { admin } from "./admin";
import { createAlbumId } from "./shared/universal/utils";

const storage = admin.storage();
const firestore = admin.firestore();

const upload = async (fileName: string) => {
  const songId = uuid.v4();

  const destination = `testUser/songs/${songId}/${fileName}`;
  await storage.bucket().upload(path.resolve(__dirname, "../assets", fileName), {
    destination,
  });

  const objectMetadata = testFunctions.storage.makeObjectMetadata({
    name: destination,
    contentType: "audio/mpeg",
    bucket: storage.bucket().name,
  });

  return {
    songId,
    objectMetadata,
  };
};

const db = admin.firestore();

const getAlbum = (albumId: string) => {
  return adminDb(db, "testUser")
    .album(albumId)
    .get()
    .then((o) => o.data());
};

const getArtist = (artistId: string) => {
  return adminDb(db, "testUser")
    .artist(artistId)
    .get()
    .then((o) => o.data());
};

const getSong = (songId: string) => {
  return adminDb(db, "testUser")
    .song(songId)
    .get()
    .then((o) => o.data());
};

const getSongs = () => {
  return adminDb(db, "testUser")
    .songs()
    .get()
    .then((o) => o.docs.map((doc) => doc.data()));
};

const getAlbums = () => {
  return adminDb(db, "testUser")
    .albums()
    .get()
    .then((o) => o.docs.map((doc) => doc.data()));
};

const getArtists = () => {
  return adminDb(db, "testUser")
    .artists()
    .get()
    .then((o) => o.docs.map((doc) => doc.data()));
};

const getUserData = () => {
  return adminDb(db, "testUser")
    .doc()
    .get()
    .then((o) => o.data());
};

const initUserData = () => {
  return adminDb(db, "testUser").doc().set({ songCount: undefined, firstName: "", device: "none" });
};

test("can parse the tags of an mp3 file", async () => {
  const result = await parseID3Tags({
    tmpFilePath: path.resolve(__dirname, "..", "assets", "file_with_artist_album.mp3"),
  });

  if (result.isErr()) {
    throw Error("" + result.error);
  }

  const tags = result.value.id3Tag;
  assert.equal(tags?.title, "WalloonLilliShort");
  assert.equal(tags?.band, "Web Samples");
  assert.equal(tags?.artist, "Hendrik Broekman");
  assert.equal(tags?.album, "Web Samples");
});

test("can hash image", async () => {
  const filePath = path.resolve(__dirname, "..", "assets", "file_with_artist_album.mp3");
  const result = await md5Hash(filePath);
  const hash = result._unsafeUnwrap();
  assert.equal(hash, "91316d766920ee089779d22d12428c1a");
});

test("works when uploading a valid song with just a title", async () => {
  initUserData();
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata, songId } = await upload("file_just_title.mp3");
  await wrapped(objectMetadata);

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
      albumId: "<<<<<<<",
      genre: "",
      albumName: "",
      duration: 13087,
      updatedAt: song?.updatedAt,
    }),
  );
});

test.after.each(async () => {
  try {
    await deleteAllUserData(firestore, storage, "testUser");
  } catch (e) {
    console.log(e);
  }
});

test("works when uploading a valid song with a title, artist and album", async () => {
  initUserData();
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata, songId } = await upload("file_with_artist_album.mp3");
  await wrapped(objectMetadata);

  const song = (await getSong(songId)) as Song;
  const user = await getUserData();

  assert.equal(user.songCount, 1);

  const testSong = createTestSong({
    id: songId,
    title: "WalloonLilliShort",
    fileName: "file_with_artist_album.mp3",
    albumName: "Web Samples",
    albumArtist: "Web Samples",
    albumId: "Web Samples<<<<<<<Web Samples",
    genre: "Hubbard Demo - web sample",
    artist: "Hendrik Broekman",
    createdAt: song.createdAt,
    duration: 13087,
    updatedAt: song.updatedAt,
  });

  assert.equal(song, testSong);

  const albumId = createAlbumId(testSong);

  const artist = await getArtist(song.artist!);
  const album = await getAlbum(albumId);

  const expectedArtist: Artist = {
    id: "Hendrik Broekman",
    name: "Hendrik Broekman",
    updatedAt: artist.updatedAt,
    deleted: false,
  };

  const expectedAlbum: Album = removeUndefined({
    id: albumId,
    album: "Web Samples",
    albumArtist: "Web Samples",
    artwork: undefined,
    updatedAt: album.updatedAt,
    deleted: false,
  });

  assert.equal(artist, expectedArtist);
  assert.equal(album, expectedAlbum);
});

test("can upload two songs with the same artist/album", async () => {
  initUserData();
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata: om1, songId: s1 } = await upload("file_with_artist_album.mp3");
  await wrapped(om1);

  // This might eventually break when we check for duplicates using hashing
  const { objectMetadata: om2, songId: s2 } = await upload("file_with_artist_album.mp3");
  await wrapped(om2);

  const userData = await getUserData();
  assert.equal(userData?.songCount, 2);

  const songs = await getSongs();
  assert.equal(songs.length, 2);
  assert.equal(
    (songs[0].id === s1 && songs[1].id === s2) || (songs[0].id === s2 && songs[1].id === s1),
    true,
  );

  const artists = await getArtists();
  const albums = await getAlbums();
  assert.equal(artists.length, 1);
  assert.equal(albums.length, 1);
});

test("can upload artwork", async () => {
  initUserData();
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata, songId } = await upload("file_with_artwork.mp3");
  await wrapped(objectMetadata);
  const song = await getSong(songId);
  const file = storage.bucket().file(`testUser/song_artwork/${song?.artwork?.hash}/artwork.jpg`);
  const [exists] = await file.exists();
  assert.equal(exists, true);
});

test("can upload song with artist & album that have slashes in their names", async () => {
  initUserData();
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata, songId } = await upload("file_with_artist_and_album_with_slash.mp3");
  await wrapped(objectMetadata);

  await assertExists(
    adminDb(firestore, "testUser").album({
      albumName: "Sanctuary/EP",
      artist: "KOAN/Sound",
      albumArtist: "",
    }),
  );

  await assertExists(adminDb(firestore, "testUser").artist("KOAN/Sound"));
});

test.run();
