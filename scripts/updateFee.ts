import hre from "hardhat";
import { encodeFunctionData, parseEther } from "viem";

async function main() {
  const factoryAddress = "0xff114aA7b437647fBb18f185F3E4E0dF104Ce9Fa";
  
  const abi = [{
    "inputs": [{"internalType": "uint256", "name": "_newFee", "type": "uint256"}],
    "name": "setCreationFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }];

  const newFee = parseEther("0.0001");
  const data = encodeFunctionData({
    abi,
    functionName: "setCreationFee",
    args: [newFee]
  });

  const accounts = await hre.network.provider.send("eth_accounts");
  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts available. Did you unlock your keystore?");
  }
  const sender = accounts[0];

  console.log("Setting new creation fee to 0.0001 ETH from", sender);
  
  const txHash = await hre.network.provider.send("eth_sendTransaction", [{
    from: sender,
    to: factoryAddress,
    data: data
  }]);
  
  console.log("Fee updated successfully! Transaction Hash:", txHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
