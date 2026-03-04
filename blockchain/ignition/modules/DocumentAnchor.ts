import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DocumentAnchorModule = buildModule("DocumentAnchorModule", (m) => {
  const documentAnchor = m.contract("DocumentAnchor");

  return { documentAnchor };
});

export default DocumentAnchorModule;