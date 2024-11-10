# cornucopia

Example:

```ts
import {
  createCashuStorage,
  CashuLocalStorage,
  CashuLocalStorageProofLocker,
} from "cornucopia";
import { CashuWallet, CashuMint } from "@cashu/cashu-ts";

const storage = createCashuStorage(
  CashuLocalStorage,
  "https://mint.example.com",
  "sat",
  new CashuLocalStorageProofLocker()
);

const wallet = new CashuWallet(new CashuMint("https://mint.example.com"), {
  unit: "sat",
});

const payInvoice = async (invoice: string, amount: number) => {
  return await storage.transaction(amount, async (proofs) => {
    const meltQuote = await wallet.createMeltQuote(invoice);
    const { change } = await wallet.meltProofs(meltQuote, proofs);
    return change;
  });
};
```
