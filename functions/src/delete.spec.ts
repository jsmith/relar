import { adminDb, deleteAllUserData } from "./shared/node/utils";
import { createAndUploadTestSong, createAndUploadPlaylist, songTwo } from "./test-utils";
import { test } from "uvu";
import assert from "uvu/assert";
import { onDeleteSong } from "./delete";
import functions from "firebase-functions-test";

test.before.each(async () => {
  await deleteAllUserData("testUser");
});

test("decrements song count and deletes song playlist", async () => {
  const db = adminDb("testUser");
  const wrapped = functions().wrap(onDeleteSong);
  const before = await createAndUploadTestSong("test1", songTwo);
  const after = await createAndUploadTestSong("test2", { ...songTwo, deleted: true });
  const playlist = await createAndUploadPlaylist("playlist name", [after]);
  await db.doc().set({ songCount: 1, firstName: "", device: "android" });
  await wrapped(
    { before: await before.get(), after: await after.get() },
    { params: { userId: "testUser" } },
  );
  await assert.equal((await db.doc().get()).data(), {
    songCount: 0,
    firstName: "",
    device: "android",
  });
  const data = await playlist.get().then((snap) => snap.data());
  await assert.equal(data, {
    name: "playlist name",
    songs: [],
    id: playlist.id,
    createdAt: data?.createdAt,
    updatedAt: data.updatedAt,
    deleted: false,
  });
});

test.run();
