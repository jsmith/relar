# Scripts

Just some useful scrips for doing... things!

## provision-account.ts

Creates an invite token for a single user waiting on the beta signup list. The email is passed as a command line arg which the script takes. The script itself finds a user, generates a token, saves that token in the database for reference and then sends that token their way.

```
NODE_PRESERVE_SYMLINKS=1 npx ts-node src/provision-accounts.ts <EMAIL>
```

## create-fake-song-data.ts

Creates 30 fakes songs for the given user.

```
NODE_PRESERVE_SYMLINKS=1 npx ts-node src/create-fake-song-data.ts <USER_ID>
```

## add-song-duration.ts

Add durations for all songs.

```
NODE_PRESERVE_SYMLINKS=1 npx ts-node src/add-song-duration.ts <USER_ID>
```

## add-deleted.ts

Add "deleted" to all songs.

```
NODE_PRESERVE_SYMLINKS=1 npx ts-node src/add-deleted.ts <USER_ID>
```

## clear-data.ts

Delete all data for a user

```
NODE_PRESERVE_SYMLINKS=1 npx ts-node src/clear-data.ts <email>
```
