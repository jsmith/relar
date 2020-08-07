import * as admin from "firebase-admin";
import * as serviceAccount from "../../serviceAccountKey.toga-4e3f5.json";
import * as serviceAccountStaging from "../../serviceAccountKey.relar-staging.json";

const argv = process.argv.slice(0);
if (argv.includes("--prod")) {
  argv.splice(2, 1);
  argv.splice(argv.indexOf("--prod"), 1);

  console.log("Init prod");
  admin.initializeApp({
    databaseURL: "https://toga-4e3f5.firebaseio.com",
    storageBucket: "toga-4e3f5.appspot.com",
    projectId: "toga-4e3f5",
    credential: admin.credential.cert(serviceAccount as any),
  });
} else {
  console.log("Init staging");
  admin.initializeApp({
    databaseURL: "https://relar-staging.firebaseio.com",
    storageBucket: "relar-staging.appspot.com",
    projectId: "relar-staging",
    credential: admin.credential.cert(serviceAccountStaging as any),
  });
}

export { admin, argv };
