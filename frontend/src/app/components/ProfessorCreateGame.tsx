import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Zap, Trash2, PlusCircle, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { parseEther, encodePacked, keccak256 } from "viem";
import { kahootFactoryAbi, FACTORY_ADDRESS } from "../../lib/contracts";
import { useGame } from "../../lib/GameContext";

const OPTION_COLORS = [
  { color: "border-red-400", bg: "bg-red-50" },
  { color: "border-blue-400", bg: "bg-blue-50" },
  { color: "border-yellow-400", bg: "bg-yellow-50" },
  { color: "border-green-400", bg: "bg-green-50" },
];

interface Question {
  id: number;
  text: string;
  options: { id: number; text: string }[];
  correctOption: number;
  salt: string; // professor salt for this question, pre-generated
}

function createBlankQuestion(id: number): Question {
  return {
    id,
    text: "",
    options: [
      { id: 0, text: "" },
      { id: 1, text: "" },
      { id: 2, text: "" },
      { id: 3, text: "" },
    ],
    correctOption: 0,
    salt: crypto.randomUUID(),
  };
}

/**
 * Compute hashes exactly matching the Solidity contract:
 *
 * hashVerificacionPregunta = keccak256(abi.encodePacked(
 *   enunciado, opciones[0], opciones[1], opciones[2], opciones[3], saltProfesor
 * ))
 *
 * hashRespuestaCorrecta = keccak256(abi.encodePacked(
 *   uint8 correctOption, string saltProfesor, address professorAddress
 * ))
 */
function buildRondas(questions: Question[], professorAddress: `0x${string}`) {
  return questions.map((q) => {
    const opts = q.options.map((o) => o.text);
    const hashVerificacion = keccak256(
      encodePacked(
        ["string", "string", "string", "string", "string", "string"],
        [q.text, opts[0], opts[1], opts[2], opts[3], q.salt]
      )
    );
    const hashRespuesta = keccak256(
      encodePacked(
        ["uint8", "string", "address"],
        [q.correctOption as unknown as number, q.salt, professorAddress]
      )
    );
    return {
      hashVerificacionPregunta: hashVerificacion as `0x${string}`,
      hashRespuestaCorrecta: hashRespuesta as `0x${string}`,
      commitPhaseOpen: false,
      revealPhaseOpen: false,
    };
  });
}

