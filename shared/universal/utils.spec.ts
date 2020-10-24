import { test } from "uvu";
import * as assert from "uvu/assert";
import { removedUndefinedValues } from "./utils";

test("test removedUndefinedValues", async () => {
  assert.equal(removedUndefinedValues({ foo: "bar", wow: undefined }), { food: "bar" });
  assert.equal(removedUndefinedValues({ wow: undefined }), {});
});

test.run();
