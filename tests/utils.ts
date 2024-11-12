import { type Proof } from "@cashu/cashu-ts";

const keysetId = "009a1f293253e41e";

export function generateRandomProof(amount: number): Proof {
  /* Generate random 32 byte hex strings for C and secret */
  const C = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    id: keysetId,
    amount,
    C,
    secret,
  };
}

export function generateRandomProofs(amount: number, count: number): Proof[] {
  return Array.from({ length: count }, () => generateRandomProof(amount));
}
