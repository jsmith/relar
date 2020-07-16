import { Song, Artist, Album } from "./shared/types";
import * as uuid from "uuid";
import * as path from "path";
import { deleteAllUserData, removeUndefined } from "./utils";
import { testFunctions } from "./test-utils";
import { test } from "uvu";
import assert from "uvu/assert";

// This must go *after* the `functions` init call
import { createSong, parseID3Tags, md5Hash } from "./uploader";
import { userDataPath } from "./shared/utils";
import { admin } from "./admin";

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
  return userDataPath(db, "testUser")
    .albums()
    .album(albumId)
    .get()
    .then((o) => o.data());
};

const getArtist = (artistId: string) => {
  return userDataPath(db, "testUser")
    .artists()
    .artist(artistId)
    .get()
    .then((o) => o.data());
};

const getSong = (songId: string) => {
  return userDataPath(db, "testUser")
    .songs()
    .song(songId)
    .get()
    .then((o) => o.data());
};

const getSongs = () => {
  return userDataPath(db, "testUser")
    .songs()
    .collection()
    .get()
    .then((o) => o.docs.map((doc) => doc.data()));
};

const getAlbums = () => {
  return userDataPath(db, "testUser")
    .albums()
    .collection()
    .get()
    .then((o) => o.docs.map((doc) => doc.data()));
};

const getArtists = () => {
  return userDataPath(db, "testUser")
    .artists()
    .collection()
    .get()
    .then((o) => o.docs.map((doc) => doc.data()));
};

const getUserData = () => {
  return userDataPath(db, "testUser")
    .doc()
    .get()
    .then((o) => o.data());
};

export const createTestSong = (song: Partial<Song>): Song => {
  // Remove undefined values for equality checks
  return removeUndefined({
    id: "",
    title: "",
    liked: false,
    fileName: "",
    played: 0,
    downloadUrl: undefined,
    year: "",
    artist: undefined,
    album: undefined,
    lastPlayed: undefined,
    artwork: undefined,
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    ...song,
  });
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
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata, songId } = await upload("file_just_title.mp3");
  await wrapped(objectMetadata);

  const song = await getSong(songId);
  const user = await getUserData();

  assert.equal(user, { songCount: 1 });
  assert.equal(song && typeof song.createdAt.toMillis(), "number");
  assert.equal(
    song,
    createTestSong({
      id: songId,
      title: "WalloonLilliShort",
      fileName: "file_just_title.mp3",
      createdAt: song?.createdAt,
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
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata, songId } = await upload("file_with_artist_album.mp3");
  await wrapped(objectMetadata);

  const song = (await getSong(songId)) as Song;
  const user = await getUserData();

  assert.equal(user, { songCount: 1 });

  assert.equal(
    song,
    createTestSong({
      id: songId,
      title: "WalloonLilliShort",
      fileName: "file_with_artist_album.mp3",
      album: {
        name: "Web Samples",
        id: song.album!.id,
      },
      artist: {
        name: "Hendrik Broekman",
        id: song.artist!.id,
      },
      createdAt: song.createdAt,
    }),
  );

  const artist = await getArtist(song.artist!.id);
  const album = await getAlbum(song.album!.id);

  const expectedArtist: Artist = {
    id: song.artist!.id,
    name: "Hendrik Broekman",
  };

  const expectedAlbum: Album = removeUndefined({
    id: song.album!.id,
    name: "Web Samples",
    albumArtist: "Web Samples",
    artwork: undefined,
  });

  assert.equal(artist, expectedArtist);
  assert.equal(album, expectedAlbum);
});

test("can upload two songs with the same artist/album", async () => {
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
  const wrapped = testFunctions.wrap(createSong);
  const { objectMetadata, songId } = await upload("file_with_artwork.mp3");
  await wrapped(objectMetadata);
  const song = await getSong(songId);
  const file = storage.bucket().file(`testUser/song_artwork/${song?.artwork?.hash}/artwork.jpg`);
  const [exists] = await file.exists();
  assert.equal(exists, true);
});

test.run();
