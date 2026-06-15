import { useState, useEffect } from "react";
import { Wallet, Gift, Trophy } from "lucide-react";
import { PlayfulButton } from "../ui/PlayfulButton";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import {
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { formatEther } from "viem";
import { kahootGameAbi } from "../../../lib/contracts";
import { useGame } from "../../../lib/GameContext";

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export const FinalLeaderboard = () => {
  const { gameAddress } = useGame();
  const { address } = useAccount();
  const gameAddr = gameAddress as `0x${string}` | undefined;
  const [claimed, setClaimed] = useState(false);
  const [diplomaClaimed, setDiplomaClaimed] = useState(false);

  // ── Read all game-end state ────────────────────────────────────────────────
  const { data, refetch } = useReadContracts({
    contracts: gameAddr && address
      ? [
          { address: gameAddr, abi: kahootGameAbi, functionName: "prizesCalculated" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "isFinished" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "prizePool" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "scores", args: [address] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "hasPrizeClaimed", args: [address] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "hasClaimed", args: [address] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "passingScore" },
          { address: gameAddr, abi: kahootGameAbi, functionName: "topScoreValues", args: [0n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "topScoreValues", args: [1n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "topScoreValues", args: [2n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "topScoreCounts", args: [0n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "topScoreCounts", args: [1n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "topScoreCounts", args: [2n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "prizePerPlayerAtRank", args: [0n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "prizePerPlayerAtRank", args: [1n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "prizePerPlayerAtRank", args: [2n] },
          { address: gameAddr, abi: kahootGameAbi, functionName: "professorPrize" },
        ]
      : [],
    query: { enabled: !!gameAddr && !!address, refetchInterval: 5000 },
  });

  const prizesCalculated = data?.[0]?.result as boolean | undefined;
  const isFinished = data?.[1]?.result as boolean | undefined;
  const prizePool = data?.[2]?.result as bigint | undefined;
  const myScore = data?.[3]?.result as bigint | undefined;
  const hasPrizeClaimed = data?.[4]?.result as boolean | undefined;
  const hasDiplomaClaimed = data?.[5]?.result as boolean | undefined;
  const passingScore = data?.[6]?.result as bigint | undefined;
  const topValues = [data?.[7]?.result as bigint | undefined, data?.[8]?.result as bigint | undefined, data?.[9]?.result as bigint | undefined];
  const topCounts = [data?.[10]?.result as bigint | undefined, data?.[11]?.result as bigint | undefined, data?.[12]?.result as bigint | undefined];
  const prizePerRank = [data?.[13]?.result as bigint | undefined, data?.[14]?.result as bigint | undefined, data?.[15]?.result as bigint | undefined];

  // Find my rank
  let myPrize: bigint | undefined;
  let myRankIndex = -1;
  if (myScore !== undefined && prizesCalculated) {
    for (let i = 0; i < 3; i++) {
      if (topCounts[i] && topCounts[i]! > 0n && topValues[i] === myScore) {
        myPrize = prizePerRank[i];
        myRankIndex = i;
        break;
      }
    }
  }
  const canClaimPrize = prizesCalculated && myPrize !== undefined && myPrize > 0n && !hasPrizeClaimed && !claimed;
  const canClaimDiploma = isFinished && myScore !== undefined && passingScore !== undefined && myScore >= passingScore && !hasDiplomaClaimed && !diplomaClaimed;

  // ── calculatePrizes write ──────────────────────────────────────────────────
  const { writeContract: writeCalc, data: calcTxHash, isPending: isCalcPending } = useWriteContract();
  const { isLoading: isCalcTxLoading, isSuccess: isCalcSuccess } = useWaitForTransactionReceipt({ hash: calcTxHash });
  useEffect(() => { if (isCalcSuccess) refetch(); }, [isCalcSuccess]);

  // ── claimPrize write ───────────────────────────────────────────────────────
  const { writeContract: writePrize, data: prizeTxHash, isPending: isPrizePending } = useWriteContract();
  const { isLoading: isPrizeTxLoading, isSuccess: isPrizeSuccess } = useWaitForTransactionReceipt({ hash: prizeTxHash });
  useEffect(() => {
    if (isPrizeSuccess) {
      setClaimed(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      refetch();
    }
  }, [isPrizeSuccess]);

  // ── claimDiploma write ─────────────────────────────────────────────────────
  const { writeContract: writeDiploma, data: diplomaTxHash, isPending: isDiplomaPending } = useWriteContract();
  const { isLoading: isDiplomaTxLoading, isSuccess: isDiplomaSuccess } = useWaitForTransactionReceipt({ hash: diplomaTxHash });
  useEffect(() => { if (isDiplomaSuccess) { setDiplomaClaimed(true); refetch(); } }, [isDiplomaSuccess]);

  // Confetti on mount
  useEffect(() => {
    if (!isFinished) return;
    const duration = 3000;
    const animEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animEnd - Date.now();
      if (timeLeft <= 0) { clearInterval(interval); return; }
      const pc = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount: pc, origin: { x: rnd(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount: pc, origin: { x: rnd(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
    return () => clearInterval(interval);
  }, [isFinished]);

  const rankLabel = ["🥇 1st Place", "🥈 2nd Place", "🥉 3rd Place"];

  if (!gameAddr) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-bold text-slate-600">No active game found.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col md:flex-row gap-12 z-10 w-full max-w-6xl mx-auto items-start pt-8 pb-16"
    >
      {/* Left: Podium */}
      <div className="flex-1 w-full flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-12 tracking-tight text-center">
          Final Results
        </h1>

        {/* Prize pool info */}
        {prizePool !== undefined && prizePool > 0n && (
          <div className="mb-6 bg-purple-50 border-2 border-purple-200 rounded-[20px] px-8 py-4 text-center">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Prize Pool</p>
            <p className="text-3xl font-black text-purple-600">{formatEther(prizePool)} ETH</p>
          </div>
        )}

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 md:gap-6 w-full h-[400px] md:px-8 border-b-8 border-slate-300">
          {/* Silver */}
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex flex-col items-center mb-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center font-bold text-xl text-slate-600 shadow-md mb-1">2</div>
              {topValues[1] !== undefined && topCounts[1] !== undefined && topCounts[1]! > 0n ? (
                <>
                  <span className="font-extrabold text-slate-700 text-sm">Score: {topValues[1]?.toString()}</span>
                  <span className="font-black text-purple-600 text-sm">{prizePerRank[1] ? formatEther(prizePerRank[1]!) : "?"} ETH ea</span>
                </>
              ) : <span className="text-slate-400 text-sm">—</span>}
            </div>
            <motion.div initial={{ height: 0 }} animate={{ height: "45%" }} className="w-full bg-slate-200 rounded-t-[20px] border-x-4 border-t-4 border-slate-300 flex justify-center items-center overflow-hidden shadow-inner relative">
              <span className="text-6xl font-black text-slate-700/60 absolute">2</span>
            </motion.div>
          </div>

          {/* Gold */}
          <div className="flex-[1.2] flex flex-col items-center justify-end h-full">
            <div className="flex flex-col items-center mb-4">
              <Trophy size={36} className="text-amber-400 mb-2 drop-shadow-md" fill="currentColor" />
              <div className="w-14 h-14 rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center font-bold text-xl text-amber-600 shadow-md mb-1">1</div>
              {topValues[0] !== undefined && topCounts[0] !== undefined && topCounts[0]! > 0n ? (
                <>
                  <span className="font-extrabold text-slate-700 text-sm">Score: {topValues[0]?.toString()}</span>
                  <span className="font-black text-purple-600 text-sm">{prizePerRank[0] ? formatEther(prizePerRank[0]!) : "?"} ETH ea</span>
                  {topCounts[0]! > 1n && (
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded-full mt-1">TIE x{topCounts[0]?.toString()}</span>
                  )}
                </>
              ) : <span className="text-slate-400 text-sm">—</span>}
            </div>
            <motion.div initial={{ height: 0 }} animate={{ height: "65%" }} className="w-full bg-amber-300 rounded-t-[20px] border-x-4 border-t-4 border-amber-400 flex justify-center items-center overflow-hidden shadow-inner relative">
              <span className="text-[100px] font-black text-amber-900/50 absolute">1</span>
            </motion.div>
          </div>

          {/* Bronze */}
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex flex-col items-center mb-4">
              <div className="w-14 h-14 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center font-bold text-xl text-orange-600 shadow-md mb-1">3</div>
              {topValues[2] !== undefined && topCounts[2] !== undefined && topCounts[2]! > 0n ? (
                <>
                  <span className="font-extrabold text-slate-700 text-sm">Score: {topValues[2]?.toString()}</span>
                  <span className="font-black text-purple-600 text-sm">{prizePerRank[2] ? formatEther(prizePerRank[2]!) : "?"} ETH ea</span>
                </>
              ) : <span className="text-slate-400 text-sm">—</span>}
            </div>
            <motion.div initial={{ height: 0 }} animate={{ height: "35%" }} className="w-full bg-orange-300 rounded-t-[20px] border-x-4 border-t-4 border-orange-400 flex justify-center items-center overflow-hidden shadow-inner relative">
              <span className="text-6xl font-black text-orange-900/50 absolute">3</span>
            </motion.div>
          </div>
        </div>

        {/* My score */}
        {myScore !== undefined && (
          <div className="mt-6 bg-white border-2 border-slate-200 rounded-[16px] px-6 py-3 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-bold text-slate-500 text-xs uppercase tracking-wider">Your Score</p>
              <p className="font-black text-slate-800 text-2xl">{myScore.toString()} pts {myRankIndex >= 0 ? rankLabel[myRankIndex] : ""}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="w-full md:w-[400px] flex flex-col gap-6 mt-8 md:mt-16">

        {/* calculatePrizes if not yet done */}
        {isFinished && !prizesCalculated && (
          <div className="bg-blue-50 rounded-[24px] border-2 border-blue-200 p-6 flex flex-col items-center text-center gap-4">
            <span className="text-4xl">⚙️</span>
            <h3 className="font-black text-slate-800 text-lg">Prizes Not Yet Calculated</h3>
            <p className="text-slate-500 text-sm">Anyone can trigger this — it distributes the prize pool on-chain.</p>
            <PlayfulButton
              variant="purple"
              size="lg"
              className="w-full"
              onClick={() => writeCalc({ address: gameAddr!, abi: kahootGameAbi, functionName: "calculatePrizes" })}
              disabled={isCalcPending || isCalcTxLoading}
            >
              {isCalcPending || isCalcTxLoading ? "Calculating…" : "Calculate Prizes"}
            </PlayfulButton>
          </div>
        )}

        {/* Claim Prize card */}
        {(myPrize !== undefined || hasPrizeClaimed || claimed) && (
          <div className="bg-white rounded-[32px] border-4 border-purple-200 p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 border-4 border-amber-200">
              <Gift size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-700 mb-1">
              {myRankIndex >= 0 ? `${rankLabel[myRankIndex]}!` : "Game Over!"}
            </h2>
            {myPrize !== undefined && myPrize > 0n && (
              <div className="text-5xl font-black text-[#7C3AED] mb-8 tracking-tight drop-shadow-sm">
                {formatEther(myPrize)} ETH
              </div>
            )}

            {!claimed && !hasPrizeClaimed && canClaimPrize ? (
              <PlayfulButton
                variant="purple"
                size="xl"
                className="w-full text-2xl py-6 shadow-xl"
                onClick={() => writePrize({ address: gameAddr!, abi: kahootGameAbi, functionName: "claimPrize" })}
                disabled={isPrizePending || isPrizeTxLoading}
              >
                <Wallet className="mr-3 h-7 w-7" />
                {isPrizePending ? "Signing…" : isPrizeTxLoading ? "Confirming…" : "Claim Prize"}
              </PlayfulButton>
            ) : claimed || hasPrizeClaimed ? (
              <div className="w-full bg-[#10B981] text-white rounded-[20px] py-5 text-2xl font-extrabold border-b-[6px] border-[#047857] flex items-center justify-center gap-2 shadow-lg">
                Claimed! <Wallet size={28} />
              </div>
            ) : myScore !== undefined && myRankIndex < 0 ? (
              <p className="text-slate-500 font-bold">Your score didn't make the top 3 this time.</p>
            ) : (
              <p className="text-slate-400 font-bold">Prizes not yet calculated.</p>
            )}
          </div>
        )}

        {/* Claim Diploma card */}
        {canClaimDiploma || hasDiplomaClaimed || diplomaClaimed ? (
          <div className="bg-white rounded-[24px] border-2 border-emerald-200 p-6 shadow-md flex flex-col items-center text-center gap-4">
            <span className="text-5xl">🎓</span>
            <h3 className="font-black text-slate-800 text-xl">NFT Diploma</h3>
            <p className="text-slate-500 text-sm">
              You passed with {myScore?.toString()} pts (min: {passingScore?.toString()})!
            </p>
            {!diplomaClaimed && !hasDiplomaClaimed ? (
              <PlayfulButton
                variant="success"
                size="lg"
                className="w-full"
                onClick={() => writeDiploma({ address: gameAddr!, abi: kahootGameAbi, functionName: "claimDiploma" })}
                disabled={isDiplomaPending || isDiplomaTxLoading}
              >
                {isDiplomaPending ? "Signing…" : isDiplomaTxLoading ? "Confirming…" : "🎓 Mint Diploma NFT"}
              </PlayfulButton>
            ) : (
              <div className="w-full bg-emerald-500 text-white rounded-[16px] py-3 font-extrabold text-center">
                ✅ Diploma Claimed!
              </div>
            )}
          </div>
        ) : isFinished && myScore !== undefined && passingScore !== undefined && myScore < passingScore ? (
          <div className="bg-slate-50 rounded-[24px] border-2 border-slate-200 p-6 text-center text-slate-400 font-bold">
            Score {myScore.toString()} / {passingScore.toString()} required for diploma.
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};
