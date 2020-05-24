# Toga
The next best place to store your music collection.

## Why
With the deprecation of [Google Play Music](https://www.digitaltrends.com/music/what-happens-to-google-play-music-youtube-music/), many people – including myself – have been left to fend for ourselves. Although Google is migrating our libraries from `Play Music` to `YouTube Music`, many features present in `Play Music` have not been – and likely will not be – implemented in `YouTube Music`.

## Competitors
### Phonograph
[Phonograph](https://github.com/kabouzeid/Phonograph) is a material design local music android app.

#### Pros
- Well designed.
- Open source.

#### Cons
- Can only play local files.
- Only for Android.

### Shuttle Music Player
[Suttle Music Player](https://www.shuttlemusicplayer.com/) is very similar to `Phonograph` above.

### Muzio Player
[Muzio Player](https://play.google.com/store/apps/details?id=com.shaiban.audioplayer.mplayer) is similar to `Phonograph` above but is a truly stunning mobile app.

> The app is visually stunning. I like it more than what’s left of Google Play Music, and so much more than Spotify, which is a Plain Jane in comparison. You can choose between included themes in the app, but when you play a song, the background will sync to the color palette of the album art. [florenceion](https://florenceion.com/2020/04/14/ask-flo-alternative-to-google-play-music/)

### Plex
[Plex]

### TIDAL
[TIDAL](https://tidal.com/about) is a hi-fi music streaming service. The app lets you download music for offline listening, create playlists, listen to existing playlists, and streams music at 16-bit, 44.1kHz FLAC or 24-bit, 96kHz MQA. It doesn’t get any better than that, although Deezer’s hi-fi option comes close. You can’t upload any of your own music, but it does everything else right.

## Requirements
- The ability to upload single tracks and to complete bulk uploads.
- The ability to upload multiple different formats, including `wav` and `mp3`.
- The ability to stream on the web and on your mobile device.
- The ability to explicitly download songs on your mobile device.
- Categorization features including `Artist`, `Genre`, `Album`, `Playlist`, and `Song`.
- Generated playlists for most-played, liked, recently added, etc.
- Batch create playlist.
- File metadata editor.
- The ability to cache music on the mobile app to preserve mobile data.
- The ability to shuffle songs, playlists, albums, artists, etc.
- Sleep timer.
- Hi-fi streaming.
- Builtin EQ.
- Chromecast.
- Backup library.
- A smart shuffle that plays similar songs.
- Settings like auto-download.
- Music player with next/previous/play/pause/shuffle/repeat stuff.
- Search ability.
- Beta registration, regular registration and sign in.

## V1 Roadmap
What are the most essential features of `Google Play Music`? The ability to sync an entire `mp3` library between devices. That is the primary goal of this application.

### Constraints
- We will only support `mp3`.
- No chromecast, backups, EQ, hi-fi streaming, sleep timer or smart shuffler.

### Tiers
#### Free
- Limit storage
- No download locally
- No backups
- Mobile phone caching

### Paid ($5/month)
- Larger limit
- Local downloads
- 2 backups per year
- Chromecast

### Paid Pro ($10/month)
- Even larger limit
- Backup tool
- Built in EQ [future]
- More file format support [future]
- Stream hi-fi [future]

## Tech Stack
### Frontend
- `React` for JavaScript framework.
- `Snowpack` for dev and bundling.
- `Firebase Hosting` for deployment.

### Mobile
- `React Native` for the app.

### Backend
- `Firebase Cloud Storage` for audio storage.
- `Firebase Authentication` for user management.

## Resources
- [https://www.cleveroad.com/blog/how-to-create-a-music-streaming-app](How to Make a Music Streaming App: Business Model, Features, and Cost) [Design, Cost]