import { type Proof } from "@cashu/cashu-ts";
import { CashuProofLocker } from "./cashu-prooflocker.interface.js";

export type Transaction = (proofs: Proof[]) => Promise<Proof[]>

export interface CashuStorage {
  /**
   * @param minAmount minimum amount of proofs to lock
   * @param action function that takes amount of proofs and returns change proofs
   */
  transaction: (
    minAmount: number,
    action: Transaction
  ) => Promise<void>;

  /**
   * @returns current balance as the sum of all proofs
   */
  getBalance: () => Promise<number>;
}

export interface CashuStorageConstructor {
  new (mintUrl: string, unit: string, locker: CashuProofLocker): CashuStorage;
}

export function createCashuStorage<T extends CashuStorageConstructor>(
  constructor: T,
  mintUrl: string,
  unit: string,
  locker: CashuProofLocker
): CashuStorage {
  return new constructor(mintUrl, unit, locker);
}
