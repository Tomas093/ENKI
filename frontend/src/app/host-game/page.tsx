"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Palette } from "lucide-react";
import toast from "react-hot-toast";
import { useWriteContract, useAccount, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { encodePacked, keccak256, parseEther, decodeEventLog } from "viem";
import KahootFactoryABI from '@/core/blockchain/abi/KahootFactory.json';
import { MerkleTree } from "merkletreejs";
import keccak256_buffer from "keccak256";
import { BrutalField } from '@/shared/ui/BrutalField';
import { ArcadeButton } from '@/shared/ui/ArcadeButton';
type Answer = { text: string; correct: boolean };
type Question = { id: number; question: string; answers: Answer[]; timeLimit: number; saltPregunta?: string; saltRespuesta?: string };

const makeQuestion = (id: number): Question => ({
  id,
  question: "",
  answers: [
    { text: "", correct: true },
    { text: "", correct: false },
    { text: "", correct: false },
    { text: "", correct: false },
  ],
  timeLimit: 30,
});

const ANSWER_COLORS = [
  { bg: "bg-[#FF3366]", label: "A" },
  { bg: "bg-[#33CCFF]", label: "B" },
  { bg: "bg-[#FFCC00]", label: "C" },
  { bg: "bg-[#39FF14]", label: "D" },
];

export default function CreateSession() {
  const router = useRouter();
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({ hash });

  const [title, setTitle] = useState("");
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [passingScore, setPassingScore] = useState("1");
  const [questions, setQuestions] = useState<Question[]>([makeQuestion(1)]);
  const [expanded, setExpanded] = useState<number>(1);
  const [nextId, setNextId] = useState(2);

  const { data: creationFee } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: KahootFactoryABI.abi,
    functionName: 'creationFee',
  });

  useEffect(() => {
    const draft = localStorage.getItem("draft_session");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.stakeAmount) setStakeAmount(parsed.stakeAmount);
        if (parsed.passingScore) setPassingScore(parsed.passingScore);
        if (parsed.questions) setQuestions(parsed.questions);
        if (parsed.nextId) setNextId(parsed.nextId);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isConfirmed && receipt) {
      let gameAddr = "";
      try {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: KahootFactoryABI.abi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'GameCreated') {
              gameAddr = (decoded.args as any).gameAddress;
              const newGameId = Number((decoded.args as any).gameId);
              
              const existingDataStr = localStorage.getItem("current_kahoot_session");
              if (existingDataStr) {
                try {
                  const existingData = JSON.parse(existingDataStr);
                  existingData.gameId = newGameId;
                  localStorage.setItem("current_kahoot_session", JSON.stringify(existingData));
                } catch {}
              }
              break;
            }
          } catch {}
        }
      } catch {}
      
      router.push(`/host/dashboard/${gameAddr}`);
    }
  }, [isConfirmed, receipt, router, title]);

  const handleCustomizeDiploma = () => {
    localStorage.setItem("draft_session", JSON.stringify({ title, stakeAmount, passingScore, questions, nextId }));
    router.push("/diploma-studio");
  };

  const handleLaunch = () => {
    if (!address) return toast.error("Connect wallet first!");

    const leaves = questions.map((q, i) => {
      const saltPregunta = window.crypto.randomUUID().replace(/-/g, "");
      const saltRespuesta = window.crypto.randomUUID().replace(/-/g, "");
      
      q.saltPregunta = saltPregunta;
      q.saltRespuesta = saltRespuesta;
      
      const correctOptionIndex = q.answers.findIndex((a) => a.correct);

      const encodedQuestion = `${q.question}||${q.timeLimit || 30}`;
      const hashVerificacionPregunta = keccak256(
        encodePacked(
          ['string', 'string', 'string', 'string', 'string', 'string'],
          [encodedQuestion, q.answers[0].text, q.answers[1].text, q.answers[2].text, q.answers[3].text, saltPregunta]
        )
      );

      const hashRespuestaCorrecta = keccak256(
        encodePacked(
          ['uint8', 'string', 'address'],
          [correctOptionIndex, saltRespuesta, address]
        )
      );

      (q as any).hashVerificacionPregunta = hashVerificacionPregunta;
      (q as any).hashRespuestaCorrecta = hashRespuestaCorrecta;

      const leafHex = keccak256(
        encodePacked(
          ['uint256', 'bytes32', 'bytes32'],
          [BigInt(i), hashVerificacionPregunta, hashRespuestaCorrecta]
        )
      );
      return Buffer.from(leafHex.slice(2), "hex");
    });

    const tree = new MerkleTree(leaves, keccak256_buffer, { sortPairs: true });
    const merkleRoot = `0x${tree.getRoot().toString("hex")}`;
    const proofs = leaves.map(leaf => tree.getHexProof(leaf));

    const gameData = {
      title,
      stakeAmount,
      questions: questions.map((q, i) => ({ ...q, merkleProof: proofs[i] }))
    };
    localStorage.setItem("current_kahoot_session", JSON.stringify(gameData));
    localStorage.removeItem("draft_session");
    
    let diplomaURI = localStorage.getItem("saved_diploma_uri");
    if (!diplomaURI) {
      const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#F4F4F0"/><rect x="20" y="20" width="760" height="560" fill="none" stroke="#000" stroke-width="12"/><text x="400" y="300" font-family="sans-serif" font-size="60" font-weight="900" fill="#000" text-anchor="middle" text-transform="uppercase">ENKI DIPLOMA</text><text x="400" y="360" font-family="monospace" font-size="20" fill="#000" text-anchor="middle">AWARDED FOR: ${title.toUpperCase()}</text></svg>`;
      const svgBase64 = btoa(unescape(encodeURIComponent(svgStr)));
      const metadata = { name: `ENKI Diploma: ${title}`, description: "Neo-Brutalist ENKI Diploma", image: `data:image/svg+xml;base64,${svgBase64}` };
      diplomaURI = `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(metadata))))}`;
    }

    writeContract({
      address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
      abi: KahootFactoryABI.abi,
      functionName: 'createGame',
      args: [
        title,
        Number(passingScore) || 1,
        questions.length,
        diplomaURI,
        merkleRoot,
        parseEther(stakeAmount)
      ],
      value: (creationFee as bigint) || parseEther("0.0001")
    });
  };

  const addQuestion = () => {
    const q = makeQuestion(nextId);
    setQuestions((prev) => [...prev, q]);
    setExpanded(nextId);
    setNextId((n) => n + 1);
  };

  const removeQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: number, field: "question" | "timeLimit", value: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateAnswer = (qId: number, idx: number, field: "text" | "correct", value: string | boolean) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const answers = q.answers.map((a, i) => {
          if (field === "correct") return { ...a, correct: i === idx };
          return i === idx ? { ...a, [field]: value as string } : a;
        });
        return { ...q, answers };
      })
    );
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 md:px-8 py-10 gap-8 relative z-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-black text-[48px] uppercase tracking-[-0.03em] leading-[0.88] text-black mb-2">New Session</h1>
          <p className="font-mono text-[12px] uppercase tracking-[0.05em] text-gray-500">
            // Build your trivia and set the stake
          </p>
        </div>
        <button
          onClick={() => router.push("/host/dashboard")}
          className="bg-white border-2 border-black text-black shadow-[4px_4px_0px_#000] hover:bg-gray-100 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide font-black text-sm px-6 py-4 cursor-pointer"
        >
          Cancel
        </button>
      </motion.div>

      {/* Session Meta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <BrutalField
            id="session-title"
            label="Session Title"
            value={title}
            onChange={setTitle}
            placeholder="E.G. BLOCKCHAIN BASICS"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-black text-black text-[12px] uppercase tracking-wide">Stake per player (ETH)</label>
            <input
              type="number"
              min="0"
              step="0.001"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full bg-white border-2 border-black px-4 py-3 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none"
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-black text-black text-[12px] uppercase tracking-wide">Correct answers to earn Diploma</label>
            <input
              type="number"
              min="1"
              max={questions.length}
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              className="w-full bg-white border-2 border-black px-4 py-3 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none"
            />
          </div>
        </div>
        
        {/* Diploma Studio Button */}
        <div className="pt-6 border-t-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-black text-black text-[13px] uppercase tracking-wide">NFT Diploma Design</span>
            <span className="font-mono text-sm uppercase tracking-[0.08em] text-gray-500">// Customize the on-chain certificate</span>
          </div>
          <button
            onClick={handleCustomizeDiploma}
            className="flex items-center gap-2 bg-neo-accent border-2 border-black text-black font-black uppercase text-sm tracking-wide px-5 py-3 shadow-[4px_4px_0px_#000] hover:bg-white active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
          >
            <Palette size={16} strokeWidth={2.5} /> Customize Diploma
          </button>
        </div>
      </motion.div>

      {/* Questions */}
      <div className="flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {questions.map((q, qi) => {
            const isOpen = expanded === q.id;
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white border-2 border-black shadow-[8px_8px_0px_#000] overflow-hidden"
              >
                {/* Question header row */}
                <button
                  onClick={() => setExpanded(isOpen ? -1 : q.id)}
                  className="w-full flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-neo-bg transition-colors border-b-2 border-black last:border-b-0"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 border-2 border-black bg-black text-white font-black text-[16px] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
                      {qi + 1}
                    </span>
                    <span className="font-black uppercase tracking-[-0.01em] text-black text-left truncate max-w-sm sm:max-w-md text-lg">
                      {q.question || <span className="text-gray-300">QUESTION {qi + 1}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {questions.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                        className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white hover:bg-[#FF3366] text-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={24} strokeWidth={2.5} className="text-black" /> : <ChevronDown size={24} strokeWidth={2.5} className="text-black" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 flex flex-col gap-8 bg-white border-t-2 border-black">

                        {/* Question text */}
                        <div className="flex flex-col gap-2">
                          <label className="font-black text-black text-[12px] uppercase tracking-wide">Question Text</label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                            placeholder="WRITE YOUR QUESTION HERE..."
                            className="w-full bg-white border-2 border-black px-4 py-3 font-black text-black shadow-[4px_4px_0px_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none rounded-none placeholder:text-gray-300 uppercase resize-none"
                          />
                        </div>

                        {/* Answers */}
                        <div className="flex flex-col gap-3">
                          <label className="font-black text-black text-[12px] uppercase tracking-wide">Answers <span className="text-gray-400">— Tap check to mark correct</span></label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {q.answers.map((ans, ai) => {
                              const col = ANSWER_COLORS[ai];
                              return (
                                <div
                                  key={ai}
                                  className={`flex items-center bg-white border-2 border-black shadow-[4px_4px_0px_#000] transition-colors ${ans.correct ? "bg-neo-bg" : ""}`}
                                >
                                  <span className={`w-12 h-12 border-r-2 border-black ${col.bg} text-black font-black text-[16px] flex items-center justify-center shrink-0`}>
                                    {col.label}
                                  </span>
                                  <input
                                    value={ans.text}
                                    onChange={(e) => updateAnswer(q.id, ai, "text", e.target.value)}
                                    placeholder={`ANSWER ${col.label}`}
                                    className="flex-1 bg-transparent font-black text-black placeholder:text-gray-300 outline-none px-3 uppercase text-sm"
                                  />
                                  <button
                                    onClick={() => updateAnswer(q.id, ai, "correct", true)}
                                    className={`w-12 h-12 border-l-2 border-black flex items-center justify-center shrink-0 transition-all cursor-pointer ${ans.correct ? "bg-[#39FF14] text-black" : "bg-white text-gray-300 hover:bg-neo-accent hover:text-black"}`}
                                  >
                                    <Check size={20} strokeWidth={3} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time limit */}
                        <div className="flex items-center flex-wrap gap-4 pt-4 border-t-2 border-black">
                          <label className="font-black text-black text-[12px] uppercase tracking-wide shrink-0">Time limit</label>
                          {[15, 30, 60, 90].map((t) => (
                            <button
                              key={t}
                              onClick={() => updateQuestion(q.id, "timeLimit", t)}
                              className={`border-2 border-black font-black text-sm uppercase tracking-wide px-4 py-2 transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${q.timeLimit === t ? "bg-black text-white" : "bg-white text-black hover:bg-neo-accent"}`}
                            >
                              {t}s
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add question */}
        <button
          onClick={addQuestion}
          className="flex items-center justify-center gap-3 border-[3px] border-dashed border-black bg-neo-bg hover:bg-neo-accent text-black font-black uppercase tracking-wide text-[12px] py-6 shadow-[6px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
        >
          <Plus size={20} strokeWidth={3} />
          Add Question
        </button>
      </div>

      {/* Launch */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end mt-4"
      >
        <div className="w-[300px]">
          <ArcadeButton
            accent="black"
            onClick={handleLaunch}
            disabled={!title.trim() || questions.some((q) => !q.question.trim()) || isPending}
            loading={isPending}
          >
            {isPending ? "CREATING..." : "LAUNCH SESSION"}
          </ArcadeButton>
        </div>
      </motion.div>

    </div>
  );
}