export function ProfessorCreateGame() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { setGameAddress } = useGame();

  const [entryFeeEth, setEntryFeeEth] = useState("");
  const [passingScore, setPassingScore] = useState("");
  const [diplomaURI, setDiplomaURI] = useState("");
  const [questions, setQuestions] = useState<Question[]>([createBlankQuestion(0)]);

  // Read factory creation fee
  const { data: creationFee } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: kahootFactoryAbi,
    functionName: "creationFee",
  });

  const addQuestion = () => setQuestions((prev) => [...prev, createBlankQuestion(Date.now())]);
  const removeQuestion = (qId: number) => setQuestions((prev) => prev.filter((q) => q.id !== qId));
  const updateQuestionText = (qId: number, text: string) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, text } : q)));
  const updateOptionText = (qId: number, optId: number, text: string) =>
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, options: q.options.map((o) => (o.id === optId ? { ...o, text } : o)) } : q
      )
    );
  const setCorrect = (qId: number, optId: number) =>
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, correctOption: optId } : q)));

  // Validation
  const validationErrors: string[] = [];
  if (!address) validationErrors.push("Connect your wallet first.");
  if (questions.some((q) => !q.text.trim())) validationErrors.push("All questions must have text.");
  if (questions.some((q) => q.options.some((o) => !o.text.trim())))
    validationErrors.push("All answer options must be filled in.");
  const ps = parseInt(passingScore);
  if (isNaN(ps) || ps <= 0 || ps > questions.length)
    validationErrors.push(`Passing score must be between 1 and ${questions.length}.`);
  let entryFeeWei: bigint;
  try {
    entryFeeWei = parseEther(entryFeeEth);
  } catch {
    entryFeeWei = 0n;
    validationErrors.push("Invalid entry fee.");
  }

  // Write contract
  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess, data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash });

  // Extract deployed game address from logs
  const gameCreatedLog = txReceipt?.logs?.[0];
  const deployedGameAddress = gameCreatedLog?.topics?.[1]
    ? ("0x" + gameCreatedLog.topics[1].slice(26)) as `0x${string}`
    : undefined;

  const handlePublish = () => {
    if (validationErrors.length > 0 || !address) return;
    reset();
    const rondas = buildRondas(questions, address);

    // Persist question data so ProfessorDashboard can drive the game flow
    const stored = questions.map((q) => ({
      text: q.text,
      options: q.options.map((o) => o.text),
      correctOption: q.correctOption,
      salt: q.salt,
    }));
    sessionStorage.setItem("enki_professorQuestions", JSON.stringify(stored));
    const fee = (creationFee ?? 0n) > entryFeeWei ? creationFee! : entryFeeWei;

    writeContract({
      address: FACTORY_ADDRESS,
      abi: kahootFactoryAbi,
      functionName: "createGame",
      args: [
        BigInt(ps),
        BigInt(questions.length),
        diplomaURI,
        rondas,
        entryFeeWei,
      ],
      value: creationFee ?? 0n,
    });
  };

  // Store game address and navigate to dashboard on success
  React.useEffect(() => {
    if (isTxSuccess && deployedGameAddress) {
      setGameAddress(deployedGameAddress);
      navigate("/professor/dashboard");
    }
  }, [isTxSuccess, deployedGameAddress]);

  const isBusy = isPending || isTxLoading;

  return (
    <div className="min-h-screen relative font-sans text-slate-800 flex flex-col">
      {/* Main Layout */}
      <main className="relative z-10 flex-1 flex justify-center py-8 px-4">
        <div className="bg-white w-full max-w-4xl rounded-[24px] border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col gap-8">

          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Create a New Kahoot Game</h1>
            <p className="text-slate-500 font-medium">Configure parameters and build the question set — all goes on-chain.</p>
            {creationFee !== undefined && creationFee > 0n && (
              <p className="mt-2 text-sm font-semibold text-orange-600">
                ⚠️ Factory creation fee: {parseFloat(creationFee.toString()) / 1e18} ETH will be charged on top of the entry fee.
              </p>
            )}
          </div>

          {/* Global Settings */}
          <section className="bg-slate-50 p-6 rounded-[20px] border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Game Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Entry Fee (ETH)</label>
                <input
                  type="text"
                  value={entryFeeEth}
                  onChange={(e) => setEntryFeeEth(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Passing Score (# correct)</label>
                <input
                  type="number"
                  value={passingScore}
                  min={1}
                  max={questions.length}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Diploma Token URI</label>
                <input
                  type="text"
                  value={diplomaURI}
                  onChange={(e) => setDiplomaURI(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
            </div>
          </section>

          {/* Question Builder */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Question Builder
              <span className="ml-auto text-sm font-semibold text-slate-400">{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            </h2>

            <div className="flex flex-col gap-4">
              {questions.map((q, index) => (
                <div key={q.id} className="bg-white border-2 border-slate-200 rounded-[20px] p-6 shadow-sm flex flex-col gap-6 transition-all hover:border-purple-200">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Question {index + 1}</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">Salt: {q.salt.slice(0, 8)}…</span>
                      {questions.length > 1 && (
                        <button onClick={() => removeQuestion(q.id)} className="text-slate-300 hover:text-red-400 transition-colors" title="Remove question">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-5 py-4 text-xl font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    placeholder="Enter your question…"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((opt) => {
                      const palette = OPTION_COLORS[opt.id];
                      const isCorrect = q.correctOption === opt.id;
                      return (
                        <div key={opt.id} className={`flex items-center gap-3 border-2 ${palette.color} ${palette.bg} rounded-xl p-3 relative group transition-transform hover:scale-[1.02] ${isCorrect ? "ring-2 ring-offset-1 ring-emerald-400" : ""}`}>
                          <button type="button" onClick={() => setCorrect(q.id, opt.id)} className="flex-shrink-0 transition-transform hover:scale-110" title="Mark as correct">
                            <CheckCircle2 size={22} className={isCorrect ? "text-emerald-500" : "text-slate-300"} fill={isCorrect ? "currentColor" : "none"} />
                          </button>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                            className="bg-transparent border-none text-lg font-bold text-slate-800 w-full focus:outline-none focus:ring-0 p-0"
                            placeholder={`Option ${opt.id + 1}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addQuestion} className="flex items-center justify-center gap-2 w-full py-4 rounded-[20px] border-2 border-dashed border-purple-300 text-purple-600 font-bold hover:border-purple-500 hover:bg-purple-50 transition-all">
              <PlusCircle size={20} />
              Add Question
            </button>
          </section>

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-[16px] p-4 flex flex-col gap-2">
              {validationErrors.map((e, i) => (
                <p key={i} className="text-red-600 font-semibold text-sm flex items-center gap-2">
                  <AlertCircle size={14} /> {e}
                </p>
              ))}
            </div>
          )}

          {writeError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-[16px] p-4">
              <p className="text-red-600 font-semibold text-sm">{(writeError as Error).message?.slice(0, 200)}</p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t-2 border-dashed border-slate-200 flex justify-center">
            <button
              onClick={handlePublish}
              disabled={isBusy || validationErrors.length > 0}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xl px-12 py-5 rounded-[20px] shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgba(124,58,237,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isBusy ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  {isPending ? "Sign in MetaMask…" : "Deploying contract…"}
                </>
              ) : (
                <>
                  <Zap size={24} fill="currentColor" />
                  Publish &amp; Deploy On-Chain
                </>
              )}
            </button>
          </div>

          {isTxSuccess && deployedGameAddress && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-[16px] p-4 text-center">
              <p className="font-black text-emerald-700 text-lg">✅ Game deployed!</p>
              <p className="font-mono text-emerald-600 text-sm mt-1">{deployedGameAddress}</p>
              <p className="text-slate-500 text-sm mt-1">Redirecting to dashboard…</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
