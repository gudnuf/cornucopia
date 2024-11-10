import { type Proof } from "@cashu/cashu-ts";
import { CashuProofLocker } from "./cashu-prooflocker.interface";

export interface CashuStorage {
  /**
   * @param amount amount to send
   * @param action function that takes amount of proofs and returns change proofs
   */
  transaction: (
    amount: number,
    action: (proofs: Array<Proof>) => Promise<Array<Proof>>
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
