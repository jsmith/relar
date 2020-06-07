import * as functions from "firebase-functions-test";
import * as admin from "firebase-admin";
import { Song, SongMetadata, Artist, Album } from "types";
// import * as serviceAccount from "./serviceAccountKey.json";
import * as uuid from "uuid";
import * as path from "path";

// TODO test bucket
const test = functions(
  {
    databaseURL: "https://toga-4e3f5.firebaseio.com",
    storageBucket: "toga-4e3f5.appspot.com",
    projectId: "toga-4e3f5",
  },
  path.join(__dirname, "serviceAccountKey.json"),
);

// This must go *after* the `functions` init call
import { createSong } from "./index";

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

const getAlbum = (albumId: string) => {
  return admin
    .firestore()
    .doc(`/userData/testUser/albums/${albumId}`)
    .get()
    .then((o) => o.data());
};

const getArtist = (artistId: string) => {
  return admin
    .firestore()
    .doc(`/userData/testUser/artists/${artistId}`)
    .get()
    .then((o) => o.data());
};

const getSong = (songId: string) => {
  return admin
    .firestore()
    .doc(`/userData/testUser/songs/${songId}`)
    .get()
    .then((o) => o.data());
};

const getUserData = () => {
  return admin
    .firestore()
    .doc(`/userData/testUser`)
    .get()
    .then((o) => o.data());
};

describe("functions", () => {
  describe("createSong", () => {
    afterEach(async () => {
      await firestore.doc("userData/testUser").delete();
      const [files] = await storage.bucket().getFiles({
        prefix: "testUser/",
      });

      const promises = files.map((file) => {
        return file.delete();
      });

      await Promise.all(promises);
    });

    it("works when uploading a valid song with just a title", async () => {
      const wrapped = test.wrap(createSong);
      const { objectMetadata, songId } = await upload("file_just_title.mp3");
      await wrapped(objectMetadata);

      const song = await getSong(songId);
      const user = await getUserData();

      expect(user).toEqual({ songCount: 1 });

      const expectedSong: Song = {
        id: songId,
        title: "WalloonLilliShort",
        format: "mp3",
        liked: false,
        originalFileName: "file_just_title.mp3",
        played: 0,
        year: "",
        artist: undefined,
        album: undefined,
        lastPlayed: undefined,
      };

      expect(song).toEqual(expectedSong);
    });

    it("works when uploading a valid song with a title, artist and album", async () => {
      const wrapped = test.wrap(createSong);
      const { objectMetadata, songId } = await upload("file_with_artist_album.mp3");
      await wrapped(objectMetadata);

      const song = await getSong(songId);
      const user = await getUserData();

      expect(user).toEqual({ songCount: 1 });

      const expectedSong: Song = {
        id: songId,
        title: "WalloonLilliShort",
        format: "mp3",
        liked: false,
        originalFileName: "file_with_artist_album.mp3",
        played: 0,
        year: "",
        artist: song?.artist,
        album: song?.album,
        lastPlayed: undefined,
      };

      expect(song).toEqual(expectedSong);
      expect(song?.album?.name).toEqual("Web Samples");
      expect(song?.artist?.name).toEqual("Hendrik Broekman");

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
      };

      expect(artist).toEqual(expectedArtist);
      expect(album).toEqual(expectedAlbum);
    });
  });
});
