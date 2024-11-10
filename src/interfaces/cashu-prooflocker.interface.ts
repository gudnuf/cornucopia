import { type Proof } from "@cashu/cashu-ts";

export interface CashuProofLocker {
  lockProofs(proofs: Array<Proof>): Promise<void>;

  unlockProofs(proofs: Array<Proof>): Promise<void>;

  /**
   * @param proofs proofs to check
   * @returns proofs that are not locked
   */
  getUnlocked(proofs: Array<Proof>): Array<Proof>;
}
