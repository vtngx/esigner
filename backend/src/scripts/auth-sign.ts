import 'dotenv/config';
import { ethers } from "ethers";

const privateKey = process.env.WALLET_PKEY as string;
const wallet = new ethers.Wallet(privateKey);

async function main() {
  const nonce = "<PASTE_NONCE>";

  const signature = await wallet.signMessage(nonce);

  console.log("Wallet:", wallet.address);
  console.log("Signature:", signature);
}

main();