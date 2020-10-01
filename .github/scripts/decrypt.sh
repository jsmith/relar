set -e
ROOT=$(git rev-parse --show-toplevel)

gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/serviceAccountKey.relar-test.json $ROOT/.github/secrets/serviceAccountKey.relar-test.json.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/functions/.runtimeconfig.json $ROOT/.github/secrets/.runtimeconfig.json.gpg
gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/mobile/google-api-key.json $ROOT/.github/secrets/google-api-key.json.gpg
