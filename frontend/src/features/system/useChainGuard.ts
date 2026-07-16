import { useEffect, useRef } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

const TARGET_CHAIN_ID = sepolia.id;

export function useChainGuard() {
  const { isConnected, chainId } = useAccount();
  const { mutate: switchChain } = useSwitchChain();
  // useRef so the auto-switch fires only once per wrong-network detection
  const hasSwitched = useRef(false);

  const isWrongNetwork = isConnected && chainId !== undefined && chainId !== TARGET_CHAIN_ID;

  useEffect(() => {
    if (isWrongNetwork) {
      if (!hasSwitched.current) {
        hasSwitched.current = true;
        switchChain({ chainId: TARGET_CHAIN_ID });
      }
    } else {
      hasSwitched.current = false;
    }
  }, [isWrongNetwork, switchChain]);

  return {
    isWrongNetwork,
    switchToCorrectNetwork: () => switchChain({ chainId: TARGET_CHAIN_ID }),
    targetChainName: "Sepolia",
  };
}
