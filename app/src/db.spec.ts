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

test.run();
