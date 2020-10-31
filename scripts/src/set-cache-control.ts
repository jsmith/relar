import { admin, argv } from "./admin";

const main = async () => {
  // Optional, where to start
  const after: string | undefined = argv[2];

  const storage = admin.storage();
  const [files] = await storage.bucket().getFiles({
    // prefix: `${userId}/`,
  });

  let i = 0;
  let started = after === undefined;
  for (const file of files) {
    i++;
    console.log(`Updating ${file.name} (${i}/${files.length})`);

    if (started) {
      await file.setMetadata({
        // init to a single day
        cacheControl: "private, max-age=86400",
      });
    }

    if (file.name === after) started = true;
  }
};

main();
