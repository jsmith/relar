import { test } from "uvu";
import { preventAndCall, shuffleArray } from "./utils";
import * as assert from "uvu/assert";

test("preventAndCall calls preventDefault", () => {
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

test("shuffleArray returns the correct mapping", () => {
  const array = Array(20)
    .fill(0)
    .map((_, i) => i);

  const { shuffled, mappingTo } = shuffleArray(array);

  array.forEach((_, i) => {
    // Check that the mapping maps from the index of the shuffled array
    // to the index of the original array
    assert.ok(shuffled[mappingTo[i]] === array[i]);
  });
});

test.run();
