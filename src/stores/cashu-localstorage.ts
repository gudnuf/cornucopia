import { type Proof } from "@cashu/cashu-ts";

import { type CashuProofLocker } from "../interfaces/cashu-prooflocker.interface.js";
import { StartProofSelection, ProofSelector, type CashuStorage, TransactionOptions } from "../interfaces/cashu-storage.interface.js";
import { sumProofs } from "../helpers/proof.js";

export class CashuLocalStorage implements CashuStorage<StartProofSelection> {
  private PROOFS_KEY = `${this._mintUrl}_${this._unit}_proofs`;

  constructor(
    private _mintUrl: string,
    private _unit: string,
    private locker: CashuProofLocker
  ) {}

  private loadAllProofs(): Array<Proof> {
    return JSON.parse(localStorage.getItem(this.PROOFS_KEY) || "[]");
  }

  public async transaction(
    selector: ProofSelector<StartProofSelection>,
    action: (proofs: Array<Proof>) => Promise<Array<Proof>>,
    options?: TransactionOptions
  ): Promise<void> {
    const selection: StartProofSelection = {
      getAvailableProofs: async ()  => this.locker.getUnlocked(this.loadAllProofs()),
      recoverProofs: async () => {
        const all = this.loadAllProofs()
        const unlocked = await this.locker.getUnlocked(all)
        return all.filter(p => !unlocked.includes(p))
      }
    }

    const proofs = await selector(selection)

    const now = Math.round(Date.now()/1000)
    const timeout = options?.timeout ?? 60_000

    // lock proofs for the duration of the transaction
    await this.locker.addLock(proofs, now + timeout);

    // try to execute the action
    try {
      const change = await action(proofs);

      // remove lock from send proofs and update persisted proofs
      this.locker.removeLock(proofs);

      // save proofs
      // TODO: remove used proofs from local storage and add "change" back in
      localStorage.setItem(
        this.PROOFS_KEY,
        JSON.stringify([...change])
      );
    } catch (e) {
      // unlock to revert transaction
      this.locker.removeLock(proofs);
      throw e;
    }
  }

  public async getBalance(): Promise<number> {
    return sumProofs(this.loadAllProofs());
  }
}
