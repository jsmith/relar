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

  const { shuffled, mappingTo, mappingFrom } = shuffleArray(array);

  array.forEach((_, i) => {
    // Check that the mapping maps from the index of the shuffled array
    // to the index of the original array
    assert.equal(shuffled[mappingTo[i]], array[i]);
    assert.equal(shuffled[i], array[mappingFrom[i]]);
  });
});

test("shuffleArray places the correct value at position 0", () => {
  const array = Array(100)
    .fill(0)
    .map((_, i) => i);

  const { shuffled, mappingTo, mappingFrom } = shuffleArray(array, 87);
  assert.equal(shuffled[0], 87);

  array.forEach((_, i) => {
    assert.equal(shuffled[mappingTo[i]], array[i]);
    // assert.equal(shuffled[i], array[mappingFrom[i]]);
  });
});

test.run();
