import { keccak256, solidityPacked } from 'ethers';
import { MerkleTree } from 'merkletreejs';

export function createLeaf(docHash: string, wallet: string) {
  return keccak256(
    solidityPacked(['bytes32', 'address'], [docHash, wallet]),
  );
}

export function generateMerkleRoot(leaves: string[]) {
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  return {
    root: tree.getHexRoot(),
    tree,
  };
}

export function verifyProof(leaf: string, proof: string[], root: string) {
  const tree = new MerkleTree([], keccak256, { sortPairs: true });
  return tree.verify(proof, leaf, root);
}