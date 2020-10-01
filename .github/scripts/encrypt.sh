set -e
ROOT=$(git rev-parse --show-toplevel)

# See info here https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
gpg -o $ROOT/.github/secrets/serviceAccountKey.relar-test.json.gpg --symmetric --cipher-algo AES256 $ROOT/serviceAccountKey.relar-test.json
gpg -o $ROOT/.github/secrets/.runtimeconfig.json.gpg --symmetric --cipher-algo AES256 $ROOT/functions/.runtimeconfig.json
gpg -o $ROOT/.github/secrets/google-api-key.json.gpg --symmetric --cipher-algo AES256 $ROOT/mobile/google-api-key.json
