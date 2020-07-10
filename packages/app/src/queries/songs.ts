import {
  userDataPath,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  userStorage,
} from "/@/shared/utils";
import { createQueryCache } from "/@/queries/cache";
import { Song } from "/@/shared/types";
import { useDefinedUser } from "/@/auth";
import { firestore, storage } from "/@/firebase";
import { getDownloadURL } from "../storage";
import { captureAndLogError } from "../utils";

const {
  useQuery: useRecentlyAddedSongsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["recent-songs", { uid: string }], Array<QueryDocumentSnapshot<Song>>>();

export const useRecentlyAddedSongs = () => {
  const user = useDefinedUser();

  return useRecentlyAddedSongsQuery(["recent-songs", { uid: user.uid }], () => {
    return (
      userDataPath(firestore, user.uid)
        .songs()
        .collection()
        .orderBy("createdAt")
        // FIXME infinite query
        .limit(10)
        .get()
        .then((r) => r.docs)
    );
  });
};

const {
  useQuery: useSongsQuery,
  // queryCache: albumsQueryCache,
} = createQueryCache<["songs", { uid: string }], Array<QueryDocumentSnapshot<Song>>>();

export const useSongs = () => {
  const user = useDefinedUser();

  return useSongsQuery(["songs", { uid: user.uid }], () =>
    userDataPath(firestore, user.uid)
      .songs()
      .collection()
      .limit(25)
      .get()
      .then((r) => r.docs),
  );
};

export const tryToGetSongDownloadUrlOrLog = async (
  user: firebase.User,
  snapshot: DocumentSnapshot<Song>,
): Promise<string | undefined> => {
  const ref = snapshot.ref;
  const data = snapshot.data();
  if (!data) {
    return;
  }

  if (data.downloadUrl) {
    return data.downloadUrl;
  }

  const result = await getDownloadURL(userStorage(storage, user).song(data.id, data.format));

  if (result.isOk()) {
    // TODO does this actually update the data?? Log snapshot and check.
    data.downloadUrl = result.value;
    // we are explicitly not awaiting this since we don't care when it finishes
    // FIXME this could fail I guess we don't care?
    ref.update({ downloadUrl: result.value });
    return result.value;
  }

  captureAndLogError(
    `Unknown error when getting song url (${user.uid}, ${data.id}): ${result.error}`,
  );
};
