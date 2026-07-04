import { useEffect, useState } from "react";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import toast from "react-hot-toast";

const TARGET_CHAIN_ID = sepolia.id;

export function useChainGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    if (isConnected && chainId !== TARGET_CHAIN_ID) {
      setIsWrongNetwork(true);
      toast.error(`Please switch to Sepolia network`, {
        id: "wrong-network",
      });
    } else {
      setIsWrongNetwork(false);
      toast.dismiss("wrong-network");
    }
  }, [isConnected, chainId]);

  const switchToCorrectNetwork = () => {
    switchChain({ chainId: TARGET_CHAIN_ID });
  };

  return {
    isWrongNetwork,
    switchToCorrectNetwork,
    targetChainName: "Sepolia",
  };
}
