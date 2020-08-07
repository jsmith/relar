set -e
ROOT=$(git rev-parse --show-toplevel)

gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/packages/serviceAccountKey.relar-test.json $ROOT/.github/secrets/serviceAccountKey.relar-test.json.gpg
