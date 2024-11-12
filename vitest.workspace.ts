import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      environment: "happy-dom",
      include: ["tests/browser/**/*.test.ts"],
    },
  },
  { test: { environment: "node", include: ["tests/node/**/*.test.ts"] } },
  { test: { include: ["tests/helpers.test.ts"] } },
]);
