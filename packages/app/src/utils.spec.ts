import { preventAndCall } from "./utils";

describe("preventAndCall", () => {
  it("calls preventDefault", () => {
    let calledPreventDefault = false;
    let called = false;
    const f = preventAndCall(() => {
      called = true;
    });
    f({ preventDefault: () => (calledPreventDefault = true) });
    expect(calledPreventDefault).toBe(true);
    expect(called).toBe(true);
  });
});
