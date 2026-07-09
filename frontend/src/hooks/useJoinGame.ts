import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReadContracts, useWriteContract, useAccount, useConnect } from "wagmi";
import { formatEther } from "viem";
import toast from "react-hot-toast";
import KahootGameABI from "../abi/KahootGame.json";

export type GamePreviewData = {
  professor: string;
  entryFee: bigint;
  entryFeeFormatted: string;
};

export function useJoinGame() {
  const [addressInput, setAddressInput] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<`0x${string}` | undefined>(undefined);

  const router = useRouter();
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContractAsync, isPending } = useWriteContract();

  const { data: gameData, isLoading: isReading } = useReadContracts({
    contracts: searchedAddress
      ? [
          { address: searchedAddress, abi: KahootGameABI.abi, functionName: "professor" },
          { address: searchedAddress, abi: KahootGameABI.abi, functionName: "entryFee" },
        ]
      : [],
  });

  const isGameFound = !!(gameData && gameData[0]?.status === "success");
  const professor = isGameFound ? (gameData![0]?.result as string) : null;
  const entryFee = isGameFound ? (gameData![1]?.result as bigint) : null;
  const entryFeeFormatted = entryFee !== null ? formatEther(entryFee || 0n) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = addressInput.trim();
    if (trimmed.length === 42 && trimmed.startsWith("0x")) {
      setSearchedAddress(trimmed as `0x${string}`);
    } else {
      toast.error("Invalid contract address. Must be a valid 0x… address.");
    }
  };

  const handleJoin = async () => {
    if (!isConnected) {
      if (connectors.length > 0) connect({ connector: connectors[0] });
      return;
    }
    if (!searchedAddress || entryFee === null) return;
    try {
      const hash = await writeContractAsync({
        address: searchedAddress,
        abi: KahootGameABI.abi,
        functionName: "joinGame",
        value: entryFee,
        gas: 500000n,
      });
      router.push(`/transaction-mining?hash=${hash}&game=${searchedAddress}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.shortMessage || "Transaction failed or rejected.");
    }
  };

  return {
    addressInput,
    setAddressInput,
    searchedAddress,
    isReading,
    isGameFound,
    professor,
    entryFee,
    entryFeeFormatted,
    isConnected,
    isPending,
    handleSearch,
    handleJoin,
  };
}
