import { type Proof } from "@cashu/cashu-ts";

export interface CashuProofLocker {
  addLock(proofs: Array<Proof>): Promise<void>;

  removeLock(proofs: Array<Proof>): Promise<void>;

  /**
   * @param proofs proofs to check
   * @returns proofs that are not locked
   */
  getUnlocked(proofs: Array<Proof>): Array<Proof>;
}
