import { Proof } from "@cashu/cashu-ts";

import { CashuProofLocker } from "../interfaces/cashu-prooflocker.interface.js";

export class BrowserLocker implements CashuProofLocker {
	constructor(public readonly storageKey: string){}

	async addLock(proofs: Array<Proof>): Promise<void> {
	}

	async removeLock(proofs: Array<Proof>): Promise<void> {

	}

	async getUnlocked(proofs: Array<Proof>): Promise<Proof[]> {
		return proofs
	}

	async getExpired(proofs: Proof[]): Promise<Proof[]> {
		return []
	}
}
