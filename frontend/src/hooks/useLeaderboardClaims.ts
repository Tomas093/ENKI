import { useState, useEffect } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { formatEther } from "viem";
import KahootGameABI from "../abi/KahootGame.json";
import { useFinalLeaderboard, Player } from "./useFinalLeaderboard";

export function useLeaderboardClaims() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");
  const { writeContractAsync, isPending } = useWriteContract();
  const [confettiFired, setConfettiFired] = useState(false);

  const {
    loading,
    participants,
    prizes,
    prizesCalculated,
    PASS_THRESHOLD,
    markPrizeClaimed,
    markDiplomaClaimed,
  } = useFinalLeaderboard(gameAddress);

  // Build rank tiers
  const uniqueScores = Array.from(new Set(participants.map((p) => p.score))).sort(
    (a, b) => b - a
  );
  const rank1Players = uniqueScores[0] !== undefined ? participants.filter((p) => p.score === uniqueScores[0]) : [];
  const rank2Players = uniqueScores[1] !== undefined ? participants.filter((p) => p.score === uniqueScores[1]) : [];
  const rank3Players = uniqueScores[2] !== undefined ? participants.filter((p) => p.score === uniqueScores[2]) : [];

  const myData = address
    ? participants.find((p) => p.wallet.toLowerCase() === address.toLowerCase())
    : undefined;

  let myRank = -1;
  let myPrize = 0n;
  if (myData) {
    if (uniqueScores[0] !== undefined && myData.score === uniqueScores[0]) { myRank = 1; myPrize = prizes[0]; }
    else if (uniqueScores[1] !== undefined && myData.score === uniqueScores[1]) { myRank = 2; myPrize = prizes[1]; }
    else if (uniqueScores[2] !== undefined && myData.score === uniqueScores[2]) { myRank = 3; myPrize = prizes[2]; }
  }

  useEffect(() => {
    if (!loading && myRank !== -1 && myPrize > 0n && !confettiFired) {
      setConfettiFired(true);
      const duration = 3000;
      const end = Date.now() + duration;
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      const interval = setInterval(() => {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const count = 50 * (timeLeft / duration);
        confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount: count, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount: count, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [loading, myRank, myPrize, confettiFired]);

  const handleClaim = async () => {
    if (!gameAddress || !address) return;
    try {
      await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: "claimPrize",
      });
      markPrizeClaimed(address);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Prize claimed successfully! 🎉");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.shortMessage || "Failed to claim prize.");
    }
  };

  const handleClaimDiploma = async () => {
    if (!gameAddress || !address) return;
    try {
      await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: "claimDiploma",
      });
      markDiplomaClaimed(address);
      toast.success("Diploma NFT claimed! Check your wallet.");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.shortMessage || "Failed to claim diploma.");
    }
  };

  return {
    loading,
    participants,
    prizes,
    prizesCalculated,
    PASS_THRESHOLD,
    rank1Players,
    rank2Players,
    rank3Players,
    myData,
    myRank,
    myPrize,
    myPrizeFormatted: myPrize > 0n ? formatEther(myPrize) : null,
    isPending,
    handleClaim,
    handleClaimDiploma,
    address,
  };
}
