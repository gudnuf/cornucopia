import { type Proof } from "@cashu/cashu-ts";

export function sumProofs(proofs: Array<Proof>): number {
	return proofs.reduce((sum, proof) => sum + proof.amount, 0);
}
