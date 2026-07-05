"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Play, Lock, Eye, ArrowRight, Trophy, Loader2 } from "lucide-react";
import { useWriteContract, usePublicClient } from "wagmi";
import toast from "react-hot-toast";
import KahootGameABI from "../../../abi/KahootGame.json";

type Answer = { text: string; correct: boolean };
type Question = { id: number; question: string; answers: Answer[]; timeLimit: number; saltPregunta: string; saltRespuesta: string; };
type GameData = { title: string; stakeAmount: string; questions: Question[] };

export default function TeacherPlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game");

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"IDLE" | "COMMIT_OPEN" | "REVEAL_OPEN" | "FINISHED">("IDLE");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (phase === "COMMIT_OPEN" && timeLeft !== null && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, timeLeft]);

  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [isWaiting, setIsWaiting] = useState(false);
  const isPending = isWriting || isWaiting;

  useEffect(() => {
    const data = localStorage.getItem("current_kahoot_session");
    if (data) {
      setGameData(JSON.parse(data));
    } else {
      toast.error("No active session found in local storage.");
      router.push("/host/dashboard");
    }
  }, [router]);

  if (!gameData || !gameAddress) {
    return <div className="p-10 text-center font-bold text-slate-500">Loading Game Data...</div>;
  }

  const currentQ = gameData.questions[currentIndex];
  const isLastQuestion = currentIndex === gameData.questions.length - 1;

  const handleLaunchQuestion = async () => {
    try {
      const tx = await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: "startNextQuestion",
        args: [
          `${currentQ.question}||${currentQ.timeLimit || 30}`,
          [currentQ.answers[0].text, currentQ.answers[1].text, currentQ.answers[2].text, currentQ.answers[3].text],
          currentQ.saltPregunta,
        ]
      });
      setIsWaiting(true);
      await publicClient?.waitForTransactionReceipt({ hash: tx });
      setIsWaiting(false);
      setPhase("COMMIT_OPEN");
      setTimeLeft(currentQ.timeLimit || 30);
    } catch (error) {
      console.error(error);
      setIsWaiting(false);
      toast.error("Transaction failed or was rejected.");
    }
  };

  const handleCloseAndReveal = async () => {
    const correctIdx = currentQ.answers.findIndex(a => a.correct);
    try {
      const tx = await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: "closeQuestionAndStartReveal",
        args: [correctIdx, currentQ.saltRespuesta],
      });
      setIsWaiting(true);
      await publicClient?.waitForTransactionReceipt({ hash: tx });
      setIsWaiting(false);
      setPhase("REVEAL_OPEN");
    } catch (error) {
      console.error(error);
      setIsWaiting(false);
      toast.error("Transaction failed or was rejected.");
    }
  };

  const handleNextQuestion = async () => {
    try {
      const tx = await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: "advanceToNextQuestion",
      });
      setIsWaiting(true);
      await publicClient?.waitForTransactionReceipt({ hash: tx });
      setIsWaiting(false);
      if (isLastQuestion) {
        setPhase("FINISHED");
      } else {
        setCurrentIndex(prev => prev + 1);
        setPhase("IDLE");
      }
    } catch (error) {
      console.error(error);
      setIsWaiting(false);
      toast.error("Transaction failed or was rejected.");
    }
  };

  const handleFinishGame = async () => {
    try {
      const tx = await writeContractAsync({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        functionName: "calculatePrizes",
      });
      console.log("Prizes calculated tx:", tx);
      router.push(`/teacher/session/${gameAddress}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to calculate prizes. They might be already calculated.");
      router.push(`/teacher/session/${gameAddress}`);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pt-8 pb-20 gap-8 relative z-10 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-slate-800 text-3xl md:text-4xl tracking-tight">Host Control Panel</h1>
          <p className="text-slate-400 font-semibold mt-1">
            {gameData.title} • Contract: <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{gameAddress}</span>
          </p>
        </div>
      </motion.div>

      {/* Main Panel */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm overflow-hidden flex flex-col"
      >
        {phase !== "FINISHED" ? (
          <>
            {/* Progress Bar */}
            <div className="h-2 bg-slate-100 w-full">
              <div 
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${((currentIndex) / gameData.questions.length) * 100}%` }}
              />
            </div>

            <div className="p-8 md:p-12 flex flex-col items-center text-center gap-6">
              <span className="font-black text-purple-600 bg-purple-50 px-4 py-1.5 rounded-full text-sm uppercase tracking-widest">
                Question {currentIndex + 1} of {gameData.questions.length}
              </span>

              <h2 className="font-black text-slate-800 text-3xl md:text-4xl leading-tight max-w-2xl">
                {currentQ.question}
              </h2>

              <div className="flex gap-4 items-center justify-center mt-4">
                <div className={`px-5 py-2 rounded-[12px] font-bold text-sm ${phase === 'IDLE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                  1. Idle
                </div>
                <div className={`h-1 w-8 rounded-full ${phase === 'COMMIT_OPEN' ? 'bg-purple-400' : 'bg-slate-200'}`} />
                <div className={`px-5 py-2 rounded-[12px] font-bold text-sm ${phase === 'COMMIT_OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                  2. Receiving Answers
                </div>
                <div className={`h-1 w-8 rounded-full ${phase === 'REVEAL_OPEN' ? 'bg-purple-400' : 'bg-slate-200'}`} />
                <div className={`px-5 py-2 rounded-[12px] font-bold text-sm ${phase === 'REVEAL_OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  3. Revealing
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col md:flex-row gap-4 w-full max-w-md">
                {phase === "IDLE" && (
                  <button
                    onClick={handleLaunchQuestion}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-4 rounded-[16px] shadow-lg shadow-purple-200 transition-all hover:-translate-y-1 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                    Broadcast Question
                  </button>
                )}

                {phase === "COMMIT_OPEN" && (
                  <button
                    onClick={handleCloseAndReveal}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-black px-6 py-4 rounded-[16px] shadow-lg shadow-rose-200 transition-all hover:-translate-y-1 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : <Lock size={20} />}
                    Lock Answers & Start Reveal
                  </button>
                )}

                {phase === "REVEAL_OPEN" && (
                  <button
                    onClick={handleNextQuestion}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-4 rounded-[16px] shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : (isLastQuestion ? <Trophy size={20} /> : <ArrowRight size={20} />)}
                    {isLastQuestion ? "Finish Game" : "Advance to Next Question"}
                  </button>
                )}
              </div>
              
              {/* Timer UI */}
              {phase === "COMMIT_OPEN" && timeLeft !== null && (
                <div className={`mt-6 p-4 rounded-[16px] border-[3px] w-full max-w-md flex flex-col items-center justify-center transition-all ${
                  timeLeft === 0 
                    ? "bg-red-50 border-red-400 text-red-600 scale-105 shadow-xl animate-pulse" 
                    : timeLeft <= 5 
                      ? "bg-orange-50 border-orange-400 text-orange-600 scale-105"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <span className="font-black text-4xl md:text-5xl tabular-nums tracking-tight">
                    00:{timeLeft.toString().padStart(2, "0")}
                  </span>
                  <span className="font-bold text-sm uppercase tracking-widest mt-1 opacity-80">
                    {timeLeft === 0 ? "🚨 TIME'S UP! LOCK ANSWERS NOW 🚨" : "Time Remaining"}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 flex flex-col items-center text-center gap-6">
             <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 mb-2">
                <Trophy size={48} />
             </div>
             <h2 className="font-black text-slate-800 text-4xl">Game Finished!</h2>
             <p className="text-slate-500 font-medium text-lg">All questions have been revealed.</p>
              <button
                onClick={handleFinishGame}
                disabled={isPending}
                className="mt-6 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-black px-8 py-4 rounded-[16px] shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="animate-spin" /> : "Calculate Prizes & View Results"}
              </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
