import { test } from "uvu";
import * as assert from "uvu/assert";
import "./load-env";
import { useFirebaseUpdater } from "./watcher";
import { renderHook, act } from "@testing-library/react-hooks";

test("watcher can test", () => {
  const snap = ({ path: "test/ref" } as unknown) as firebase.firestore.QueryDocumentSnapshot<{}>;
  // useFirebaseUpdater(snap);
  assert.ok(true);
});

test.run();
