import { type Proof } from "@cashu/cashu-ts";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";

export function sumProofs(proofs: Array<Proof>): number {
  return proofs.reduce((sum, proof) => sum + proof.amount, 0);
}

/** Returns a unique id for a proof */
export function getProofUID(proof: Proof) {
  return bytesToHex(sha256(proof.C));
}
