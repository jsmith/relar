import express from "express";
import cors from "cors";
import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";
import { MetadataAPI, Song, Album } from "./shared/types";
import * as bodyParser from "body-parser";
import { admin } from "./admin";
import { adminDb, deleteAlbumIfSingleSong, deleteArtistSingleSong } from "./utils";
import { createAlbumId } from "./shared/utils";
import * as functions from "firebase-functions";
import { Sentry } from "./sentry";

export const app = express();
app.use(Sentry.Handlers.requestHandler());
app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://toga-4e3f5.web.app",
      "https://relar.app",
      "https://staging.relar.app",
    ],
  }),
);

const router = TypedAsyncRouter<MetadataAPI>(app);

const auth = admin.auth();
const db = admin.firestore();

// FIXME this ignores the deletion of album art
// Maybe this could be a batch thing??
// It's also hard there *could* be weird race conditions
// For now, let's ignore this!!
router.post("/edit", async (req) => {
  const { body } = req;
  let user: admin.auth.DecodedIdToken;
  try {
    user = await auth.verifyIdToken(body.idToken);
  } catch (e) {
    return {
      type: "error",
      code: "unauthorized",
    };
  }

  const userId = user.uid;
  const userData = adminDb(db, user.uid);
  const ref = userData.song(body.songId);

  if (!body.update.title) {
    return {
      type: "error",
      code: "missing-title",
    };
  }

  // This is important so that we don't just pass in whatever was sent in the client
  const update: Partial<Song> = {
    title: body.update.title,
    genre: body.update.genre,
    year: body.update.year,
    albumName: body.update.albumName,
    albumArtist: body.update.albumArtist,
    artist: body.update.artist,
    albumId: createAlbumId(body.update),
  };

  console.log(`Update for ${body.songId} -> ${JSON.stringify(update)}`);

  return await db.runTransaction(async (transaction) => {
    const writes: Array<undefined | (() => void)> = [];
    const song = await transaction.get(ref).then((doc) => doc.data());
    if (!song) {
      return {
        type: "error",
        code: "song-does-not-exist",
      };
    }

    const newAlbumId = createAlbumId(body.update);
    const oldAlbumId = createAlbumId(song);

    // If either the album artist changed or the artist changed, we need to place the song in a new album
    // This album may or may not exist
    // Additionally, the old album may now be empty, meaning that we should probably delete it...
    if (newAlbumId !== oldAlbumId) {
      console.info(
        `New album ID (${newAlbumId}) is different from the old album ID (${oldAlbumId})`,
      );
      writes.push(
        await deleteAlbumIfSingleSong({
          db,
          userId,
          transaction,
          albumId: oldAlbumId,
        }),
      );

      const albumSnap = await transaction.get(userData.album(newAlbumId));

      let newAlbum = albumSnap.data();

      if (!newAlbum) {
        const localCopy: Album = (newAlbum = {
          id: newAlbumId,
          albumArtist: body.update.albumArtist,
          album: body.update.albumName,
          artwork: song.artwork,
        });

        console.log(`Creating new album (${JSON.stringify(localCopy)})`);
        writes.push(() => transaction.create(albumSnap.ref, localCopy));
      }
    }

    const oldArtistName = song.artist;
    const newArtistName = body.update.artist;
    if (oldArtistName != newArtistName) {
      console.info(
        `New artist name (${newArtistName}) is different from the old artist name (${oldArtistName})`,
      );
      if (oldArtistName) {
        writes.push(
          await deleteArtistSingleSong({ db, artist: oldArtistName, userId, transaction }),
        );
      }

      if (newArtistName) {
        const artistSnap = await transaction.get(userData.artist(newArtistName));
        let newArtist = artistSnap.data();

        if (!newArtist) {
          const localCopy = (newArtist = {
            name: newArtistName,
          });

          console.info(`Creating new artist (${newArtistName})`);
          writes.push(() => transaction.create(artistSnap.ref, localCopy));
        }
      }
    }

    transaction.update(ref, update);
    writes.forEach((write) => write && write());

    return {
      type: "success",
    };
  });
});

app.use(Sentry.Handlers.errorHandler());

export const editApp = functions.https.onRequest(app);
