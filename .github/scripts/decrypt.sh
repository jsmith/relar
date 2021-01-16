set -e
ROOT=$(git rev-parse --show-toplevel)

gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/serviceAccountKey.relar-test.json $ROOT/.github/secrets/serviceAccountKey.relar-test.json.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/functions/.runtimeconfig.json $ROOT/.github/secrets/.runtimeconfig.json.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/app/google-api-key.json $ROOT/.github/secrets/google-api-key.json.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/app/android/app/relar-key.jks $ROOT/.github/secrets/relar-key.jks.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/app/.env.production $ROOT/.github/secrets/.env.production.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/app/.env.staging $ROOT/.github/secrets/.env.staging.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/app/.env.development $ROOT/.github/secrets/.env.development.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/app/ios/App/App/GoogleService-Info.plist $ROOT/.github/secrets/GoogleService-Info.plist.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/app/android/app/google-services.json $ROOT/.github/secrets/google-services.json.gpg

# For some reason Android looks for the release.keystore file in BOTH of these locations
# I can't find any references to this issue so uh let's just copy the file
# It works so I'm not going to question it
cp $ROOT/app/android/app/relar-key.jks $ROOT/app/android/relar-key.jks
