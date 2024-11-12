import { Proof } from "@cashu/cashu-ts";

import { CashuProofLocker } from "../interfaces/cashu-prooflocker.interface.js";
import { getProofUID } from "../helpers/proof.js";

export class BrowserLocker implements CashuProofLocker {
	constructor(public readonly storageKey: string){}

	private loadAllLocks(): Array<[string, number]> {
		return JSON.parse(localStorage.getItem(this.storageKey) || "[]")
	}

	private setLocks(locks: Array<[string, number]>): void {
		localStorage.setItem(this.storageKey, JSON.stringify(locks))
	}

	async addLock(proofs: Array<Proof>, expiration: number): Promise<void> {
		const currentLocks = this.loadAllLocks()
		const newLocks = proofs.map(p => [getProofUID(p), expiration] as [string, number])
		const uniqueLocks = [...currentLocks]

		// Add new locks, replacing any existing ones for same UIDs
		for (const lock of newLocks) {
			const existingIndex = uniqueLocks.findIndex(([uid]) => uid === lock[0])
			if (existingIndex >= 0) {
				uniqueLocks[existingIndex] = lock
			} else {
				uniqueLocks.push(lock)
			}
		}

		this.setLocks(uniqueLocks)
	}

	async removeLock(proofs: Array<Proof>): Promise<void> {
		const currentLocks = this.loadAllLocks()
		const uids = proofs.map(getProofUID)
		const newLocks = currentLocks.filter(([uid]) => !uids.includes(uid))

		this.setLocks(newLocks)
	}

	async getUnlocked(proofs: Array<Proof>): Promise<Proof[]> {
		const currentLocks = this.loadAllLocks()
		const lockedUids = currentLocks.map(([uid]) => uid)

		return proofs.filter(p => !lockedUids.includes(getProofUID(p)))
	}

	async getExpired(proofs: Proof[]): Promise<Proof[]> {
		const currentLocks = this.loadAllLocks()
		const now = Math.round(Date.now() / 1000)
		const expiredUids = currentLocks
			.filter(([_, exp]) => exp <= now)
			.map(([uid]) => uid)

		return proofs.filter(p => expiredUids.includes(getProofUID(p)))
	}
}
