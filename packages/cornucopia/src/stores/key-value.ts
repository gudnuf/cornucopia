import { type Proof } from "@cashu/cashu-ts";

import { type CashuProofLocker } from "../interfaces/cashu-prooflocker.interface.js";
import {
  StartProofSelection,
  ProofSelector,
  type CashuStorage,
  TransactionOptions,
} from "../interfaces/cashu-storage.interface.js";
import { getProofUID, sumProofs } from "../helpers/proof.js";

export class CashuKeyValueStore implements CashuStorage<StartProofSelection> {
  private PROOFS_KEY = `${encodeURIComponent(this.mintUrl)}_${this.unit}_proofs`;

  constructor(
    private mintUrl: string,
    private unit: string,
    private locker: CashuProofLocker,
    private get: (key: string) => Promise<string | null>,
    private put: (key: string, value: string) => Promise<void>,
  ) {}

  private async loadAllProofs(): Promise<Array<Proof>> {
    return JSON.parse((await this.get(this.PROOFS_KEY)) || "[]");
  }

  private saveAllProofs(proofs: Proof[]) {
    this.put(this.PROOFS_KEY, JSON.stringify(proofs));
  }

  public async transaction(
    selector: ProofSelector<StartProofSelection>,
    action: (proofs: Array<Proof>) => Promise<Array<Proof>>,
    options?: TransactionOptions,
  ): Promise<void> {
    const selection: StartProofSelection = {
      getAvailableProofs: async () => this.locker.getUnlocked(await this.loadAllProofs()),
      recoverProofs: async () => {
        const all = await this.loadAllProofs();
        const unlocked = await this.locker.getUnlocked(all);
        return all.filter((p) => !unlocked.includes(p));
      },
    };

    const proofs = await selector(selection);

    const now = Math.round(Date.now() / 1000);
    const timeout = options?.timeout ?? 60_000;

    // lock proofs for the duration of the transaction
    await this.locker.addLock(proofs, now + timeout);

    // try to execute the action
    try {
      const change = await action(proofs);

      // remove lock from send proofs and update persisted proofs
      this.locker.removeLock(proofs);

      const usedIds = proofs.map(getProofUID);
      const all = await this.loadAllProofs();
      const unused = all.filter((p) => !usedIds.includes(getProofUID(p)));

      // save proofs
      this.saveAllProofs([...unused, ...change]);
    } catch (e) {
      // unlock to revert transaction
      this.locker.removeLock(proofs);
      throw e;
    }
  }
  public async receiveProofs(proofs: Array<Proof>): Promise<void> {
    const existingProofs = await this.loadAllProofs();
    const existingIds = existingProofs.map(getProofUID);

    // only save proofs not already in the store
    const newProofs = proofs.filter((p) => !existingIds.includes(getProofUID(p)));

    this.saveAllProofs([...existingProofs, ...newProofs]);
  }

  public async getBalance(): Promise<number> {
    return sumProofs(await this.loadAllProofs());
  }
}
