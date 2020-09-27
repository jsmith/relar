set -e

for FILE in src/shared/web/*.spec.ts; do
  echo Testing $FILE
  node --preserve-symlinks-main --preserve-symlinks -r esm -r esbuild-register $FILE
done
