import { type SendResponse, type Proof } from "@cashu/cashu-ts";
import { type CashuProofLocker } from "../interfaces/cashu-prooflocker.interface.js";
import { type CashuStorage } from "../interfaces/cashu-storage.interface.js";
import { InsufficientFundsError } from "../errors.js";
import { sumProofs } from "../helpers/proof.js";

export class CashuLocalStorage implements CashuStorage {
  private PROOFS_KEY = `${this._mintUrl}_${this._unit}_proofs`;

  constructor(
    private _mintUrl: string,
    private _unit: string,
    private _locker: CashuProofLocker
  ) {}

  // copied from cashu-ts - stripped `includeFees` param
  private _selectProofsToSend(
    proofs: Array<Proof>,
    amountToSend: number
  ): SendResponse {
    const sortedProofs = proofs.sort(
      (a: Proof, b: Proof) => a.amount - b.amount
    );
    const smallerProofs = sortedProofs
      .filter((p: Proof) => p.amount <= amountToSend)
      .sort((a: Proof, b: Proof) => b.amount - a.amount);
    const biggerProofs = sortedProofs
      .filter((p: Proof) => p.amount > amountToSend)
      .sort((a: Proof, b: Proof) => a.amount - b.amount);
    const nextBigger = biggerProofs[0];
    if (!smallerProofs.length && nextBigger) {
      return {
        keep: proofs.filter((p: Proof) => p.secret !== nextBigger.secret),
        send: [nextBigger],
      };
    }

    if (!smallerProofs.length && !nextBigger) {
      return { keep: proofs, send: [] };
    }

    let remainder = amountToSend;
    let selectedProofs = [smallerProofs[0]];
    const returnedProofs = [];
    remainder -= selectedProofs[0].amount;
    if (remainder > 0) {
      const { keep, send } = this._selectProofsToSend(
        smallerProofs.slice(1),
        remainder
      );
      selectedProofs.push(...send);
      returnedProofs.push(...keep);
    }

    if (sumProofs(selectedProofs) < amountToSend && nextBigger) {
      selectedProofs = [nextBigger];
    }
    return {
      keep: proofs.filter((p: Proof) => !selectedProofs.includes(p)),
      send: selectedProofs,
    };
  }

  private loadAllProofs(): Array<Proof> {
    return JSON.parse(localStorage.getItem(this.PROOFS_KEY) || "[]");
  }

  public async transaction(
    amount: number,
    action: (proofs: Array<Proof>) => Promise<Array<Proof>>
  ): Promise<void> {
    const allProofs = this.loadAllProofs();

    // only use proofs not currently locked
    const unlockedProofs = this._locker.getUnlocked(allProofs);

    // make sure we have enough funds
    if (sumProofs(unlockedProofs) < amount) {
      throw new InsufficientFundsError();
    }

    // select optimal proofs to send from all unlocked proofs
    const { send, keep } = this._selectProofsToSend(unlockedProofs, amount);

    // lock proofs for the duration of the transaction
    await this._locker.addLock(send);

    // try to execute the action
    try {
      const newProofs = await action(send);

      // remove lock from send proofs and update persisted proofs
      this._locker.removeLock(send);
      localStorage.setItem(
        this.PROOFS_KEY,
        JSON.stringify([...keep, ...newProofs])
      );
    } catch (e) {
      // unlock to revert transaction
      this._locker.removeLock(send);
      throw e;
    }
  }

  public async getBalance(): Promise<number> {
    return sumProofs(this.loadAllProofs());
  }
}