set -e

for FILE in src/*.spec.ts; do
  echo Testing $FILE
  GOOGLE_APPLICATION_CREDENTIALS=../serviceAccountKey.relar-test.json node --preserve-symlinks --preserve-symlinks-main -r esm -r esbuild-register $FILE
done
