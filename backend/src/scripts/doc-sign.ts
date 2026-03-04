import 'dotenv/config';
import { ethers } from "ethers";

const privateKey = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
const wallet = new ethers.Wallet(privateKey);

async function main() {
  const documentHash = "0xc6c20bf8b68c4cf04c1d777eb2b4a6632034d9167e9bd053beb6d78643f8edbd";

  const signature = await wallet.signMessage(documentHash);

  console.log("Wallet:", wallet.address);
  console.log("Signature:", signature);
}

main();