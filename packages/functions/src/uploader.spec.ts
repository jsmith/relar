import * as admin from "firebase-admin";
import { Song, SongMetadata, Artist, Album } from "./shared/types";
import * as uuid from "uuid";
import * as path from "path";
import { deleteAllUserData } from "./utils";
import { initTest } from "./test-utils";

const test = initTest();

// This must go *after* the `functions` init call
import { createSong, parseID3Tags, md5Hash } from "./uploader";
import { userDataPath } from "./shared/utils";

const storage = admin.storage();
const firestore = admin.firestore();

const upload = async (fileName: string) => {
  const songId = uuid.v4();

  const destination = `testUser/songs/${songId}/original.mp3`;
  const metadata: SongMetadata = { customMetadata: { originalFileName: fileName } };
  await storage.bucket().upload(path.resolve(__dirname, "../assets", fileName), {
    destination,
    metadata,
  });

  const objectMetadata = test.storage.makeObjectMetadata({
    name: destination,
    contentType: "audio/mpeg",
    metadata: (metadata as unknown) as string,
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
    .then((o): Song => o.data());
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
  return {
    id: "",
    title: "",
    format: "mp3",
    liked: false,
    originalFileName: "",
    played: 0,
    year: "",
    artist: undefined,
    album: undefined,
    lastPlayed: undefined,
    artwork: undefined,
    createdAt: admin.firestore.Timestamp.fromDate(new Date()),
    ...song,
  };
};

describe("utils", () => {
  describe("parseID3Tags", () => {
    it("can parse the tags of an mp3 file", async () => {
      const result = await parseID3Tags({
        tmpFilePath: path.resolve(__dirname, "..", "assets", "file_with_artist_album.mp3"),
      });

      if (result.isErr()) {
        throw Error("" + result.error);
      }

      const tags = result.value.id3Tag;
      expect(tags.title).toEqual("WalloonLilliShort");
      expect(tags.band).toEqual("Web Samples");
      expect(tags.artist).toEqual("Hendrik Broekman");
      expect(tags.album).toEqual("Web Samples");
    });
  });

  describe("md5Hash", () => {
    it("can hash image", async () => {
      const filePath = path.resolve(__dirname, "..", "assets", "file_with_artist_album.mp3");
      const result = await md5Hash(filePath);
      const hash = result._unsafeUnwrap();
      expect(hash).toEqual("91316d766920ee089779d22d12428c1a");
    });
  });
});

describe("functions", () => {
  describe("createSong", () => {
    afterEach(async () => {
      await deleteAllUserData(firestore, storage, "testUser");
    });

    it("works when uploading a valid song with just a title", async () => {
      const wrapped = test.wrap(createSong);
      const { objectMetadata, songId } = await upload("file_just_title.mp3");
      await wrapped(objectMetadata);

      const song = await getSong(songId);
      const user = await getUserData();

      expect(user).toEqual({ songCount: 1 });
      console.log(song?.createdAt);
      expect(song && typeof song.createdAt.toMillis()).toEqual("number");
      expect(song).toEqual(
        createTestSong({
          id: songId,
          title: "WalloonLilliShort",
          originalFileName: "file_just_title.mp3",
          createdAt: song?.createdAt,
        }),
      );
    });

    it("works when uploading a valid song with a title, artist and album", async () => {
      const wrapped = test.wrap(createSong);
      const { objectMetadata, songId } = await upload("file_with_artist_album.mp3");
      await wrapped(objectMetadata);

      const song = await getSong(songId);
      const user = await getUserData();

      expect(user).toEqual({ songCount: 1 });

      expect(song).toEqual(
        createTestSong({
          id: songId,
          title: "WalloonLilliShort",
          originalFileName: "file_with_artist_album.mp3",
          album: {
            name: "Web Samples",
            id: song?.album.id,
          },
          artist: {
            name: "Hendrik Broekman",
            id: song?.artist.id,
          },
          createdAt: song?.createdAt,
        }),
      );

      const artist = await getArtist(song?.artist.id);
      const album = await getAlbum(song?.album.id);

      const expectedArtist: Artist = {
        id: song?.artist.id,
        name: "Hendrik Broekman",
      };

      const expectedAlbum: Album = {
        id: song?.album.id,
        name: "Web Samples",
        albumArtist: "Web Samples",
        artwork: undefined,
      };

      expect(artist).toEqual(expectedArtist);
      expect(album).toEqual(expectedAlbum);
    });

    it("can upload two songs with the same artist/album", async () => {
      const wrapped = test.wrap(createSong);
      const { objectMetadata: om1, songId: s1 } = await upload("file_with_artist_album.mp3");
      await wrapped(om1);

      // This might eventually break when we check for duplicates using hashing
      const { objectMetadata: om2, songId: s2 } = await upload("file_with_artist_album.mp3");
      await wrapped(om2);

      const userData = await getUserData();
      expect(userData?.songCount).toEqual(2);

      const songs = await getSongs();
      expect(songs.length).toEqual(2);
      expect([songs[0].id, songs[1].id]).toEqual(expect.arrayContaining([s1, s2]));

      const artists = await getArtists();
      const albums = await getAlbums();
      expect(artists.length).toEqual(1);
      expect(albums.length).toEqual(1);
    });

    it("can upload artwork", async () => {
      const wrapped = test.wrap(createSong);
      const { objectMetadata, songId } = await upload("file_with_artwork.mp3");
      await wrapped(objectMetadata);
      const song = await getSong(songId);
      const file = storage.bucket().file(`testUser/song_artwork/${song?.artwork.hash}/artwork.jpg`);
      const [exists] = await file.exists();
      expect(exists).toEqual(true);
    });
  });
});
