set -e

for FILE in src/*.spec.ts; do
  echo Testing $FILE
  npm run t $FILE
done
