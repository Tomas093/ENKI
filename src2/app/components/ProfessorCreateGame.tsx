import React, { useState } from "react";
import { useNavigate } from "react-router";
import { GeometricBackground } from "./GeometricBackground";
import { Bell, Zap, Trash2, PlusCircle, CheckCircle2 } from "lucide-react";

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
  };
}

export function ProfessorCreateGame() {
  const navigate = useNavigate();
  const [entryFee, setEntryFee] = useState("0.05");
  const [maxPlayers, setMaxPlayers] = useState("64");
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 0,
      text: "What year did the Ethereum genesis block occur?",
      options: [
        { id: 0, text: "2013" },
        { id: 1, text: "2014" },
        { id: 2, text: "2015" },
        { id: 3, text: "2016" },
      ],
      correctOption: 2,
    },
  ]);

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createBlankQuestion(Date.now())]);
  };

  const removeQuestion = (qId: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const updateQuestionText = (qId: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, text } : q))
    );
  };

  const updateOptionText = (qId: number, optId: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optId ? { ...o, text } : o
              ),
            }
          : q
      )
    );
  };

  const setCorrect = (qId: number, optId: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, correctOption: optId } : q))
    );
  };

  const handlePublish = () => {
    navigate("/professor/dashboard");
  };

  return (
    <div className="min-h-screen relative font-sans text-slate-800 flex flex-col">
      <GeometricBackground />

      {/* Top Navbar */}
      <header className="relative z-10 bg-white h-[72px] border-b border-slate-200 px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl w-10 h-10 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={20} color="white" strokeWidth={2.5} />
          </div>
          <span className="font-black text-2xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            ENKI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Bell size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 font-bold text-sm font-mono">0x...B29</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="relative z-10 flex-1 flex justify-center py-12 px-4">
        <div className="bg-white w-full max-w-4xl rounded-[24px] border-2 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col gap-10">

          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Advanced Web3 Game Creator</h1>
            <p className="text-slate-500 font-medium">Configure your game parameters and build the interactive question set.</p>
          </div>

          {/* Global Settings Section */}
          <section className="bg-slate-50 p-6 rounded-[20px] border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-slate-200 text-slate-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Global Settings
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Entry Fee (in ETH)</label>
                <input
                  type="text"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-wider">Max Players</label>
                <input
                  type="text"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
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
                <div
                  key={q.id}
                  className="bg-white border-2 border-slate-200 rounded-[20px] p-6 shadow-sm flex flex-col gap-6 transition-all hover:border-purple-200"
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Question {index + 1}
                    </label>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors"
                        title="Remove question"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Question text */}
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-5 py-4 text-xl font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    placeholder="Enter your question..."
                  />

                  {/* Options grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((opt) => {
                      const palette = OPTION_COLORS[opt.id];
                      const isCorrect = q.correctOption === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-3 border-2 ${palette.color} ${palette.bg} rounded-xl p-3 relative group transition-transform hover:scale-[1.02] ${isCorrect ? "ring-2 ring-offset-1 ring-emerald-400" : ""}`}
                        >
                          <button
                            type="button"
                            onClick={() => setCorrect(q.id, opt.id)}
                            className="flex-shrink-0 transition-transform hover:scale-110"
                            title="Mark as correct"
                          >
                            <CheckCircle2
                              size={22}
                              className={isCorrect ? "text-emerald-500" : "text-slate-300"}
                              fill={isCorrect ? "currentColor" : "none"}
                            />
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

            {/* Add Question button */}
            <button
              onClick={addQuestion}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-[20px] border-2 border-dashed border-purple-300 text-purple-600 font-bold hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <PlusCircle size={20} />
              Add Question
            </button>
          </section>

          {/* Footer Action */}
          <div className="pt-6 mt-4 border-t-2 border-dashed border-slate-200 flex justify-center">
            <button
              onClick={handlePublish}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black text-xl px-12 py-5 rounded-[20px] shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:shadow-[0_12px_25px_rgba(124,58,237,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <Zap size={24} fill="currentColor" />
              Publish & Initialize Contract on-chain
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
