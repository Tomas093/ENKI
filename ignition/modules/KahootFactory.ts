import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("KahootFactoryModule", (m) => {
    const creationFee = m.getParameter("creationFee", 100_000_000_000_000n);
    const factory = m.contract("KahootFactory", [creationFee]);
    return { factory };
});