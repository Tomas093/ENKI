import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("UpdateFeeModule", (m) => {
    // 100_000_000_000_000n is 0.0001 ETH in wei
    const newFee = 100_000_000_000_000n;

    // Attach to your already deployed contract
    const factory = m.contractAt("KahootFactory", "0xff114aA7b437647fBb18f185F3E4E0dF104Ce9Fa");

    // Execute the setCreationFee function
    m.call(factory, "setCreationFee", [newFee]);

    return { factory };
});
