import { type Proof } from "@cashu/cashu-ts";
import { CashuProofLocker } from "./cashu-prooflocker.interface.js";

export type ProofSelector<T extends StartProofSelection> = (
  selection: T,
) => Promise<Proof[]>;
export type ProofFilter = (proofs: Proof[]) => Proof[] | Promise<Proof[]>;

export type TransactionOptions = { timeout?: number };
export type Transaction = (proofs: Proof[]) => Promise<Proof[]>;

/** Base proof selector interface */
export interface StartProofSelection {
  /** Returns an array of proofs that are not locked */
  getAvailableProofs(): Promise<Proof[]>;

  /** Returns all proofs whose locks have expired */
  recoverProofs(): Promise<Proof[]>;
}

export interface CashuStorage<T extends StartProofSelection> {
  /**
   * @param selector an async method that returns the proofs to use in the transaction
   * @param action function that takes amount of proofs and returns change proofs
   */
  transaction: (
    selector: ProofSelector<T>,
    action: Transaction,
    options?: TransactionOptions,
  ) => Promise<void>;

  /* adds proofs to the store */
  receiveProofs: (proofs: Array<Proof>) => Promise<void>;

  /**
   * @returns current balance as the sum of all proofs
   */
  getBalance: () => Promise<number>;
}

export interface CashuStorageConstructor {
  new (
    mintUrl: string,
    unit: string,
    locker: CashuProofLocker,
  ): CashuStorage<StartProofSelection>;
}

export function createCashuStorage<T extends CashuStorageConstructor>(
  constructor: T,
  mintUrl: string,
  unit: string,
  locker: CashuProofLocker,
): CashuStorage<StartProofSelection> {
  return new constructor(mintUrl, unit, locker);
}
