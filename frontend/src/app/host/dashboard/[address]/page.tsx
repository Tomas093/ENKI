"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Users } from "lucide-react";
import { PageBlobs } from "../../../../components/ui/PageBlobs";
import { Button } from "../../../../components/ui/Button";
import { use, useEffect, useState } from "react";
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatEther } from "viem";
import KahootGameABI from "../../../../../abi/KahootGame.json";

export default function GameDashboardPage({ params }: { params: Promise<{ address: string }> }) {
  const router = useRouter();
  const { address } = use(params);

  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: address as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: 'prizePool',
      },
      {
        address: address as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: 'entryFee',
      },
      {
        address: address as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: 'gameName',
      }
    ],
    query: { refetchInterval: 2000 } // Refetch every 2 seconds to update player count
  });

  const prizePool = contractData?.[0]?.result as bigint | undefined;
  const entryFee = contractData?.[1]?.result as bigint | undefined;
  const gameName = contractData?.[2]?.result as string | undefined;

  const connectedPlayers = (prizePool !== undefined && entryFee !== undefined && entryFee > 0n) 
    ? Number(prizePool / entryFee) 
    : 0;

  const prizePoolEth = prizePool ? formatEther(prizePool) : "0.00";

  const [gameData, setGameData] = useState<any>(null);
  useEffect(() => {
    const data = localStorage.getItem("current_kahoot_session");
    if (data) setGameData(JSON.parse(data));
  }, []);

  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: txHash });

  const handleStartGame = () => {
    if (!gameData || !gameData.questions || gameData.questions.length === 0) return;
    const q = gameData.questions[0];
    const enunciado = `${q.question}||${q.timeLimit || 30}`;
    const opciones = [
      q.answers[0].text,
      q.answers[1].text,
      q.answers[2].text,
      q.answers[3].text
    ];
    
    writeContract({
      address: address as `0x${string}`,
      abi: KahootGameABI.abi,
      functionName: 'startNextQuestion',
      args: [enunciado, opciones, q.saltPregunta]
    });
  };

  const isStarting = isWritePending || isWaiting;

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
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-800 mb-2">
              {gameName ? gameName : "Session Dashboard"}
            </h1>
            <p className="text-slate-600 font-medium text-base font-mono">
              {address}
            </p>
          </div>
          <Button 
            variant="primary" 
            size="md" 
            leftIcon={<Play size={18} />}
            onClick={handleStartGame}
            disabled={isStarting}
          >
            {isStarting ? "Starting..." : "Start Game"}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-slate-700">
              <Users size={20} className="text-purple-600" />
              <h3 className="font-bold text-lg">Connected Players</h3>
            </div>
            <p className="text-4xl font-black text-slate-800">{connectedPlayers}</p>
            <p className="text-sm text-slate-500 font-medium">Waiting for players to join...</p>
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
