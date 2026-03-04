import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SignatureAnchorModule = buildModule("SignatureAnchorModule", (m) => {
  const signatureAnchor = m.contract("SignatureAnchor");

  return { signatureAnchor };
});

export default SignatureAnchorModule;