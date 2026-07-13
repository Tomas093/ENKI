"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Users, Clock, AlertTriangle, CheckSquare, Eye, Trophy, Target, Award } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useReadContracts, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";

import KahootGameABI from '@/core/blockchain/abi/KahootGame.json';
import { useFinalLeaderboard } from '@/features/game/useFinalLeaderboard';

export default function GameDashboardPage({ params }: { params: Promise<{ address: string }> }) {
  const router = useRouter();
  const { address } = use(params);

  const { data: contractData } = useReadContracts({
    contracts: [
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePool' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'entryFee' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'gameName' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'currentQuestionId' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'isFinished' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizesCalculated' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'totalQuestions' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'professor' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'lastActionTime' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'professorPrize' },
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'professorPrizeClaimed' }
    ],
    query: { refetchInterval: 2000 }
  });

  const prizePool = contractData?.[0]?.result as bigint | undefined;
  const entryFee = contractData?.[1]?.result as bigint | undefined;
  const gameName = contractData?.[2]?.result as string | undefined;
  const currentQuestionId = contractData?.[3]?.result as bigint | undefined;
  const isFinished = contractData?.[4]?.result as boolean | undefined;
  const prizesCalculated = contractData?.[5]?.result as boolean | undefined;
  const totalQuestions = contractData?.[6]?.result as bigint | undefined;
  const professor = contractData?.[7]?.result as `0x${string}` | undefined;
  const lastActionTime = contractData?.[8]?.result as bigint | undefined;
  const professorPrize = contractData?.[9]?.result as bigint | undefined;
  const professorPrizeClaimed = contractData?.[10]?.result as boolean | undefined;

  const effectivelyPrizesCalculated = Boolean(prizesCalculated) || (isFinished && prizePool === 0n);

  const [gameId, setGameId] = useState<number | null>(null);

  useEffect(() => {
    if (!professor) return;
    const fetchId = async () => {
      try {
        const res = await fetch(`/api/professor/${professor}/games`);
        if (res.ok) {
          const data = await res.json();
          const match = data.games?.find((g: any) => g.address.toLowerCase() === address.toLowerCase());
          if (match) {
            setGameId(match.id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch gameId", err);
      }
    };
    fetchId();
  }, [professor, address]);

  const connectedPlayers = (prizePool !== undefined && entryFee !== undefined && entryFee > 0n) 
    ? Number(prizePool / entryFee) 
    : 0;
  const prizePoolEth = prizePool ? formatEther(prizePool) : "0.00";

  const { data: roundData } = useReadContract({
    address: address as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'rondas',
    args: currentQuestionId !== undefined ? [currentQuestionId] : undefined,
    query: { 
      enabled: currentQuestionId !== undefined && totalQuestions !== undefined && currentQuestionId < totalQuestions,
      refetchInterval: 2000 
    }
  });

  const commitPhaseOpen = roundData ? (roundData as any)[1] : false;
  const revealPhaseOpen = roundData ? (roundData as any)[2] : false;

  const [gameData, setGameData] = useState<any>(null);
  useEffect(() => {
    const data = localStorage.getItem("current_kahoot_session");
    if (data) setGameData(JSON.parse(data));
  }, []);

  const qIndex = currentQuestionId !== undefined ? Number(currentQuestionId) : -1;
  const activeQuestion = gameData && qIndex >= 0 && qIndex < gameData.questions.length ? gameData.questions[qIndex] : null;
  const timeLimit = activeQuestion ? (activeQuestion.timeLimit || 30) : 30;

  const [timeLeft, setTimeLeft] = useState<number>(timeLimit);
  
  useEffect(() => {
    if (!commitPhaseOpen || !lastActionTime) {
      setTimeLeft(timeLimit);
      return;
    }
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - Number(lastActionTime);
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [commitPhaseOpen, lastActionTime, timeLimit]);

  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });
  const isStarting = isWritePending || isWaiting;

  // Final Leaderboard Hook (only relevant at the end)
  const { participants, loading: leaderboardLoading, prizes, PASS_THRESHOLD } = useFinalLeaderboard(address, txHash || null);

  const handleStartNextQuestion = () => {
    if (!activeQuestion) return;
    
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'startNextQuestion',
      args: [
        activeQuestion.hashVerificacionPregunta,
        activeQuestion.hashRespuestaCorrecta,
        activeQuestion.merkleProof
      ]
    });
  };

  const handleCloseAndReveal = () => {
    if (!activeQuestion) return;
    const correctOption = activeQuestion.answers.findIndex((a: any) => a.correct);
    
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'closeQuestionAndStartReveal',
      args: [correctOption, activeQuestion.saltRespuesta]
    });
  };

  const handleAdvance = () => {
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'advanceToNextQuestion'
    });
  };

  const handleCalculatePrizes = () => {
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'calculatePrizes'
    });
  };

  const handleClaimProfessorPrize = () => {
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'claimPrize'
    });
  };

  let phaseLabel = "WAITING";
  let hostActionBtn = null;
  let statusBanner = null;

  if (effectivelyPrizesCalculated) {
    phaseLabel = "FINISHED";
    statusBanner = <div className="bg-black text-white p-4 font-black uppercase text-center border-2 border-black">Game Over - {prizePool === 0n ? 'No Prizes to distribute' : 'Prizes Distributed!'}</div>;
  } else if (isFinished) {
    phaseLabel = "CALCULATE";
    statusBanner = <div className="bg-[#FF3366] text-black p-4 font-black uppercase text-center border-2 border-black shadow-[4px_4px_0px_#000] mb-6">All questions finished.</div>;
    hostActionBtn = (
      <button 
        onClick={handleCalculatePrizes} 
        disabled={isStarting}
        className="w-full bg-[#FFE234] text-black border-2 border-black shadow-[6px_6px_0px_#000] hover:bg-yellow-400 active:translate-x-1 active:translate-y-1 active:shadow-none font-black uppercase text-[16px] tracking-wide px-8 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        <AlertTriangle size={24} strokeWidth={3} />
        {isStarting ? "Processing..." : "Calculate Prizes"}
      </button>
    );
  } else if (revealPhaseOpen) {
    const isLastQuestion = totalQuestions !== undefined && currentQuestionId !== undefined && Number(currentQuestionId) === Number(totalQuestions) - 1;
    phaseLabel = "REVEAL";
    statusBanner = <div className="bg-[#39FF14] text-black p-4 font-black uppercase text-center border-2 border-black shadow-[4px_4px_0px_#000] mb-6 flex items-center justify-center gap-2"><Eye size={20}/> Students can see results</div>;
    hostActionBtn = (
      <button 
        onClick={handleAdvance} 
        disabled={isStarting}
        className="w-full bg-black text-white border-2 border-black shadow-[6px_6px_0px_#000] hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none font-black uppercase text-[16px] tracking-wide px-8 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        <ArrowLeft size={24} strokeWidth={3} className="rotate-180" />
        {isStarting ? "Processing..." : (isLastQuestion ? "FINISH GAME" : "Advance to Next Question")}
      </button>
    );
  } else if (commitPhaseOpen) {
    phaseLabel = "COMMIT";
    const timeIsUp = timeLeft === 0;
    
    statusBanner = (
      <div className={`p-4 font-black uppercase text-center border-2 border-black shadow-[4px_4px_0px_#000] mb-6 flex items-center justify-center gap-2 ${timeIsUp ? 'bg-[#FF3366] text-white animate-pulse' : 'bg-white text-black'}`}>
        <Clock size={20}/> 
        {timeIsUp ? "TIME IS UP! Close the question." : `Students are answering...`}
      </div>
    );
    hostActionBtn = (
      <button 
        onClick={handleCloseAndReveal} 
        disabled={isStarting}
        className={`w-full border-2 border-black shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none font-black uppercase text-[16px] tracking-wide px-8 py-4 transition-all disabled:opacity-50 flex items-center justify-center gap-3 ${timeIsUp ? 'bg-[#FF3366] text-black hover:bg-red-500' : 'bg-black text-white hover:bg-gray-800'}`}
      >
        <CheckSquare size={24} strokeWidth={3} />
        {isStarting ? "Processing..." : "Close Question & Reveal"}
      </button>
    );
  } else if (currentQuestionId !== undefined) {
    const isFirst = currentQuestionId === 0n;
    phaseLabel = "READY";
    statusBanner = <div className="bg-[#33CCFF] text-black p-4 font-black uppercase text-center border-2 border-black shadow-[4px_4px_0px_#000] mb-6">Ready to launch {isFirst ? "the game" : `Question ${Number(currentQuestionId) + 1}`}</div>;
    hostActionBtn = (
      <button 
        onClick={handleStartNextQuestion} 
        disabled={isStarting}
        className="w-full bg-[#FFE234] text-black border-2 border-black shadow-[6px_6px_0px_#000] hover:bg-yellow-400 active:translate-x-1 active:translate-y-1 active:shadow-none font-black uppercase text-[16px] tracking-wide px-8 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        <Play size={24} fill="currentColor" strokeWidth={3} />
        {isStarting ? "Processing..." : (isFirst ? "START GAME" : "LAUNCH NEXT QUESTION")}
      </button>
    );
  }

  const progressPercent = totalQuestions ? ((Math.min(Number(currentQuestionId) + (isFinished ? 0 : 1), Number(totalQuestions))) / Number(totalQuestions)) * 100 : 0;
  
  const avgScore = participants.length > 0 
    ? Math.round(participants.reduce((acc, p) => acc + p.score, 0) / participants.length)
    : 0;

  const passedPlayers = participants.filter(p => p.score >= PASS_THRESHOLD).length;

  return (
    <div className="w-full min-h-screen bg-[#F4F4F0] flex flex-col relative">
      
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>

      <div className="max-w-5xl mx-auto w-full relative z-10 px-4 md:px-8 py-10 flex flex-col gap-8">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => router.back()}
              className="bg-white border-2 border-black text-black shadow-[2px_2px_0px_#000] hover:bg-gray-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wide font-black text-xs px-4 py-2 flex items-center gap-2 w-max"
            >
              <ArrowLeft size={14} strokeWidth={3} /> BACK TO LIST
            </button>
            <h1 className="text-[40px] md:text-[56px] font-black uppercase tracking-[-0.03em] leading-none text-black">
              {gameName || "SESSION"}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {(gameId !== null || gameData?.gameId !== undefined) && (
                <div className="bg-[#FFE234] border-2 border-black text-black font-black px-3 py-1 text-[12px] uppercase tracking-wide shadow-[2px_2px_0px_#000]">
                  ID: {gameId !== null ? gameId : gameData?.gameId}
                </div>
              )}
              <div className={`border-2 border-black font-mono font-bold px-3 py-1 text-[12px] uppercase tracking-wide shadow-[2px_2px_0px_#000] ${effectivelyPrizesCalculated ? 'bg-black text-white' : 'bg-black text-[#39FF14]'}`}>
                {phaseLabel} {effectivelyPrizesCalculated ? "" : "PHASE"}
              </div>
            </div>
          </div>

          {!effectivelyPrizesCalculated && (
            <div className="flex gap-4">
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center min-w-[120px]">
                <Users size={24} className="text-[#FF3366] mb-1" strokeWidth={2.5} />
                <span className="text-[28px] font-black text-black leading-none">{connectedPlayers}</span>
                <span className="text-xs font-black text-gray-500 uppercase tracking-wide mt-1">PLAYERS</span>
              </div>
              <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000] flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-[#39FF14] bg-black border-2 border-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mb-1">Ξ</div>
                <span className="text-[28px] font-black text-black leading-none">{prizePoolEth}</span>
                <span className="text-xs font-black text-gray-500 uppercase tracking-wide mt-1">POOL (ETH)</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── ACTIVE GAME UI ───────────────────────────────────────────────────────── */}
        {!effectivelyPrizesCalculated && (
          <>
            {activeQuestion && !isFinished && (
              <div className="bg-white border-4 border-black p-6 md:p-10 shadow-[12px_12px_0px_#000] flex flex-col gap-6 relative mt-4">
                <div className="absolute -top-4 -left-4 bg-[#FF3366] text-white border-2 border-black px-4 py-1 font-black text-[14px] uppercase tracking-wide shadow-[4px_4px_0px_#000]">
                  Q. {Number(currentQuestionId) + 1} / {Number(totalQuestions)}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mt-4">
                  <div className="flex-1">
                    <h2 className="text-[28px] md:text-[36px] font-black leading-[1.1] text-black">
                      {activeQuestion.question}
                    </h2>
                  </div>
                  
                  {commitPhaseOpen && (
                    <div className="flex flex-col items-center justify-center bg-black text-white p-4 border-4 border-black min-w-[140px] shrink-0 shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
                      <span className="text-[48px] font-black leading-none" style={{ color: timeLeft <= 5 ? '#FF3366' : '#39FF14' }}>
                        {timeLeft}s
                      </span>
                      <span className="text-xs uppercase tracking-wide mt-2 font-bold text-gray-400">Time Left</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4">
              {statusBanner}
              {hostActionBtn}
            </div>

            {totalQuestions && (
              <div className="mt-12 mb-20 flex flex-col gap-2">
                <div className="flex justify-between font-black text-[12px] uppercase tracking-wide text-black">
                  <span>Game Progress</span>
                  <span>{Math.floor(progressPercent)}%</span>
                </div>
                <div className="w-full h-6 bg-white border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
                  <div 
                    className="h-full bg-black transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ─── FINAL LEADERBOARD (PROFESSOR VIEW) ─────────────────────────────────── */}
        {effectivelyPrizesCalculated && (
          <div className="flex flex-col gap-8 mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#000] flex flex-col items-center text-center">
                <Users size={32} className="text-[#FF3366] mb-2" />
                <span className="text-4xl font-black">{participants.length}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-1">Total Players</span>
              </div>
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#000] flex flex-col items-center text-center">
                <Target size={32} className="text-[#33CCFF] mb-2" />
                <span className="text-4xl font-black">{avgScore}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-1">Average Score</span>
              </div>
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#000] flex flex-col items-center text-center">
                <Award size={32} className="text-[#FFE234] mb-2" />
                <span className="text-4xl font-black">{passedPlayers}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-1">Passed (Diplomas)</span>
              </div>
              <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#000] flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-black text-[#39FF14] flex items-center justify-center font-bold mb-2">Ξ</div>
                <span className="text-4xl font-black">{prizePoolEth}</span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-1">Total Pool (ETH)</span>
              </div>
            </div>

            {/* Professor Reward Section */}
            {professorPrize !== undefined && professorPrize > 0n && (
              <div className="bg-[#39FF14] border-4 border-black p-8 shadow-[8px_8px_0px_#000] flex flex-col md:flex-row items-center justify-between gap-6 mt-6">
                <div>
                  <h3 className="text-[24px] font-black uppercase tracking-tight text-black mb-1">Host Commission</h3>
                  <p className="text-black/80 font-bold">You earned a cut of the prize pool for hosting.</p>
                  <p className="text-4xl font-black text-black mt-2">{formatEther(professorPrize)} ETH</p>
                </div>
                <button
                  onClick={handleClaimProfessorPrize}
                  disabled={isStarting || professorPrizeClaimed}
                  className={`px-8 py-4 border-4 border-black font-black uppercase text-[16px] tracking-wide transition-all ${professorPrizeClaimed ? 'bg-white text-gray-500 opacity-50 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none'}`}
                >
                  {isStarting ? "Processing..." : (professorPrizeClaimed ? "✓ CLAIMED" : "CLAIM REWARD")}
                </button>
              </div>
            )}

            {/* Detailed Leaderboard Table */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_#000] overflow-hidden">
              <div className="bg-black text-white p-4 font-black uppercase tracking-wide flex items-center gap-2">
                <Trophy size={20} className="text-[#FFE234]" /> Final Rankings
              </div>
              <div className="p-0">
                {leaderboardLoading ? (
                  <div className="p-8 text-center font-bold text-gray-500 animate-pulse">Loading rankings...</div>
                ) : participants.length === 0 ? (
                  <div className="p-8 text-center font-bold text-gray-500">No participants played this game.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black bg-gray-50">
                        <th className="p-4 font-black text-[12px] uppercase tracking-wide text-gray-500">Rank</th>
                        <th className="p-4 font-black text-[12px] uppercase tracking-wide text-gray-500">Player</th>
                        <th className="p-4 font-black text-[12px] uppercase tracking-wide text-gray-500 text-right">Score</th>
                        <th className="p-4 font-black text-[12px] uppercase tracking-wide text-gray-500 text-right">Diploma</th>
                        <th className="p-4 font-black text-[12px] uppercase tracking-wide text-gray-500 text-right">Prize</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p, index) => {
                        const isWinner = index < 3 && prizes[index] > 0n;
                        const passed = p.score >= PASS_THRESHOLD;
                        return (
                          <tr key={p.wallet} className="border-b-2 border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-black font-black text-[14px] ${index === 0 ? 'bg-[#FFE234]' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-[#CD7F32]' : 'bg-white'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-[14px]">
                              {p.nickname ? (
                                <span className="font-bold text-black">{p.nickname}</span>
                              ) : (
                                <span className="font-mono text-gray-500">{p.wallet.slice(0,6)}...{p.wallet.slice(-4)}</span>
                              )}
                            </td>
                            <td className="p-4 font-black text-[20px] text-right">
                              {p.score}
                            </td>
                            <td className="p-4 text-right">
                              {passed ? (
                                p.diplomaClaimed ? (
                                  <span className="inline-block bg-[#39FF14] text-black border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-wide">✓ Claimed</span>
                                ) : (
                                  <span className="inline-block bg-[#33CCFF] text-black border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-wide shadow-[2px_2px_0px_#000]">Qualified</span>
                                )
                              ) : (
                                <span className="inline-block bg-gray-100 text-gray-400 border-2 border-gray-300 px-2 py-1 text-xs font-black uppercase tracking-wide">Failed</span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              {isWinner ? (
                                <div className="flex flex-col items-end gap-1.5">
                                  <span className="font-black text-black">{formatEther(prizes[index])} ETH</span>
                                  {p.claimed ? (
                                    <span className="inline-block bg-[#39FF14] text-black border-2 border-black px-2 py-1 text-[9px] font-black uppercase tracking-wide">✓ Claimed</span>
                                  ) : (
                                    <span className="inline-block bg-[#FF3366] text-white border-2 border-black px-2 py-1 text-[9px] font-black uppercase tracking-wide shadow-[2px_2px_0px_#000]">Unclaimed</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-300 font-bold">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
