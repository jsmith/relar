import * as fs from "fs";
import { argv, admin } from "./admin";
import { adminStorage, adminDb } from "./shared/admin-utils";
import { getMp3Duration } from "../../functions/src/get-mp3-duration";

const main = async () => {
  const userId = argv[2];

  const docs = await adminDb(admin.firestore(), userId)
    .songs()
    .get()
    .then((snapshot) => snapshot.docs);

  for (const doc of docs) {
    const destination = __dirname + "/tmp.mp3";
    try {
      await adminStorage(admin.storage(), userId).downloadSong({
        fileName: doc.data().fileName,
        songId: doc.id,
        filePath: destination,
      });

      const buffer = fs.readFileSync(destination);
      const duration = await getMp3Duration(buffer);

      // adminDb(admin.firestore()).song(d)
      console.log(`Updating the duration of "${doc.id}" to ${duration}!`);
      await doc.ref.update({ duration });
    } finally {
      if (fs.existsSync(destination)) {
        fs.unlinkSync(destination);
      }
    }
  }
};

main();
