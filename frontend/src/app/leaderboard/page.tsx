"use client";
import { useState, useEffect } from "react";
import { Wallet, Gift, Trophy, Award, Loader2, Frown } from "lucide-react";
import toast from "react-hot-toast";
import { PlayfulButton } from "../../components/ui/PlayfulButton";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useWriteContract, useAccount, useReadContract, usePublicClient } from "wagmi";
import { createPublicClient, http, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import KahootGameABI from "../../abi/KahootGame.json";

type Player = { wallet: string, score: number, claimed: boolean, diplomaClaimed: boolean };

export default function FinalLeaderboard() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");
  const { writeContractAsync, isPending } = useWriteContract();
  const wagmiClient = usePublicClient();

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Player[]>([]);
  const [prizes, setPrizes] = useState<bigint[]>([0n, 0n, 0n]);
  const [confettiFired, setConfettiFired] = useState(false);

  const { data: prizesCalculated, refetch: refetchPrizesCalculated } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'prizesCalculated'
  });

  const { data: passingScoreData } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'passingScore'
  });

  const PASS_THRESHOLD = Number(passingScoreData) || 1;

  useEffect(() => {
    if (!gameAddress || !wagmiClient) return;

    let intervalId: any;
    if (!prizesCalculated) {
      intervalId = setInterval(() => {
        refetchPrizesCalculated();
      }, 3000);
    } else {
      clearInterval(intervalId);
      fetchStats();
    }
    return () => clearInterval(intervalId);
  }, [gameAddress, prizesCalculated, wagmiClient]);

  const fetchStats = async () => {
    try {
      // logClient is only used for getContractEvents to bypass Alchemy's 10-block limit on Free Tier
      const logClient = createPublicClient({
        chain: sepolia,
        transport: http('https://ethereum-sepolia-rpc.publicnode.com')
      });
      const currentBlock = await logClient.getBlockNumber();
      const fromBlock = currentBlock > 9000n ? currentBlock - 9000n : 0n;

      const logs = await logClient.getContractEvents({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        eventName: 'PlayerJoined',
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
      const wallets = Array.from(new Set(logs.map(l => (l as any).args?.player as `0x${string}`)));

      // Use wagmiClient (Alchemy) for state reads to avoid public node lag
      if (!wagmiClient) return;
      const scores = await Promise.all(wallets.map(w => wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'scores', args: [w] })));
      const claims = await Promise.all(wallets.map(w => wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'hasPrizeClaimed', args: [w] })));
      const diplomaClaims = await Promise.all(wallets.map(w => wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'hasClaimed', args: [w] })));

      const p0 = await wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [0] }).catch(() => 0n);
      const p1 = await wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [1] }).catch(() => 0n);
      const p2 = await wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [2] }).catch(() => 0n);

      setPrizes([p0 as bigint, p1 as bigint, p2 as bigint]);

      const p = wallets.map((w, i) => ({
        wallet: w,
        score: Number(scores[i]),
        claimed: Boolean(claims[i]),
        diplomaClaimed: Boolean(diplomaClaims[i])
      })).sort((a, b) => b.score - a.score);

      setParticipants(p);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const uniqueScores = Array.from(new Set(participants.map(p => p.score))).sort((a, b) => b - a);
  const rank1Players = uniqueScores[0] !== undefined ? participants.filter(p => p.score === uniqueScores[0]) : [];
  const rank2Players = uniqueScores[1] !== undefined ? participants.filter(p => p.score === uniqueScores[1]) : [];
  const rank3Players = uniqueScores[2] !== undefined ? participants.filter(p => p.score === uniqueScores[2]) : [];

  const myData = address ? participants.find(p => p.wallet.toLowerCase() === address.toLowerCase()) : undefined;
  
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
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [loading, myRank, myPrize, confettiFired]);

  const handleClaim = async () => {
    if (!gameAddress) return;
    try {
      await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: 'claimPrize'
      });
      // Optimistic UI update
      setParticipants(prev => prev.map(p => p.wallet.toLowerCase() === address?.toLowerCase() ? { ...p, claimed: true } : p));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Prize claimed successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to claim prize.");
    }
  };

  const handleClaimDiploma = async () => {
    if (!gameAddress) return;
    try {
      await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: 'claimDiploma'
      });
      setParticipants(prev => prev.map(p => p.wallet.toLowerCase() === address?.toLowerCase() ? { ...p, diplomaClaimed: true } : p));
      toast.success("Diploma claimed! Check your wallet NFT collection.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to claim diploma. Did you pass the threshold?");
    }
  };

  const renderAvatars = (players: Player[], rankColor: string) => {
    if (players.length === 0) return null;
    
    // Si hay mas de 2, mostrar 1 y "+N"
    const displayPlayers = players.slice(0, 2);
    const extraCount = players.length - 2;

    return (
      <div className="flex flex-col items-center mb-6">
        {players.length > 1 && (
          <div className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-widest uppercase shadow-sm">
            TIE!
          </div>
        )}
        <div className="flex space-x-2 mb-3">
          {displayPlayers.map((p, i) => {
            const isMe = address && p.wallet.toLowerCase() === address.toLowerCase();
            return (
              <div key={i} className={`w-14 h-14 rounded-full ${isMe ? 'bg-amber-100 border-amber-400 text-amber-600' : 'bg-slate-100 border-slate-300 text-slate-600'} border-4 flex items-center justify-center font-bold text-lg shadow-md`}>
                {isMe ? "YOU" : p.wallet.slice(2, 4).toUpperCase()}
              </div>
            );
          })}
          {extraCount > 0 && (
             <div className={`w-14 h-14 rounded-full bg-slate-100 border-slate-300 text-slate-600 border-4 flex items-center justify-center font-bold text-lg shadow-md`}>
               +{extraCount}
             </div>
          )}
        </div>
        <span className="font-extrabold text-slate-800 text-sm leading-tight text-center max-w-[150px] truncate">
          {players.length === 1 ? `${players[0].wallet.slice(0, 6)}...` : `${players.length} players`}
        </span>
        <span className={`font-black ${rankColor} text-lg leading-tight mt-1`}>
          {players[0].score} pts
        </span>
      </div>
    );
  };

  if (!prizesCalculated || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center pt-20">
        <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
        <h2 className="text-2xl font-black text-slate-800">Calculating Results...</h2>
        <p className="text-slate-500 font-medium">Waiting for the host to finalize the prizes.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col md:flex-row gap-12 z-10 w-full max-w-6xl mx-auto items-start pt-8 pb-16"
    >
      
      {/* Left/Center: Olympic Leaderboard Podium */}
      <div className="flex-1 w-full flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-12 tracking-tight text-center">
          Final Results
        </h1>

        <div className="flex items-end justify-center gap-2 md:gap-6 w-full h-[500px] md:px-8 border-b-8 border-slate-300 pb-0">
          
          {/* Silver - 2nd */}
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            {rank2Players.length > 0 && renderAvatars(rank2Players, "text-slate-500")}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "50%" }}
              className="w-full bg-slate-200 rounded-t-[24px] border-x-4 border-t-4 border-slate-300 flex justify-center items-center overflow-hidden shadow-inner relative"
            >
              <span className="text-8xl font-black text-slate-700/60 absolute">2</span>
              {prizes[1] > 0n && (
                <div className="absolute top-4 bg-white/60 px-3 py-1 rounded-full text-slate-700 font-black text-sm">
                  {formatEther(prizes[1])} ETH
                </div>
              )}
            </motion.div>
          </div>

          {/* Gold - 1st */}
          <div className="flex-[1.2] flex flex-col items-center justify-end h-full">
            {rank1Players.length > 0 && <Trophy size={40} className="text-amber-400 mb-2 drop-shadow-md" fill="currentColor" />}
            {rank1Players.length > 0 && renderAvatars(rank1Players, "text-[#7C3AED]")}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "70%" }}
              className="w-full bg-amber-300 rounded-t-[24px] border-x-4 border-t-4 border-amber-400 flex justify-center items-center overflow-hidden shadow-inner relative"
            >
              <span className="text-[140px] font-black text-amber-900/50 drop-shadow-sm absolute">1</span>
              {prizes[0] > 0n && (
                <div className="absolute top-6 bg-white/60 px-4 py-1.5 rounded-full text-amber-900 font-black text-base">
                  {formatEther(prizes[0])} ETH
                </div>
              )}
            </motion.div>
          </div>

          {/* Bronze - 3rd */}
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            {rank3Players.length > 0 && renderAvatars(rank3Players, "text-orange-600")}
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "40%" }}
              className="w-full bg-orange-300 rounded-t-[24px] border-x-4 border-t-4 border-orange-400 flex justify-center items-center overflow-hidden shadow-inner relative"
            >
              <span className="text-8xl font-black text-orange-900/50 absolute">3</span>
              {prizes[2] > 0n && (
                <div className="absolute top-4 bg-white/60 px-3 py-1 rounded-full text-orange-900 font-black text-sm">
                  {formatEther(prizes[2])} ETH
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>

      {/* Right: The Claim Card & AFK Hatch */}
      <div className="w-full md:w-[400px] flex flex-col gap-6 mt-8 md:mt-16">
        
        <div className="bg-white rounded-[32px] border-4 border-purple-200 p-8 shadow-2xl relative flex flex-col items-center text-center">
          
          {myRank !== -1 && myPrize > 0n ? (
            <>
              <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-6 border-4 border-amber-200 relative z-10">
                <Gift size={40} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-700 mb-1 relative z-10">You're a Winner!</h2>
              <div className="text-6xl font-black text-[#7C3AED] mb-8 relative z-10 tracking-tight drop-shadow-sm">
                {formatEther(myPrize)} ETH
              </div>

              {!myData?.claimed ? (
                <PlayfulButton 
                  variant="purple" 
                  size="xl" 
                  className="w-full text-xl py-6 z-10 shadow-xl disabled:opacity-50 mb-4"
                  onClick={handleClaim}
                  disabled={isPending}
                >
                  <Wallet className="mr-3 h-6 w-6" />
                  {isPending ? "Claiming..." : "Claim Prize"}
                </PlayfulButton>
              ) : (
                <div className="w-full bg-[#10B981] text-white rounded-[20px] py-4 text-xl font-extrabold border-b-[6px] border-[#047857] flex items-center justify-center gap-2 z-10 shadow-lg mb-4">
                  Prize Claimed! <Wallet size={24} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6 border-4 border-slate-200 relative z-10">
                <Frown size={40} />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-700 mb-2 relative z-10">Good effort!</h2>
              <p className="text-slate-500 font-medium mb-8 relative z-10">
                You didn't make it to the top 3 this time. Keep learning and try again!
              </p>
            </>
          )}

          {myData && myData.score >= PASS_THRESHOLD && (
             !myData.diplomaClaimed ? (
               <button 
                 onClick={handleClaimDiploma}
                 disabled={isPending}
                 className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-[20px] py-4 text-lg border-b-[4px] border-slate-300 flex items-center justify-center gap-2 z-10 shadow-sm transition-all disabled:opacity-50"
               >
                 <Award className="h-6 w-6" />
                 Claim NFT Diploma
               </button>
             ) : (
               <div className="w-full bg-[#3B82F6] text-white rounded-[20px] py-4 text-lg font-extrabold border-b-[6px] border-[#1D4ED8] flex items-center justify-center gap-2 z-10 shadow-lg">
                 Diploma Claimed! <Award size={24} />
               </div>
             )
          )}
          
          {myData && myData.score < PASS_THRESHOLD && (
             <div className="w-full bg-slate-50 text-slate-400 rounded-[20px] py-3 text-sm font-bold border-2 border-slate-100 flex items-center justify-center gap-2 z-10">
               Did not meet passing score for diploma
             </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
