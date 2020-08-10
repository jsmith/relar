set -e

for FILE in src/*.spec.ts; do
  echo Testing $FILE
  node -r esm -r esbuild-register $FILE
done
