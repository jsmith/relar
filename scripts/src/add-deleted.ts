import { argv, admin } from "./admin";
import { adminDb } from "./shared/node/utils";

const main = async () => {
  const userId = argv[2];

  await adminDb(admin.firestore(), userId)
    .songs()
    .get()
    .then((snapshot) =>
      Promise.all(
        snapshot.docs.map((doc) =>
          doc.ref.update({
            deleted: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        )
      )
    );
};

main();
