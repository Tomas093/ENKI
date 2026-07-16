import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReadContracts, useWriteContract, useAccount, useConnect, useReadContract, usePublicClient } from "wagmi";
import { formatEther } from "viem";
import toast from "react-hot-toast";
import KahootGameABI from '@/core/blockchain/abi/KahootGame.json';
import { PROFILES_ADDRESS, enkiProfilesAbi } from '@/core/blockchain/contracts';


export function useJoinGame() {
  const [gameIdInput, setGameIdInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const gameIdParam = params.get("gameId");
      if (gameIdParam) {
        setGameIdInput(gameIdParam);
      }
    }
  }, []);
  const [searchedAddress, setSearchedAddress] = useState<`0x${string}` | undefined>(undefined);
  const [isResolving, setIsResolving] = useState(false);

  const router = useRouter();
  const { address } = useAccount();
  const { isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { writeContractAsync, isPending } = useWriteContract();

  const wagmiClient = usePublicClient();
  const [isPendingProfile, setIsPendingProfile] = useState(false);

  const { data: globalNicknameData } = useReadContract({
    address: PROFILES_ADDRESS,
    abi: enkiProfilesAbi,
    functionName: "nicknames",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const globalNickname = globalNicknameData as string | undefined;

  const { data: gameData, isLoading: isReading } = useReadContracts({
    contracts: searchedAddress
      ? [
          { address: searchedAddress, abi: KahootGameABI.abi as any, functionName: "professor" },
          { address: searchedAddress, abi: KahootGameABI.abi as any, functionName: "entryFee" },
          ...(address ? [{ address: searchedAddress, abi: KahootGameABI.abi as any, functionName: "hasJoined", args: [address] }] : [])
        ]
      : [],
  });

  const isGameFound = !!(gameData && gameData[0]?.status === "success");
  const professor = isGameFound ? (gameData![0]?.result as string) : null;
  const entryFee = isGameFound ? (gameData![1]?.result as bigint) : null;
  const hasJoined = isGameFound && address ? (gameData![2]?.result as boolean) : false;
  const entryFeeFormatted = entryFee !== null ? formatEther(entryFee || 0n) : null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = gameIdInput.trim();

    if (/^0x[a-fA-F0-9]{40}$/.test(input)) {
      setSearchedAddress(input as `0x${string}`);
      return;
    }
    
    const id = parseInt(input, 10);
    if (isNaN(id) || id < 0) {
      toast.error("Invalid entry. Must be a valid Game ID or Contract Address.");
      return;
    }

    setIsResolving(true);
    setSearchedAddress(undefined);

    try {
      const res = await fetch(`/api/factory/resolve/${id}`);
      if (!res.ok) throw new Error("Game not found");
      const data = await res.json();
      setSearchedAddress(data.gameAddress as `0x${string}`);
    } catch (e: any) {
      console.error(e);
      toast.error("Game ID not found.");
      setSearchedAddress(undefined);
    } finally {
      setIsResolving(false);
    }
  };

  const handleJoin = async (nickname?: string) => {
    if (!isConnected) {
      if (connectors.length > 0) connect({ connector: connectors[0] });
      return;
    }
    if (!searchedAddress || entryFee === null) return;
    
    try {
      // Si el nickname ingresado es diferente al guardado on-chain,
      // actualizamos primero el perfil global.
      if (nickname && nickname.trim() !== "" && nickname !== globalNickname) {
        setIsPendingProfile(true);
        toast.loading("Saving nickname globally on-chain...", { id: "profile-tx" });
        const txHash = await writeContractAsync({
          address: PROFILES_ADDRESS,
          abi: enkiProfilesAbi,
          functionName: "setNickname",
          args: [nickname],
        });
        
        await wagmiClient?.waitForTransactionReceipt({ hash: txHash });
        toast.success("Global nickname updated on-chain!", { id: "profile-tx" });
        setIsPendingProfile(false);
      }

      const hash = await writeContractAsync({
        address: searchedAddress,
        abi: KahootGameABI.abi,
        functionName: "joinGame",
        value: entryFee,
        gas: 500000n,
      });
      const nickParam = nickname ? `&nick=${encodeURIComponent(nickname)}` : "";
      router.push(`/transaction-mining?hash=${hash}&game=${searchedAddress}${nickParam}`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.shortMessage || "Transaction failed or rejected.", { id: "profile-tx" });
      setIsPendingProfile(false);
    }
  };

  return {
    gameIdInput,
    setGameIdInput,
    searchedAddress,
    isReading: isReading || isResolving,
    isGameFound,
    professor,
    entryFee,
    entryFeeFormatted,
    hasJoined,
    isConnected,
    isPending: isPending || isPendingProfile,
    handleSearch,
    handleJoin,
    globalNickname,
  };
}
