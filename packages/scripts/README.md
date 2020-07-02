# Scripts
Just some useful scrips for doing... things!

## provision-account.ts
Creates an invite token for a single user waiting on the beta signup list. The email is passed as a command line arg which the script takes. The script itself finds a user, generates a token, saves that token in the database for reference and then sends that token their way.