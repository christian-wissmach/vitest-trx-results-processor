import {describe, expect, it} from "vitest";

describe("example test", () => {
  it("should pass", () => {
    expect(true).toEqual(true);
  });

  it("should fail", () => {
    expect(true).toEqual(false);
  });
});
