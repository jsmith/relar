require("fake-indexeddb/auto");
require("./load-env");
require("./firebase");
import { test } from "uvu";
import { IndexedDb } from "./db";
import * as assert from "uvu/assert";

test("test IndexedDB basic operations", async () => {
  const db = new IndexedDb("test");
  await db.createObjectStore([]);
  await db.putValue("songs", { id: "wow", foo: "bar" });
  assert.equal(await db.getValue("songs", "wow"), { id: "wow", foo: "bar" });
  assert.equal(await db.getAllValue("songs"), [{ id: "wow", foo: "bar" }]);
  assert.equal(await db.deleteValue("songs", "wow"), "wow");
  assert.equal(await db.getValue("songs", "wow"), undefined);
});

test.only("wow", async () => {
  // const db = new IndexedDb("test");
  // await db.createObjectStore([]);
  // const items = (await db.getAllValue("songs")) as Song[];
  // const collection = clientDb("tester").songs();
  // const snapshot = await new Promise((resolve, reject) => {
  //   try {
  //     const dispose = collection.where("createdAt", ">=", Date.now()).onSnapshot((snapshot) => {
  //       dispose();
  //       resolve(snapshot);
  //     });
  //   } catch (e) {
  //     reject(e);
  //   }
  // });
  // console.log(snapshot);
  // assert.not(snapshot);
  // const lastUpdated = new Date((await db.getValue("lastUpdated", "songs")) ?? 0);
  // assert.equal(lastUpdated.valueOf(), 0);
  // collection.orderBy("updatedAt", "asc").where("updatedAt", ">=", lastUpdated);
});

test.run();
