import { Proof, SerializedDLEQ } from "@cashu/cashu-ts";
import { CashuProofLocker, CashuStorage, ProofFilter, Transaction, TransactionOptions } from "@gudnuf/cornucopia";
import { getProofUID, selectProofsToSend, sumProofs } from "@gudnuf/cornucopia/helpers";
import { type Database } from "better-sqlite3";

type ProofRow = {
  id: number;
  mint: string;
  unit: string;
  amount: number;
  keyset: string;
  secret: string;
  signature: string;
  dleq: string;
  uid: string;
};

function convertRowToProof(row: ProofRow): Proof {
  return {
    id: row.keyset,
    amount: row.amount,
    secret: row.secret,
    C: row.signature,
    dleq: JSON.parse(row.dleq) as SerializedDLEQ,
  };
}

export class CornucopiaSqliteStore implements CashuStorage {
  constructor(
    private locker: CashuProofLocker,
    private sqlite: Database,
    private table: string,
    private mint: string,
    private unit: string,
  ) {
    this.setup();
  }

  private setup() {
    // TODO: migrations

    // Ensure table exists
    this.sqlite
      .prepare(
        `
CREATE TABLE IF NOT EXISTS "${this.table}" (
  "id" INTEGER NOT NULL,
  "mint" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "keyset" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "dleq" TEXT,
	"uid"	TEXT NOT NULL,
  PRIMARY KEY("id" AUTOINCREMENT)
)`,
      )
      .run();
  }

  private removeProofs(ids: string[]) {
    const params = Array(ids.length).fill("?").join(",");
    const { changes } = this.sqlite.prepare<string[]>(`DELETE FROM "${this.table}" WHERE uid in ${params}`).run(...ids);

    return changes;
  }

  private insertProofs(proofs: Proof[]) {
    const insert = this.sqlite.prepare<[number, string, string, string, string | null, string, string, string]>(
      `INSERT INTO "${this.table}" (amount, keyset, secret, signature, dleq, uid, mint, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    this.sqlite.transaction(() => {
      for (const proof of proofs) {
        insert.run(
          proof.amount,
          proof.id,
          proof.secret,
          proof.C,
          proof.dleq ? JSON.stringify(proof.dleq) : null,
          getProofUID(proof),
          this.mint,
          this.unit,
        );
      }
    })();
  }

  private loadAllProofs() {
    return this.sqlite.prepare<[], ProofRow>(`SELECT * FROM "${this.table}"`).all().map(convertRowToProof);
  }

  private async selectProofs(filter: ProofFilter) {
    let proofs: Proof[];
    if (filter.amount) {
      const available = this.sqlite
        .prepare<[number], ProofRow>(`SELECT * from "${this.table}" WHERE amount <= ?`)
        .all(filter.amount)
        .map(convertRowToProof);

      const { send } = selectProofsToSend(available, filter.amount);
      proofs = send;
      if (sumProofs(proofs) < filter.amount) throw new Error("Failed to find enough proofs");
    } else proofs = this.loadAllProofs();

    const unlocked = await this.locker.getUnlocked(proofs);
    if (filter.locked) proofs = proofs.filter((p) => !unlocked.includes(p));
    else proofs = unlocked;

    if (filter.expired) proofs = await this.locker.getExpired(proofs);

    return proofs;
  }

  public async transaction(filter: ProofFilter, action: Transaction, options?: TransactionOptions) {
    const proofs = await this.selectProofs(filter);

    const now = Math.round(Date.now() / 1000);
    const timeout = options?.timeout ?? 60_000;

    await this.locker.addLock(proofs, now + timeout);

    try {
      const change = await action(proofs);

      // remove the lock on the proofs
      this.locker.removeLock(proofs);

      // remove old proofs
      this.removeProofs(proofs.map((p) => getProofUID(p)));

      // insert remaining proofs
      this.insertProofs(change);
    } catch (error) {
      throw error;
    }
  }

  public async receiveProofs(proofs: Proof[]) {
    this.insertProofs(proofs);
  }

  public async getBalance() {
    const result = this.sqlite.prepare<[], { total: number }>(`SELECT SUM(amount) as total FROM "${this.table}"`).get();
    if (!result) throw new Error("Failed to get rows");
    return result.total;
  }
}
