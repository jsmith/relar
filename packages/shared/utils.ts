// at least one number, one lowercase and one uppercase letter
// at least six characters
export const isPasswordValid = (password: string) => {
  return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(password);
};

const createPath = (parts: string[] = []) => {
  return {
    append: (part: string) => createPath([...parts, part]),
    build: () => parts.join("/"),
  };
};

export const userDataPath = (db: FirebaseFirestore.Firestore, userId: string) => {
  const path = createPath().append("user_data").append(userId);

  return {
    songs: () => {
      const songs = path.append("songs");
      return {
        song: (songId: string) => db.doc(songs.append(songId).build()),
        collection: () => db.collection(songs.build()),
      };
    },
    albums: () => {
      const albums = path.append("albums");
      return {
        album: (albumId: string) => db.doc(albums.append(albumId).build()),
        collection: () => db.collection(albums.build()),
      };
    },
    artists: () => {
      const artists = path.append("artists");
      return {
        artist: (artistId: string) => db.doc(artists.append(artistId).build()),
        collection: () => db.collection(artists.build()),
      };
    },
    doc: () => db.doc(path.build()),
  };
};

export const betaSignups = (db: FirebaseFirestore.Firestore) => {
  return {
    doc: (email: string) => db.doc(`beta_signups/${email}`),
    collection: () => db.collection("beta_signups"),
  };
};
