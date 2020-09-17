set -e

for FILE in src/shared/web/*.spec.ts; do
  echo Testing $FILE
  node -r esm -r esbuild-register $FILE
done
