import { type Proof } from "@cashu/cashu-ts";
import { type CashuProofLocker } from "@gudnuf/cornucopia";
import { getProofUID } from "@gudnuf/cornucopia/helpers";
import Keyv, { type KeyvStoreAdapter } from "keyv";

export class CornucopiaKeyVLocker implements CashuProofLocker {
  private keyv: Keyv;

  constructor(adapter: KeyvStoreAdapter) {
    this.keyv = new Keyv(adapter);
  }

  async addLock(proofs: Array<Proof>, expiration: number): Promise<void> {
    for (const proof of proofs) {
      // NOTE: set the value as the expiration so that we can fetch it later and manually cleanup expired proofs
      // DO NOT use the native ttl
      await this.keyv.set(getProofUID(proof), expiration);
    }
  }

  async removeLock(proofs: Array<Proof>): Promise<void> {
    await this.keyv.delete(proofs.map(getProofUID));
  }

  async getUnlocked(proofs: Array<Proof>): Promise<Proof[]> {
    const unlocked: Proof[] = [];
    for (const proof of proofs) {
      if (!this.keyv.has(getProofUID(proof))) unlocked.push(proof);
    }
    return unlocked;
  }

  async getExpired(proofs: Proof[]): Promise<Proof[]> {
    const now = Math.round(Date.now() / 1000);

    const expired: Proof[] = [];
    for (const proof of proofs) {
      const expiration = await this.keyv.get(getProofUID(proof));
      if (expiration && expiration >= now) expired.push(proof);
    }
    return expired;
  }
}
