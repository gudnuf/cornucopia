import { type Proof } from "@cashu/cashu-ts";
import { CashuProofLocker } from "./cashu-prooflocker.interface.js";

export type TransactionOptions = { timeout?: number };
export type Transaction = (proofs: Proof[]) => Promise<Proof[]>;

// TODO: expand this with more filter options
export interface ProofFilter {
  /** Minimum sum amount of proofs to select */
  amount?: number;
  /** Whether to select unlocked, locked proofs (defaults to false) */
  locked?: boolean;
  /** Select only proofs with expired locks */
  expired?: true;
}

export interface CashuStorage<T extends ProofFilter = ProofFilter> {
  /**
   * @param filter an async method that returns the proofs to use in the transaction
   * @param action function that takes amount of proofs and returns change proofs
   */
  transaction: (filter: ProofFilter, action: Transaction, options?: TransactionOptions) => Promise<void>;

  /* adds proofs to the store */
  receiveProofs: (proofs: Array<Proof>) => Promise<void>;

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
  locker: CashuProofLocker,
): CashuStorage {
  return new constructor(mintUrl, unit, locker);
}
