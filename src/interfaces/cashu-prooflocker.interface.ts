import { type Proof } from "@cashu/cashu-ts";

export interface CashuProofLocker {
  /**
   * @param proofs An array of proofs to lock
   * @param expiration A unit timestamp at which point the lock should expire
   */
  addLock(proofs: Array<Proof>, expiration: number): Promise<void>;

  /** Removes locks from proofs */
  removeLock(proofs: Array<Proof>): Promise<void>;

  /**
   * Returns an array of proofs that do not have a lock
   * @param proofs proofs to check
   * @returns proofs that are not locked
   */
  getUnlocked(proofs: Array<Proof>): Promise<Proof[]>;

  /**
   * Returns a filtered array of proofs who locks have expired
   * @param proofs proofs to check
   * @returns proofs who lock is expired
   */
  getExpired(proofs: Proof[]): Promise<Proof[]>;
}
