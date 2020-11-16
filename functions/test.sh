set -e

for FILE in src/*.spec.ts; do
  echo Testing $FILE
  npm run t $FILE
done

for FILE in src/shared/node/*.spec.ts; do
  echo Testing $FILE
  npm run t $FILE
done
