import express from "express";
import * as functions from "firebase-functions";
import cors from "cors";
import { TypedAsyncRouter } from "@graywolfai/rest-ts-express";
import { BetaAPI, BetaSignup, MetadataAPI, Song } from "./shared/types";
import { isPasswordValid, betaSignups, adminDb } from "./shared/utils";
import * as bodyParser from "body-parser";
import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { admin } from "./admin";
import { Sentry } from "./sentry";
import { Result, ok, err } from "neverthrow";

export const app = express();
app.use(bodyParser.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://toga-4e3f5.web.app", "https://relar.app"],
  }),
);

const router = TypedAsyncRouter<MetadataAPI>(app);

const auth = admin.auth();
const db = admin.firestore();

router.post("/edit", async (req) => {
  let user;
  try {
    user = await auth.verifyIdToken(req.body.idToken);
  } catch (e) {
    return {
      type: "error",
      code: "unauthorized",
    };
  }

  const ref = adminDb(db, user.uid).songs().song(req.body.songId);

  await db.runTransaction(async () => {});

  // This is important so that we don't just pass in whatever was sent in the client
  const update: Partial<Song> = {
    title: req.body.update.title,
    artist: req.body.update.artist,
    albumArtist: req.body.update.albumArtist,
    album: req.body.update.album,
    genre: req.body.update.genre,
    year: req.body.update.year,
  };

  ref.update(update);

  return {
    type: "success what the eh",
  };
});
