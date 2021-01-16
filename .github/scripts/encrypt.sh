set -e
ROOT=$(git rev-parse --show-toplevel)

# See info here https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/serviceAccountKey.relar-test.json.gpg --symmetric --cipher-algo AES256 $ROOT/serviceAccountKey.relar-test.json
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/.runtimeconfig.json.gpg --symmetric --cipher-algo AES256 $ROOT/functions/.runtimeconfig.json
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/google-api-key.json.gpg --symmetric --cipher-algo AES256 $ROOT/app/google-api-key.json
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/relar-key.jks.gpg --symmetric --cipher-algo AES256 $ROOT/app/android/relar-key.jks
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/.env.production.gpg --symmetric --cipher-algo AES256 $ROOT/app/.env.production
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/.env.staging.gpg --symmetric --cipher-algo AES256 $ROOT/app/.env.staging
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/.env.development.gpg --symmetric --cipher-algo AES256 $ROOT/app/.env.development
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/GoogleService-Info.plist.gpg --symmetric --cipher-algo AES256 $ROOT/app/ios/App/App/GoogleService-Info.plist
gpg --batch --yes --passphrase $GPG_PASSWORD -o $ROOT/.github/secrets/google-services.json.gpg --symmetric --cipher-algo AES256 $ROOT/app/android/app/google-services.json
