import { useEnsName } from "wagmi";

export function useDisplayName(address: `0x${string}` | undefined) {
  const { data: ensName, isLoading } = useEnsName({ address });
  
  let displayName = "";
  if (ensName) {
    displayName = ensName;
  } else if (address) {
    displayName = `${address.slice(0, 6)}...${address.slice(-4)}`;
  } else {
    displayName = "Connecting...";
  }

  return { displayName, ensName, isLoading };
}
