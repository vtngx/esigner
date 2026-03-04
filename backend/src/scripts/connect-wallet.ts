import 'dotenv/config';
import { ethers } from "ethers";

const privateKey = "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1";
const wallet = new ethers.Wallet(privateKey);

async function main() {
  const nonce = "069030082125f5b66eb85313ab348ec1";

  const signature = await wallet.signMessage(nonce);

  console.log(JSON.stringify(
    {
      address: wallet.address,
      signature: signature,
      nonce: nonce,
    }, null, 2,
  ));
}

main();