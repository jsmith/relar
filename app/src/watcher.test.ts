import { test } from "uvu";
import * as assert from "uvu/assert";
import "./load-env";
import { useFirebaseUpdater } from "./watcher";
import { renderHook, act } from "@testing-library/react-hooks";

const create = (name: string) =>
  ({
    ref: { path: "test/ref" },
    data: () => ({ name }),
  } as firebase.firestore.QueryDocumentSnapshot<{ name: string }>);

test("watcher returns a default value", () => {
  const snap = create("a");
  const { result } = renderHook(() => useFirebaseUpdater(snap));
  assert.equal(result.current[0].name, "a");
});

test("returns the cached value", () => {
  const a = create("a");
  const b = create("b");
  renderHook(() => useFirebaseUpdater(a));
  const { result } = renderHook(() => useFirebaseUpdater(b));
  assert.equal(result.current[0].name, "a");
});

test("can update values", () => {
  const a = create("a");
  const b = create("b");
  const hookA = renderHook(() => useFirebaseUpdater(a));
  const hookB = renderHook(() => useFirebaseUpdater(b));
  hookA.result.current[1]({ name: "c" });
  assert.equal(hookA.result.current[0].name, "c");
  assert.equal(hookB.result.current[0].name, "c");
  hookB.unmount();
  hookA.result.current[1]({ name: "d" });
  assert.equal(hookA.result.current[0].name, "d");
  assert.equal(hookB.result.current[0].name, "c");
});

test.run();
