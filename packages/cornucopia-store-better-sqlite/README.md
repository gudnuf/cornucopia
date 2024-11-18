# cornucopia

Example:

```ts
import { CashuLocalStorage, BrowserLocker } from "cornucopia";
import { minAmount } from "cornucopia/selection";
import { CashuWallet, CashuMint } from "@cashu/cashu-ts";

const locker = new BrowserLocker("locks");
const storage = new CashuLocalStorage("https://mint.example.com", "sat", locker);

const wallet = new CashuWallet(new CashuMint("https://mint.example.com"), {
  unit: "sat",
});

const payInvoice = async (invoice: string, amount: number) => {
  const meltQuote = await wallet.createMeltQuote(invoice);

  return await storage.transaction(
    (selection) => selection.getAvailableProofs().then(minAmount(meltQuote.amount + meltQuote.fee_reserve)),
    async (proofs) => {
      const { change } = await wallet.meltProofs(meltQuote, proofs);

      return change;
    },
  );
};

const sendTokens = async (amount: number) => {
  return await storage.transaction(
    (selection) => selection.getAvailableProofs().then(minAmount(amount)),
    async (proofs) => {
      const { send, keep } = await wallet.send(amount, proofs);

      const res = await fetch("/rug", {
        method: "POST",
        body: JSON.stringify(send),
      });

      // rollback transaction
      if (!res.ok) throw new Error("Request failed");

      return keep;
    },
  );
};
```
