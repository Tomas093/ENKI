"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";

type Answer = { text: string; correct: boolean };
type Question = { id: number; question: string; answers: Answer[]; timeLimit: number };

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
  { bg: "bg-red-500", light: "bg-red-50 border-red-200", label: "A" },
  { bg: "bg-blue-500", light: "bg-blue-50 border-blue-200", label: "B" },
  { bg: "bg-amber-400", light: "bg-amber-50 border-amber-200", label: "C" },
  { bg: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200", label: "D" },
];

export default function CreateSession() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [stakeAmount, setStakeAmount] = useState("0.01");
  const [questions, setQuestions] = useState<Question[]>([makeQuestion(1)]);
  const [expanded, setExpanded] = useState<number>(1);
  const [nextId, setNextId] = useState(2);

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
          return i === idx ? { ...a, [field]: value } : a;
        });
        return { ...q, answers };
      })
    );
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pt-8 pb-20 gap-6 relative z-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-slate-800 text-4xl tracking-tight">New Session</h1>
          <p className="text-slate-400 font-semibold mt-1">Build your trivia and set the stake</p>
        </div>
        <button
          onClick={() => router.push("/host/dashboard")}
          className="font-bold text-slate-400 hover:text-slate-600 px-4 py-2 rounded-[12px] hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </motion.div>

      {/* Session meta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="font-black text-slate-600 text-sm">Session Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Blockchain Basics"
            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-400 rounded-[14px] px-4 py-3 font-bold text-slate-800 placeholder:text-slate-300 outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-black text-slate-600 text-sm">Stake per player (ETH)</label>
          <input
            type="number"
            min="0"
            step="0.001"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-400 rounded-[14px] px-4 py-3 font-bold text-slate-800 outline-none transition-colors"
          />
        </div>
      </motion.div>

      {/* Questions */}
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {questions.map((q, qi) => {
            const isOpen = expanded === q.id;
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="bg-white rounded-[24px] border-[3px] border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Question header row */}
                <button
                  onClick={() => setExpanded(isOpen ? -1 : q.id)}
                  className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-[10px] bg-purple-100 text-purple-600 font-black text-sm flex items-center justify-center shrink-0">
                      {qi + 1}
                    </span>
                    <span className="font-bold text-slate-700 text-left truncate max-w-xs">
                      {q.question || <span className="text-slate-300">Question {qi + 1}</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {questions.length > 1 && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }}
                        className="w-7 h-7 flex items-center justify-center rounded-[8px] hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
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
                      <div className="px-6 pb-6 flex flex-col gap-5 border-t-2 border-slate-50 pt-4">

                        {/* Question text */}
                        <div className="flex flex-col gap-1.5">
                          <label className="font-black text-slate-500 text-xs uppercase tracking-wide">Question</label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                            placeholder="Write your question here..."
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-purple-400 rounded-[14px] px-4 py-3 font-bold text-slate-800 placeholder:text-slate-300 outline-none transition-colors resize-none"
                          />
                        </div>

                        {/* Answers */}
                        <div className="flex flex-col gap-2">
                          <label className="font-black text-slate-500 text-xs uppercase tracking-wide">Answers — tap the check to mark correct</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.answers.map((ans, ai) => {
                              const col = ANSWER_COLORS[ai];
                              return (
                                <div
                                  key={ai}
                                  className={`flex items-center gap-2 rounded-[14px] border-2 px-3 py-2.5 transition-colors ${ans.correct ? col.light : "bg-slate-50 border-slate-200"}`}
                                >
                                  <span className={`w-6 h-6 rounded-[7px] ${col.bg} text-white font-black text-xs flex items-center justify-center shrink-0`}>
                                    {col.label}
                                  </span>
                                  <input
                                    value={ans.text}
                                    onChange={(e) => updateAnswer(q.id, ai, "text", e.target.value)}
                                    placeholder={`Answer ${col.label}`}
                                    className="flex-1 bg-transparent font-bold text-slate-700 placeholder:text-slate-300 outline-none text-sm"
                                  />
                                  <button
                                    onClick={() => updateAnswer(q.id, ai, "correct", true)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${ans.correct ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent hover:border-emerald-400"}`}
                                  >
                                    <Check size={12} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Time limit */}
                        <div className="flex items-center gap-4">
                          <label className="font-black text-slate-500 text-xs uppercase tracking-wide shrink-0">Time limit</label>
                          {[15, 30, 60, 90].map((t) => (
                            <button
                              key={t}
                              onClick={() => updateQuestion(q.id, "timeLimit", t)}
                              className={`px-3 py-1 rounded-[10px] font-black text-sm transition-colors cursor-pointer ${q.timeLimit === t ? "bg-purple-600 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-purple-100 hover:text-purple-700"}`}
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
          className="flex items-center justify-center gap-2 border-[3px] border-dashed border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-400 hover:text-purple-600 font-black rounded-[24px] py-4 transition-colors cursor-pointer"
        >
          <Plus size={18} />
          Add Question
        </button>
      </div>

      {/* Launch */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end"
      >
        <button
          disabled={!title.trim() || questions.some((q) => !q.question.trim())}
          onClick={() => router.push(`/teacher/lobby?title=${encodeURIComponent(title)}`)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black px-8 py-3.5 rounded-[16px] shadow-lg shadow-purple-200 disabled:shadow-none transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 cursor-pointer disabled:cursor-not-allowed"
        >
          Launch Session
        </button>
      </motion.div>

    </div>
  );
};
