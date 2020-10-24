import * as admin from "firebase-admin";
import * as serviceAccount from "../../serviceAccountKey.relar-production.json";
import * as serviceAccountStaging from "../../serviceAccountKey.relar-staging.json";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

const argv = process.argv.slice(0);
let environment: "staging" | "production" = "staging";
const index = argv.indexOf("--prod");
if (index !== -1) {
  environment = "production";
  argv.splice(index, 1);

  console.log("Init prod");
  admin.initializeApp({
    databaseURL: "https://relar-production.firebaseio.com",
    storageBucket: "relar-production.appspot.com",
    projectId: "relar-production",
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

const directory = path.join(os.homedir(), ".relar", `${environment}_songs`);

try {
  fs.mkdirSync(directory, { recursive: true });
} catch {
  // Ignore exists
}

export { admin, argv, environment, directory };
