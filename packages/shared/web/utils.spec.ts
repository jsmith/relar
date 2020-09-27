import { test } from "uvu";
import { preventAndCall, shuffleArray, removeElementFromShuffled } from "./utils";
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
    assert.equal(shuffled[i], array[mappingFrom[i]]);
  });
});

test("removeElementFromShuffled correctly removes from maps", () => {
  const array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const original = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9 };
  [array[5], array[4]] = [array[4], array[5]];
  const { mappingFrom, mappingTo, shuffled } = removeElementFromShuffled(4, {
    shuffled: array,
    mappingFrom: { ...original, 5: 4, 4: 5 },
    mappingTo: { ...original, 4: 5, 5: 4 },
  });

  assert.equal(shuffled.length, 9);
  assert.equal(shuffled, [0, 1, 2, 3, 4, 6, 7, 8, 9]);
  assert.equal(mappingTo, { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 });
  assert.equal(mappingFrom, { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 });
});

test.run();
