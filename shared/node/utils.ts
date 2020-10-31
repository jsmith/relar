import * as admin from "firebase-admin";
import * as path from "path";
import { createPath } from "../universal/utils";
import {
  UserData,
  Song,
  BetaSignup,
  Playlist,
  UploadAction,
  FirestoreTimestamp,
} from "../universal/types";
import { GetFilesResponse } from "@google-cloud/storage";
import * as fs from "fs";
import * as crypto from "crypto";
import { err, ok, Result } from "neverthrow";

export const deleteCollection = async (
  collection: FirebaseFirestore.CollectionReference<unknown>,
) => {
  const docs = await collection.get().then((r) => r.docs.map((doc) => doc.ref));
  await Promise.all(docs.map((doc) => doc.delete()));
};

export const deleteAllFiles = async ([files]: GetFilesResponse) => {
  const promises = files.map((file) => {
    return file.delete();
  });

  await Promise.all(promises);
};

export const deleteAllUserData = async (userId: string) => {
  await adminDb(userId).doc().delete();
  await deleteCollection(adminDb(userId).songs());
  await deleteCollection(adminDb(userId).playlists());
  await deleteCollection(adminDb(userId).actions());

  const storage = admin.storage();

  await storage
    .bucket()
    .getFiles({
      prefix: `${userId}/`,
    })
    .then(deleteAllFiles);
};

export const adminStorage = (userId: string) => {
  const p = createPath().append(userId);
  const bucket = admin.storage().bucket();

  return {
    artworks: (hash: string, type: "jpg" | "png") => {
      const artworksPath = p.append("song_artwork").append(hash);
      const files = bucket.getFiles({ prefix: artworksPath.build() + "/" });
      return {
        all: () => files,
        original: () => bucket.file(artworksPath.append(`artwork.${type}`).build()),
        "32": () => bucket.file(artworksPath.append(`thumb@32_artwork.${type}`).build()),
      };
    },
    song: (songId: string, fileName: string) =>
      bucket.file(p.append("songs").append(songId).append(fileName).build()),
    uploadSong: (songId: string, filePath: string) =>
      bucket.upload(filePath, {
        destination: p.append("songs").append(songId).append(path.basename(filePath)).build(),
      }),
    downloadSong: ({
      songId,
      filePath,
      fileName,
    }: {
      songId: string;
      filePath: string;
      fileName: string;
    }) => adminStorage(userId).song(songId, fileName).download({ destination: filePath }),
  };
};

type CollectionReference<T> = FirebaseFirestore.CollectionReference<T>;
type DocumentReference<T> = FirebaseFirestore.DocumentReference<T>;

export const adminDb = (userId: string) => {
  const db = admin.firestore();
  const path = createPath().append("user_data").append(userId);

  return {
    userId,
    songs: () => db.collection(path.append("songs").build()) as CollectionReference<Song>,
    song: (songId: string) =>
      db.doc(path.append("songs").append(songId).build()) as DocumentReference<Song>,
    action: (actionId: string) =>
      db.doc(`user_data/${userId}/actions/${actionId}`) as DocumentReference<UploadAction>,
    actions: () =>
      db.collection(`user_data/${userId}/actions`) as CollectionReference<UploadAction>,
    doc: () => db.doc(path.build()) as DocumentReference<UserData>,
    playlists: () =>
      db.collection(`user_data/${userId}/playlists`) as CollectionReference<Playlist>,
    playlist: (id: string) =>
      db.doc(`user_data/${userId}/playlists/${id}`) as DocumentReference<Playlist>,
  };
};

export const betaSignups = (db: FirebaseFirestore.Firestore) => {
  return {
    doc: (email: string) => db.doc(`beta_signups/${email}`),
    collection: () =>
      db.collection("beta_signups") as FirebaseFirestore.CollectionReference<BetaSignup>,
  };
};

export function undefinedToDelete<T>(obj: T): T {
  for (const propName in obj) {
    if (obj[propName] === undefined) {
      obj[propName] = admin.firestore.FieldValue.delete() as any;
    }
  }

  return obj;
}

export const md5Hash = (localFilePath: string): Promise<Result<string, Error>> => {
  return new Promise<Result<string, Error>>((resolve) => {
    const md5sum = crypto.createHash("md5");
    const stream = fs.createReadStream(localFilePath);
    stream.on("data", (data) => md5sum.update(data));
    stream.on("error", (e) => resolve(err(e)));
    stream.on("end", () => resolve(ok(md5sum.digest("hex"))));
  });
};

export const serverTimestamp = () =>
  (admin.firestore.FieldValue.serverTimestamp() as unknown) as FirestoreTimestamp;
