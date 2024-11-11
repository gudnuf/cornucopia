import { CashuMint, Proof, SendResponse } from "@cashu/cashu-ts";
import { InsufficientFundsError } from "../errors.js";
import { sumProofs } from "../helpers/proof.js";
import { ProofFilter } from "../interfaces/cashu-storage.interface.js";

// copied from cashu-ts - stripped `includeFees` param
function selectProofsToSend(
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
		const { keep, send } = selectProofsToSend(
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

export function minAmount(amount: number): ProofFilter {
	return (proofs) => {
		const total = sumProofs(proofs)
		if(total < amount) throw new InsufficientFundsError();
		const { send } = selectProofsToSend(proofs, amount)
		return send
	}
}
