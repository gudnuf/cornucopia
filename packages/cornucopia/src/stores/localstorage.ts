import { CashuProofLocker } from "../interfaces/cashu-prooflocker.interface.js";
import { CashuKeyValueStore } from "./key-value.js";

export class CashuLocalStorage extends CashuKeyValueStore {
  constructor(mintUrl: string, unit: string, locker: CashuProofLocker) {
    super(
      mintUrl,
      unit,
      locker,
      async (key: string) => localStorage.getItem(key),
      async (key: string, value: string) => localStorage.setItem(key, value),
    );
  }
}
