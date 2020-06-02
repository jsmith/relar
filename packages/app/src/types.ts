import {
  Record,
  Number,
  String,
  Undefined,
  Literal,
  Static,
  Boolean,
} from "runtypes";

export const FourDigitYear = Number.withConstraint((value) => value < 10000);

export const SongType = Record({
  originalFileName: String,
  id: String,
  format: Literal("mp3"),
  title: String,
  /**
   * The artist ID.
   */
  artist: String.Or(Undefined),
  /**
   * The album ID.
   */
  album: String.Or(Undefined),
  // A four-digit year
  year: FourDigitYear.Or(Undefined),
  // The track number is stored in the last two bytes of the comment field. If the comment is 29
  // or 30 characters long, no track number can be stored.
  comment: String.Or(Undefined),
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
  name: String,
  /**
   * The artist ID.
   */
  artist: String,
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
