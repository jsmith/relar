set -e
ROOT=$(git rev-parse --show-toplevel)

# See info here https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
gpg --symmetric --cipher-algo AES256 $ROOT/.github/secrets/serviceAccountKey.json
