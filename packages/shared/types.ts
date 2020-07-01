import { Record, Number, String, Undefined, Literal, Static, Boolean, Unknown } from "runtypes";
import * as firebase from "firebase";

/**
 * Before getting into this file make sure you understand ID3 metadata.
 */

export const SongMetadataType = Record({
  customMetadata: Record({
    originalFileName: String,
  }),
});

export type SongMetadata = Static<typeof SongMetadataType>;

export const UserDataType = Record({
  songCount: Number.Or(Undefined),
});

export type UserData = Static<typeof UserDataType>;

export const SongType = Record({
  /**
   * The original filename. This will be important for backups. A user probably expects the same
   * filename as when they uploaded. Maybe not though??
   */
  originalFileName: String,

  /** The ID. */
  id: String,

  /** Eventually, we might be able to support different file formats. */
  format: Literal("mp3"),

  /** The song title. */
  title: String,

  /**
   * The artist.
   */
  artist: Record({
    /** The ID. */
    id: String,
    name: String,
  }).Or(Undefined),

  /**
   * The album.
   */
  album: Record({
    /** The ID. */
    id: String,
    name: String,
  }).Or(Undefined),

  /**
   * A four-digit year.
   */
  year: String.Or(Undefined),

  /**
   * Whether this person has "liked" this song
   */
  liked: Boolean.Or(Undefined),

  /**
   * The # of times you've played this song.
   */
  played: Number.Or(Undefined),

  /**
   * The last time you played a song.
   */
  lastPlayed: Number.Or(Undefined),

  /**
   * When the song was uploaded
   */
  createdAt: Unknown.withGuard((x): x is firebase.firestore.Timestamp => true),

  /**
   * The hash of the song artwork.
   */
  artworkHash: String.Or(Undefined),

  // For the following download URLs: If `artworkHash` is ever removed, these download URLs should
  // *also* be removed.

  /**
   * 32x32 download URL.
   */
  artworkDownloadUrl32: String.Or(Undefined),
});

export type Song = Static<typeof SongType>;

export const AlbumType = Record({
  /** The ID. */
  id: String,

  /**
   * The name of the album.
   */
  name: String,

  /**
   * The album artist.
   */
  albumArtist: String,

  /**
   * The hash of the album artwork. This is initially derived from the songs but then ownership
   * belongs to the album after the initial artwork is inferred. This means that if the song
   * artwork is deleted that we *don't* delete the album artwork as well. This model is less
   * confusing than trying to sync the song and album artwork and is easier to implement :)
   */
  artworkHash: String.Or(Undefined),
});

export type Album = Static<typeof AlbumType>;

export const BetaSignupType = Record({
  email: String,
});

export type BetaSignup = Static<typeof BetaSignupType>;

export const ArtistType = Record({
  /** The ID. */
  id: String,

  /**
   * The name of the artist.
   */
  name: String,
});

export type Artist = Static<typeof ArtistType>;

export type SuccessWithData<Data> = {
  type: "success";
  data: Data;
};

export type Success = {
  type: "success";
};

export type KnownError<Code extends string> = { type: "error"; code: Code };

export type UnknownError = { type: "error"; code: "unknown" };

export type BetaAPI = {
  "/beta-signup": {
    POST: {
      body: {
        email: string;
      };
      response:
        | Success
        | KnownError<"already-on-list" | "invalid-email" | "already-have-account">
        | UnknownError;
    };
  };
};
