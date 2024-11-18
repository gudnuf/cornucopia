import { test, expect } from "vitest";

test("test", () => {
  expect(process.env.NODE_ENV).toBe("test");
});
