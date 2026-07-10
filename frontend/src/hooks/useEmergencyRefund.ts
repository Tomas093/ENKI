import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useReadContracts, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import toast from "react-hot-toast";
import KahootGameABI from "../abi/KahootGame.json";

export function useEmergencyRefund() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");

  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const { writeContractAsync } = useWriteContract();

  // Read required state from contract
  const { data } = useReadContracts({
    contracts: gameAddress ? [
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: "lastActionTime" },
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: "INACTIVITY_TIMEOUT" },
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: "entryFee" },
      { address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: "isCancelled" }
    ] : [],
    query: { refetchInterval: 10000 },
  });

  const lastActionTime = data?.[0]?.result as bigint | undefined;
  const timeoutPeriod = data?.[1]?.result as bigint | undefined;
  const entryFee = data?.[2]?.result as bigint | undefined;
  const isCancelled = data?.[3]?.result as boolean | undefined;

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const canClaim = !!gameAddress && lastActionTime !== undefined && timeoutPeriod !== undefined && 
    (isCancelled || (BigInt(now) > lastActionTime + timeoutPeriod));

  const handleClaim = async () => {
    if (signing || done || !canClaim || !gameAddress) return;
    setSigning(true);
    
    try {
      await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: "claimRefund"
      });
      setDone(true);
      toast.success("Refund claimed successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to claim refund.");
    } finally {
      setSigning(false);
    }
  };

  let timeRemainingStr = "";
  if (lastActionTime !== undefined && timeoutPeriod !== undefined && !canClaim) {
    const unlockTime = Number(lastActionTime + timeoutPeriod);
    const diff = unlockTime - now;
    if (diff > 0) {
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      timeRemainingStr = `${h}h ${m}m ${s}s`;
    }
  }

  const entryFeeEth = entryFee !== undefined ? formatEther(entryFee) : "0.0";

  return {
    signing,
    done,
    canClaim,
    timeRemainingStr,
    entryFeeEth,
    handleClaim,
    router
  };
}
