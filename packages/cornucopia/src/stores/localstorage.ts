import { type Proof } from "@cashu/cashu-ts";

import { type CashuProofLocker } from "../interfaces/cashu-prooflocker.interface.js";
import { type CashuStorage, ProofFilter, TransactionOptions } from "../interfaces/cashu-storage.interface.js";
import { getProofUID, selectProofsToSend, sumProofs } from "../helpers/proof.js";

export class CashuLocalStorage implements CashuStorage {
  private PROOFS_KEY = `${this.mintUrl}_${this.unit}_proofs`;

  constructor(
    private mintUrl: string,
    private unit: string,
    private locker: CashuProofLocker,
  ) {}

  private loadAllProofs(): Array<Proof> {
    return JSON.parse(localStorage.getItem(this.PROOFS_KEY) || "[]");
  }

  private saveAllProofs(proofs: Proof[]) {
    localStorage.setItem(this.PROOFS_KEY, JSON.stringify(proofs));
  }

  private async selectProofs(filter: ProofFilter) {
    let proofs = this.loadAllProofs();

    if (filter.locked !== undefined) {
      const unlocked = await this.locker.getUnlocked(proofs);
      if (filter.locked) proofs = proofs.filter((p) => !unlocked.includes(p));
      else proofs = unlocked;
    }

    if (filter.expired) proofs = await this.locker.getExpired(proofs);

    if (filter.amount !== undefined) {
      const { send } = selectProofsToSend(proofs, filter.amount);
      proofs = send;
    }

    return proofs;
  }

  public async transaction(
    filter: ProofFilter,
    action: (proofs: Array<Proof>) => Promise<Array<Proof>>,
    options?: TransactionOptions,
  ): Promise<void> {
    const proofs = await this.selectProofs(filter);

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
      const all = this.loadAllProofs();
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
    const existingProofs = this.loadAllProofs();
    const existingIds = existingProofs.map(getProofUID);

    // only save proofs not already in the store
    const newProofs = proofs.filter((p) => !existingIds.includes(getProofUID(p)));

    this.saveAllProofs([...existingProofs, ...newProofs]);
  }

  public async getBalance(): Promise<number> {
    return sumProofs(this.loadAllProofs());
  }
}
