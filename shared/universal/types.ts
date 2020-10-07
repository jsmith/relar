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
  Array,
} from "runtypes";

// TODO update updatedAt timestamps

export const Timestamp = Unknown.withGuard((x): x is firebase.firestore.Timestamp => true);

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

    /** 64x64 download URL. */
    artworkDownloadUrl64: String.Or(Undefined).Or(Null),

    /** 128x128 download URL. */
    artworkDownloadUrl128: String.Or(Undefined).Or(Null),

    /** 128x128 download URL. */
    artworkDownloadUrl256: String.Or(Undefined).Or(Null),
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

  /** The duration of the song in milliseconds. */
  duration: Number,

  /**
   * The artist name. This is a unique value.
   */
  artist: String.Or(Undefined),

  /**
   * The album name.
   */
  albumName: String.Or(Undefined),

  /**
   * The album ID for querying purposes.
   */
  albumId: String.Or(Undefined),

  /**
   * The album artist.
   */
  albumArtist: String.Or(Undefined),

  /**
   * A four-digit year.
   */
  year: String.Or(Undefined),

  /**
   * The genre.
   */
  genre: String.Or(Undefined),

  /**
   * Whether this person has "liked" this song
   */
  liked: Boolean.Or(Undefined),

  /** When the song was liked. This should be updated every time that it is liked. */
  whenLiked: Timestamp.Or(Undefined),

  /**
   * The # of times you've played this song.
   */
  played: Number.Or(Undefined),

  /**
   * The last time you played a song.
   */
  lastPlayed: Timestamp.Or(Undefined),

  /**
   * When the song was uploaded.
   */
  createdAt: Timestamp,

  /**
   * The hash of the song artwork.
   */
  artwork: ArtworkType.Or(Undefined),

  /** When the song was last updated. */
  updatedAt: Timestamp,

  deleted: Boolean,
});

export type Song = Static<typeof SongType>;

export const AlbumType = Record({
  /**
   * The ID. This is a concatenation of the album artist (or artist — this is very important) and album name.
   * For example, if the album name was "Wow" and the album artist was "Jack", the resulting id
   * would be "Jack<<<<<<<Wow".
   */
  id: String,
  albumArtist: String.Or(Undefined),
  album: String.Or(Undefined),
  artwork: ArtworkType.Or(Undefined),

  /** When the album was last updated. */
  updatedAt: Timestamp,

  deleted: Boolean,
});

export type Album = Static<typeof AlbumType>;

export const BetaDeviceType = Literal("ios").Or(Literal("android")).Or(Literal("none"));

export type BetaDevice = Static<typeof BetaDeviceType>;

export const BetaSignupType = Record({
  email: String,
  firstName: String,
  device: BetaDeviceType,
  /** When the user signed up. */
  createdAt: Timestamp,
}).And(
  Partial({
    token: String,
  }),
);

export type BetaSignup = Static<typeof BetaSignupType>;

export const ArtistType = Record({
  /** The id of the artist. Just the name for now. */
  id: String,

  /**
   * The name of the artist. This is also the ID since artist names must be unique.
   */
  name: String,

  /** When the artist was last updated. */
  updatedAt: Timestamp,

  deleted: Boolean,
});

export type Artist = Static<typeof ArtistType>;

export const PlaylistType = Record({
  /** The ID of the playlist. */
  id: String,

  /**
   * The name of the playlist.
   */
  name: String,

  /** The songs IDs. */
  songs: Array(
    Record({
      /** The ID of the song. */
      songId: String,
      /**
       * The ID of this element in the array. This is extremely useful as the songId property does
       * not need to be unique.
       */
      id: String,
    }),
  ).Or(Undefined),

  /** When the playlist was created. */
  createdAt: Timestamp,

  /** When the playlist was last updated. */
  updatedAt: Timestamp,

  deleted: Boolean,
});

export type Playlist = Static<typeof PlaylistType>;

export const UserFeedbackType = Record({
  id: String,
  /**
   * The actual feedback.
   */
  feedback: String,
  type: Literal("issue").Or(Literal("idea")).Or(Literal("other")),
  createdAt: Timestamp,
});

export type UserFeedback = Static<typeof UserFeedbackType>;

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
        firstName: string;
        device: BetaDevice;
        email: string;
      };
      response:
        | Success
        | KnownError<
            | "already-on-list"
            | "invalid-email"
            | "already-have-account"
            | "invalid-name"
            | "invalid-device"
          >
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

export type MetadataAPI = {
  "/edit": {
    POST: {
      body: {
        idToken: string;
        songId: string;
        update: {
          title: string;
          artist: string;
          albumArtist: string;
          albumName: string;
          genre: string;
          year: string;
          // FIXME
          // track?: number;
          // totalTracks?: number;
          // disc?: number;
          // totalDiscs?: number;
          // explicit?: boolean;
        };
      };
      response:
        | Success
        | KnownError<"unauthorized" | "song-does-not-exist" | "missing-title">
        | UnknownError;
    };
  };
};
