import { useMemo, useState, useEffect } from 'react';
import { firestore } from '~/firebase';
import { useUser } from '~/auth';
import { ResultAsync, ok } from 'neverthrow';
import { Artist, Album } from '~/types';
import * as Sentry from '@sentry/browser';

export const useUserData = () => {
  const { user } = useUser();

  if (!user) {
    throw Error('USER NOT DEFINED THIS SHOULD NOT HAPPEN haha');
  }

  return useMemo(() => firestore.collection('userData').doc(user.uid), []);
};

export const get = <T extends firebase.firestore.DocumentData>(
  doc: firebase.firestore.DocumentReference<T>,
): ResultAsync<firebase.firestore.DocumentSnapshot<T>, Error> => {
  // TODO test error idk if e is an Error
  return ResultAsync.fromPromise(doc.get(), (e) => e as Error);
};

export const useArtist = (album: Album) => {
  const userData = useUserData();
  const [artist, setArtist] = useState<Artist>();

  useEffect(() => {
    // TODO validation
    get(userData.collection('artists').doc(album.artist)).match(
      (doc) => {
        console.info(`Found artist (${album.artist}): ` + doc.data());
        setArtist({ ...doc.data(), id: doc.id } as Artist);
      },
      (e) => {
        console.warn('Unable to find artist: ' + album.id);
        Sentry.captureException(e);
      },
    );
  }, [album.id]);

  return artist;
};
