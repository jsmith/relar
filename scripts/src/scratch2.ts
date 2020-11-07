import { admin } from "./admin";

const main = async () => {
  const bucket = admin.storage().bucket();
  // Tets 74eae956-6929-47ac-a56d-15092975f555/
  const [files] = await bucket.getFiles({
    prefix: `ykzEuir4Y8gJtNQ9wn00KDa23tt2/feedback/9c9b79fc-20f3-40fb-bba1-6cf2e8de711c/`,
  });
  const responses = await Promise.all(
    files.map((file) =>
      file.getSignedUrl({
        action: "read",
        // 5 days
        // Maximum is 7 days but I don't want this to error it I times by 7
        // And 5 works well enough
        expires: Date.now() + 1000 * 60 * 60 * 24 * 5,
      }),
    ),
  );

  const links = responses.map(([response]) => response);
  console.log(links);
};

main();
