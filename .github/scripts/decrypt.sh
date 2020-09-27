set -e
ROOT=$(git rev-parse --show-toplevel)

gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/packages/serviceAccountKey.relar-test.json $ROOT/.github/secrets/serviceAccountKey.relar-test.json.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/packages/functions/.runtimeconfig.json $ROOT/.github/secrets/.runtimeconfig.json.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/packages/mobile/google-api-key.json $ROOT/.github/secrets/google-api-key.json.gpg
