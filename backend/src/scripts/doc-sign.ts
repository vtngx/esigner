import 'dotenv/config';
import { ethers } from "ethers";

const privateKey = process.env.WALLET_PKEY as string;
const wallet = new ethers.Wallet(privateKey);

async function main() {
  const documentHash = "<PASTE_HASH>";

  const signature = await wallet.signMessage(documentHash);

  console.log("Wallet:", wallet.address);
  console.log("Signature:", signature);
}

main();