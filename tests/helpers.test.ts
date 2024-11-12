import { test, expect } from "vitest";
import { getProofUID, sumProofs } from "../src/helpers/proof.js";
import { generateRandomProofs } from "./utils.js";
import { type Proof } from "@cashu/cashu-ts";

test("sumProofs should sum the amounts of multiple proofs", () => {
  /* Create 10 proofs of 100 each = 1000 total */
  const proofs = generateRandomProofs(100, 10);
  expect(sumProofs(proofs)).toBe(1000);
});

test("getProofUID should generate deterministic UIDs from proof C value", () => {
  const proof: Proof = {
    id: "009a1f293253e41e",
    amount: 100,
    C: "09df317fba6ce03e666392ecedad7a76d46f8ff5982f3e5fad23391f95867513",
    secret: "e1c3f725a803075035be81605279990ba26470bd178b4639f6f4cf290c428c69",
  };

  /* Verify the generated UID matches expected hash */
  expect(getProofUID(proof)).toBe(
    "ed6e794156440b3e89f0952fd0f494252b15050b0998b9532ed8e88d1a5ac176",
  );
});
