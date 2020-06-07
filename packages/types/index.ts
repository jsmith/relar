import {
  Record,
  Number,
  String,
  Undefined,
  Literal,
  Static,
  Boolean,
} from "runtypes";

export const SongMetadataType = Record({
  customMetadata: Record({
    originalFileName: String,
  }),
});

export type SongMetadata = Static<typeof SongMetadataType>;

export const UserDataType = Record({
  songCount: Number.Or(Undefined),
});

// export const decode = <T>(record: Record<T extends { [_: string]: Runtype }, false>) => {
//   record.check()
// }

export type UserData = Static<typeof UserDataType>;

export const SongType = Record({
  originalFileName: String,
  id: String,
  format: Literal("mp3"),
  title: String,
  /**
   * The artist.
   */
  artist: Record({
    id: String,
    name: String,
  }).Or(Undefined),

  /**
   * The album.
   */
  album: Record({
    id: String,
    name: String,
  }).Or(Undefined),

  // A four-digit year
  year: String.Or(Undefined),
  // Whether this person has "liked" this song
  liked: Boolean.Or(Undefined),

  // TODO implement
  /**
   * The # of times you've played this song.
   */
  played: Number.Or(Undefined),

  // TODO implement
  /**
   * The last time you played a song.
   */
  lastPlayed: Number.Or(Undefined),
});

export type Song = Static<typeof SongType>;

export const AlbumType = Record({
  id: String,
  /**
   * The name of the album.
   */
  name: String,
  /**
   * The artist.
   */
  artist: Record({
    id: String,
    name: String,
  }).Or(Undefined),
});

export type Album = Static<typeof AlbumType>;

export const ArtistType = Record({
  id: String,
  /**
   * The name of the artist.
   */
  name: String,
});

export type Artist = Static<typeof ArtistType>;
