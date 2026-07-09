"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Users } from "lucide-react";
import { PageBlobs } from "../../../../components/ui/PageBlobs";
import { Button } from "../../../../components/ui/Button";
import { use, useEffect, useState } from "react";
import { useReadContracts, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import KahootGameABI from "../../../../abi/KahootGame.json";

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
      { address: address as `0x${string}`, abi: KahootGameABI.abi, functionName: 'professor' }
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
    functionName: 'listaDeRondas',
    args: currentQuestionId !== undefined ? [currentQuestionId] : undefined,
    query: { 
      enabled: currentQuestionId !== undefined && totalQuestions !== undefined && currentQuestionId < totalQuestions,
      refetchInterval: 2000 
    }
  });

  const commitPhaseOpen = roundData ? (roundData as any)[2] : false;
  const revealPhaseOpen = roundData ? (roundData as any)[3] : false;

  const [gameData, setGameData] = useState<any>(null);
  useEffect(() => {
    const data = localStorage.getItem("current_kahoot_session");
    if (data) setGameData(JSON.parse(data));
  }, []);

  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    if (!isFinished || prizesCalculated) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, prizesCalculated]);

  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });
  const isStarting = isWritePending || isWaiting;

  const handleStartNextQuestion = () => {
    if (!gameData || currentQuestionId === undefined) return;
    const qIndex = Number(currentQuestionId);
    if (qIndex >= gameData.questions.length) return;
    const q = gameData.questions[qIndex];
    const enunciado = `${q.question}||${q.timeLimit || 30}`;
    const opciones = [q.answers[0].text, q.answers[1].text, q.answers[2].text, q.answers[3].text];
    
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'startNextQuestion',
      args: [enunciado, opciones, q.saltPregunta]
    });
  };

  const handleCloseAndReveal = () => {
    if (!gameData || currentQuestionId === undefined) return;
    const qIndex = Number(currentQuestionId);
    const q = gameData.questions[qIndex];
    const correctOption = q.answers.findIndex((a: any) => a.correct);
    
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'closeQuestionAndStartReveal',
      args: [correctOption, q.saltRespuesta]
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

  let hostAction = null;
  let statusText = "Loading...";

  if (prizesCalculated) {
    statusText = "Game Over - Prizes Distributed!";
    hostAction = <Button variant="secondary" size="md" disabled>Finished</Button>;
  } else if (isFinished) {
    if (countdown > 0) {
      statusText = `Waiting for students to reveal answers... (${countdown}s)`;
      hostAction = (
        <Button variant="secondary" size="md" disabled className="relative overflow-hidden w-full md:w-auto">
          <div 
            className="absolute left-0 top-0 bottom-0 bg-slate-200/50 transition-all duration-1000 ease-linear"
            style={{ width: `${((20 - countdown) / 20) * 100}%` }}
          />
          <span className="relative z-10 tabular-nums">Processing Answers... {countdown}s</span>
        </Button>
      );
    } else {
      statusText = "All questions finished. Calculate prizes!";
      hostAction = (
        <Button 
          variant="primary" 
          size="md" 
          onClick={handleCalculatePrizes} 
          disabled={isStarting}
          className="transition-colors duration-200 ease-in-out w-full md:w-auto"
        >
          {isStarting ? "Processing..." : "Calculate Prizes"}
        </Button>
      );
    }
  } else if (revealPhaseOpen) {
    statusText = `Question ${Number(currentQuestionId) + 1} - Reveal Phase Active. Students can see results.`;
    hostAction = <Button variant="primary" size="md" onClick={handleAdvance} disabled={isStarting}>{isStarting ? "Processing..." : "Advance to Next Question"}</Button>;
  } else if (commitPhaseOpen) {
    statusText = `Question ${Number(currentQuestionId) + 1} - Commit Phase Active. Students are answering!`;
    hostAction = <Button variant="primary" size="md" onClick={handleCloseAndReveal} disabled={isStarting}>{isStarting ? "Processing..." : "Close Question & Start Reveal"}</Button>;
  } else if (currentQuestionId !== undefined) {
    // Neither is open -> ready to start next question (or first question)
    const isFirst = currentQuestionId === 0n;
    statusText = isFirst ? "Ready to start the game." : `Ready for Question ${Number(currentQuestionId) + 1}.`;
    const btnText = isFirst ? "Start Game" : "Start Next Question";
    hostAction = (
      <Button variant="primary" size="md" leftIcon={<Play size={18} />} onClick={handleStartNextQuestion} disabled={isStarting}>
        {isStarting ? "Processing..." : btnText}
      </Button>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col px-4 md:px-8 lg:px-12 py-10 relative bg-slate-50">
      <PageBlobs primary="purple" secondary="blue" />
      <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col gap-8">
        
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors duration-200 self-start font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Back to Sessions
        </button>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800">
                {gameName ? gameName : "Session Dashboard"}
              </h1>
              {gameId !== null && (
                <span className="bg-purple-100 text-purple-700 text-sm font-extrabold px-3 py-1 rounded-lg font-mono">
                  Game ID: {gameId}
                </span>
              )}
            </div>
            <p className="text-slate-600 font-medium text-base font-mono">
              {address}
            </p>
          </div>
          {hostAction}
        </header>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 text-slate-700 font-semibold flex items-center justify-between">
           <span>Status: <span className="text-purple-600">{statusText}</span></span>
           {totalQuestions && currentQuestionId !== undefined && (
             <span>Progress: {Math.min(Number(currentQuestionId) + (isFinished ? 0 : 1), Number(totalQuestions))} / {Number(totalQuestions)}</span>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-slate-700">
              <Users size={20} className="text-purple-600" />
              <h3 className="font-bold text-lg">Connected Players</h3>
            </div>
            <p className="text-4xl font-black text-slate-800">{connectedPlayers}</p>
            <p className="text-sm text-slate-500 font-medium">Updated live based on stakes</p>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-slate-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                Ξ
              </div>
              <h3 className="font-bold text-lg">Prize Pool</h3>
            </div>
            <p className="text-4xl font-black text-emerald-600">{prizePoolEth} ETH</p>
            <p className="text-sm text-slate-500 font-medium">Total stakes accumulated</p>
          </div>
        </div>

      </div>
    </div>
  );
}
