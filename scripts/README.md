# Scripts

Just some useful scrips for doing... things!

## provision-account.ts

Creates an invite token for a single user waiting on the beta signup list. The email is passed as a command line arg which the script takes. The script itself finds a user, generates a token, saves that token in the database for reference and then sends that token their way.

```
yarn x src/provision-account.ts <EMAIL>
```

## create-fake-song-data.ts

Creates 30 fakes songs for the given user.

```
yarn x src/create-fake-song-data.ts <USER_ID>
```

## add-song-duration.ts

Add durations for all songs.

```
yarn x src/add-song-duration.ts <USER_ID>
```

## add-deleted.ts

Add "deleted" to all songs.

```
yarn x src/add-deleted.ts <USER_ID>
```

## clear-data.ts

Delete all data for a user

```
yarn x src/clear-data.ts <email>
```

## ls-beta-signups.ts

List beta signups in order of least recent to most recent.

```
yarn x src/ls-beta-signups.ts
```

## add-track-disc-n-fix-year-info.ts

Add track and disc info and fix year info (string to number).

```
yarn x src/add-track-disc-n-fix-year-info.ts
```

## dl-songs.ts

Download _all_ songs to `~/.relar/<ENV>_songs/songs.json`

```
yarn x src/dl-songs.ts
```

## scratch.ts

This does... nothing important! Use it to run some analysis.

```
yarn x src/scratch.ts
```
