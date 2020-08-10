import { test } from "uvu";
import { preventAndCall } from "./utils";
import * as assert from "uvu/assert";

test("watcher", () => {
  let calledPreventDefault = false;
  let called = false;
  const f = preventAndCall(() => {
    called = true;
  });
  f({ preventDefault: () => (calledPreventDefault = true) });
  assert.ok(calledPreventDefault);
  assert.ok(called);
  // assert.ok(false);
});

test.run();
