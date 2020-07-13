import {
  Record,
  Number,
  String,
  Undefined,
  Literal,
  Static,
  Boolean,
  Unknown,
  Partial,
  Null,
} from "runtypes";
import * as firebase from "firebase";

export const UserDataType = Record({
  songCount: Number.Or(Undefined),
});

export type UserData = Static<typeof UserDataType>;

export const ArtworkType = Record({
  /**
   * The hash of the album artwork. This is initially derived from the songs but then ownership
   * belongs to the album after the initial artwork is inferred. This means that if the song
   * artwork is deleted that we *don't* delete the album artwork as well. This model is less
   * confusing than trying to sync the song and album artwork and is easier to implement :)
   */
  hash: String,

  /**
   * The type of the file. This will be necessary for generating the storage paths on the client.
   */
  type: Literal("png").Or(Literal("jpg")),
}).And(
  Partial({
    // For the following download URLs: If `artworkHash` is ever removed, these download URLs should
    // *also* be removed.

    /**
     * 32x32 download URL. undefined means it hasn't been calculated whereas null means it doesn't
     * exist.
     */
    artworkDownloadUrl32: String.Or(Undefined).Or(Null),
  }),
);

export type Artwork = Static<typeof ArtworkType>;

export const SongType = Record({
  /** The ID. */
  id: String,

  /**
   * The filename. We need this to actually identify the song in storage and for when we are
   * backing up their libraries this information will be used.
   */
  fileName: String,

  /** The storage download url */
  downloadUrl: String.Or(Undefined),

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
  artwork: ArtworkType.Or(Undefined),
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

  artwork: ArtworkType.Or(Undefined),
});

export type Album = Static<typeof AlbumType>;

export const BetaSignupType = Record({
  email: String,
}).And(
  Partial({
    token: String,
  }),
);

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
  "/create-account": {
    POST: {
      body: {
        token: string;
        password: string;
      };
      response:
        | Success
        | KnownError<"invalid-token" | "invalid-password" | "already-have-account">
        | UnknownError;
    };
  };
};
