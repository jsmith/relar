import { admin, argv } from "./admin";
import { adminDb, serverTimestamp } from "./shared/node/utils";
import { Song } from "./shared/universal/types";

const main = async () => {
  const email = argv[2];
  const hash = argv[3];
  const user = await admin.auth().getUserByEmail(email);

  const songs = await adminDb(user.uid).songs().where("artwork.hash", "==", hash).get();
  console.log(`Found ${songs.docs.length} songs`);
  for (const song of songs.docs) {
    const data = song.data();
    console.log(`Updating ${data.title} (${data.id})`);
    if (!data?.artwork) {
      console.warn("No artwork found...");
      return;
    }

    const update: Partial<Song> = {
      updatedAt: serverTimestamp(),
      artwork: {
        // This removes all of the cached download URLs
        hash: data.artwork.hash,
        type: data.artwork.type,
      },
    };

    await song.ref.update(update);
  }
};

main();
