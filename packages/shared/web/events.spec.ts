import { test } from "uvu";
import * as assert from "uvu/assert";
import { createEmitter } from "./events";

let emitter = createEmitter<{ test: [] }>();
let called = 0;
test.before.each(() => {
  emitter = createEmitter();
  called = 0;
});

test("called listener", () => {
  emitter.on("test", () => (called = 1));
  emitter.emit("test");
  assert.ok(called);
});

test("doesn't call listener after being disposed", () => {
  emitter.on("test", () => (called = 1))();
  emitter.emit("test");
  assert.not(called);
});

test("can have to identical listeners", () => {
  const listener = () => called++;
  const d1 = emitter.on("test", listener);
  const d2 = emitter.on("test", listener);
  emitter.emit("test");
  d2();
  emitter.emit("test");
  d1();
  emitter.emit("test");
  assert.equal(called, 3);
});

test.run();
