import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ENKIProfilesModule", (m) => {
    const profiles = m.contract("ENKIProfiles");
    return { profiles };
});
