import firebase from "firebase/app";
import { useDefinedUser } from "./auth";
import { useMemo } from "react";
import { Result, ok, err } from "neverthrow";
import { clientStorage } from "../universal/utils";

export type StorageErrorCode =
  | "storage/unknown" // An unknown error occurred.
  | "storage/object-not-found" // No object exists at the desired reference.
  | "storage/bucket-not-found" // No bucket is configured for Cloud Storage
  | "storage/project-not-found" // No project is configured for Cloud Storage
  | "storage/quota-exceeded" // Quota on your Cloud Storage bucket has been exceeded. If you're on the free tier, upgrade to a paid plan. If you're on a paid plan, reach out to Firebase support.
  | "storage/unauthenticated" // User is unauthenticated, please authenticate and try again.
  | "storage/unauthorized" // User is not authorized to perform the desired action, check your security rules to ensure they are correct.
  | "storage/retry-limit-exceeded" // The maximum time limit on an operation (upload, download, delete, etc.) has been excceded. Try uploading again.
  | "storage/invalid-checksum" // File on the client does not match the checksum of the file received by the server. Try uploading again.
  | "storage/canceled" // User canceled the operation.
  | "storage/invalid-event-name" // Invalid event name provided. Must be one of [`running`, `progress`, `pause`]
  | "storage/invalid-url" // Invalid URL provided to refFromURL(). Must be of the form: gs://bucket/object or https://firebasestorage.googleapis.com/v0/b/bucket/o/object?token=<TOKEN>
  | "storage/invalid-argument" // The argument passed to put() must be `File`, `Blob`, or `UInt8` Array. The argument passed to putString() must be a raw, `Base64`, or `Base64URL` string.
  | "storage/no-default-bucket" // No bucket has been set in your config's storageBucket property.
  | "storage/cannot-slice-blob" // Commonly occurs when the local file has changed (deleted, saved again, etc.). Try uploading again after verifying that the file hasn't changed.
  | "storage/server-file-wrong-size"; // File on the client does not match the size of the file recieved by the server. Try uploading again.

export const useUserStorage = () => {
  const user = useDefinedUser();
  return useMemo(() => clientStorage(firebase.storage(), user.uid), [user]);
};

/**
 * Typesafe getDownloadURL implementation.
 */
export const getDownloadURL = async (
  ref: firebase.storage.Reference,
): Promise<Result<string, StorageErrorCode>> => {
  try {
    return ok(await ref.getDownloadURL());
  } catch (e) {
    return err(e.code as StorageErrorCode);
  }
};
