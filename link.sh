DIR=$(dirname $0)
echo $DIR

rm -f $DIR/functions/src/shared
rm -f $DIR/app/src/shared
rm -f $DIR/mobile/src/shared
ln -s ../../shared $DIR/functions/src/shared
ln -s ../../shared $DIR/app/src/shared
ln -s ../../shared $DIR/mobile/src/shared
