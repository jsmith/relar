set -e
ROOT=$(git rev-parse --show-toplevel)

gpg --quiet --batch --yes --decrypt --passphrase="$GPG_PASSWORD" -o $ROOT/packages/functions/serviceAccountKey.json $ROOT/.github/secrets/serviceAccountKey.json.gpg
