import * as functions from "firebase-functions-test";
import * as admin from "firebase-admin";
import { Song, SongMetadata } from "types";
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

      const songId = uuid.v4();

      const destination = `testUser/songs/${songId}/original.mp3`;
      const metadata: SongMetadata = { customMetadata: { originalFileName: "My Song.mp3" } };
      await storage.bucket().upload(path.resolve(__dirname, "../assets/file_just_title.mp3"), {
        destination,
        metadata,
      });

      const objectMetadata = test.storage.makeObjectMetadata({
        name: destination,
        contentType: "audio/mpeg",
        metadata: (metadata as unknown) as string,
        bucket: storage.bucket().name,
      });

      await wrapped(objectMetadata);

      const song = await admin
        .firestore()
        .doc(`/userData/testUser/songs/${songId}`)
        .get()
        .then((o) => o.data());

      const user = await admin
        .firestore()
        .doc(`/userData/testUser`)
        .get()
        .then((o) => o.data());

      expect(user).toEqual({ songCount: 1 });

      const expectedSong: Song = {
        id: songId,
        title: "WalloonLilliShort",
        format: "mp3",
        liked: false,
        originalFileName: metadata.customMetadata.originalFileName,
        played: 0,
        year: "",
        artist: undefined,
        album: undefined,
        lastPlayed: undefined,
      };
      expect(song).toEqual(expectedSong);
    });
  });
});
