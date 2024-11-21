import { defineWorkspace } from "vitest/config";

export default defineWorkspace([{ test: { environment: "node", include: ["tests/**/*.test.ts"] } }]);
