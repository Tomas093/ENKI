import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface QuestionCommit {
  questionId: number;
  selectedOption: number; // 0–3
  salt: string;           // random string generated at commit time
}

interface GameContextValue {
  gameAddress: string | null;
  setGameAddress: (addr: string) => void;
  clearGame: () => void;

  // The current pending commit (salt + option) — persisted in sessionStorage
  pendingCommit: QuestionCommit | null;
  savePendingCommit: (commit: QuestionCommit) => void;
  clearPendingCommit: () => void;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────
const KEY_GAME_ADDRESS = "enki_gameAddress";
const KEY_PENDING_COMMIT = "enki_pendingCommit";

// ─── Context ───────────────────────────────────────────────────────────────────
const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from localStorage so F5 doesn't lose state
  const [gameAddress, setGameAddressState] = useState<string | null>(
    () => localStorage.getItem(KEY_GAME_ADDRESS)
  );

  const [pendingCommit, setPendingCommitState] = useState<QuestionCommit | null>(() => {
    const raw = localStorage.getItem(KEY_PENDING_COMMIT);
    return raw ? (JSON.parse(raw) as QuestionCommit) : null;
  });

  const setGameAddress = useCallback((addr: string) => {
    localStorage.setItem(KEY_GAME_ADDRESS, addr);
    setGameAddressState(addr);
  }, []);

  const clearGame = useCallback(() => {
    localStorage.removeItem(KEY_GAME_ADDRESS);
    localStorage.removeItem(KEY_PENDING_COMMIT);
    setGameAddressState(null);
    setPendingCommitState(null);
  }, []);

  const savePendingCommit = useCallback((commit: QuestionCommit) => {
    localStorage.setItem(KEY_PENDING_COMMIT, JSON.stringify(commit));
    setPendingCommitState(commit);
  }, []);

  const clearPendingCommit = useCallback(() => {
    localStorage.removeItem(KEY_PENDING_COMMIT);
    setPendingCommitState(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameAddress,
        setGameAddress,
        clearGame,
        pendingCommit,
        savePendingCommit,
        clearPendingCommit,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}

// ─── Utility: generate a cryptographically random salt ─────────────────────────
export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
