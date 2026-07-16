import { useEffect, useState } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";
import toast from "react-hot-toast";

const TARGET_CHAIN_ID = sepolia.id;

export function useChainGuard() {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    if (isConnected && chainId !== undefined && chainId !== TARGET_CHAIN_ID) {
      setIsWrongNetwork(true);
      toast.error(`Please switch to Sepolia network`, {
        id: "wrong-network",
      });
      // Automatically prompt to switch network
      switchChain({ chainId: TARGET_CHAIN_ID });
    } else {
      setIsWrongNetwork(false);
      toast.dismiss("wrong-network");
    }
  }, [isConnected, chainId, switchChain]);

  const switchToCorrectNetwork = () => {
    switchChain({ chainId: TARGET_CHAIN_ID });
  };

  return {
    isWrongNetwork,
    switchToCorrectNetwork,
    targetChainName: "Sepolia",
  };
}
