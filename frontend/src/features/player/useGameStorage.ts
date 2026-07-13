import { useState, useCallback } from "react";
import { STORAGE_KEYS } from '@/core/storage/storage';

export function useGameStorage(gameAddress: string | null) {
  const [questionData, setQuestionData] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const initStorage = useCallback(() => {
    if (!gameAddress) return { initialTime: 30, totalTime: 30 };

    const lastGame = localStorage.getItem(STORAGE_KEYS.LAST_GAME_ADDRESS);
    if (lastGame && lastGame !== gameAddress) {
      localStorage.removeItem(`${STORAGE_KEYS.GAME_COMMITS_PREFIX}${lastGame}`);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_QUESTION);
    }
    localStorage.setItem(STORAGE_KEYS.LAST_GAME_ADDRESS, gameAddress);

    const qData = localStorage.getItem(STORAGE_KEYS.CURRENT_QUESTION);
    if (qData) {
      const parsed = JSON.parse(qData);
      setQuestionData(parsed);

      const startTimeStr = localStorage.getItem(STORAGE_KEYS.CURRENT_QUESTION_START_TIME);
      let initialTime = parsed.timeLimit || 30;
      if (startTimeStr) {
        const startTime = Number(startTimeStr);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        initialTime = Math.max(0, initialTime - elapsed);
      }

      const storageKey = `${STORAGE_KEYS.GAME_COMMITS_PREFIX}${gameAddress}`;
      const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
      const commitInfo = commitsObj[parsed.id];
      if (commitInfo && commitInfo.option !== undefined) {
        setSelected(Number(commitInfo.option));
      }

      return { initialTime, totalTime: parsed.timeLimit || 30 };
    }
    return { initialTime: 30, totalTime: 30 };
  }, [gameAddress]);

  const saveCommit = useCallback((questionId: number, idx: number, salt: string) => {
    if (!gameAddress) return;
    const storageKey = `${STORAGE_KEYS.GAME_COMMITS_PREFIX}${gameAddress}`;
    const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
    commitsObj[questionId] = { option: idx, salt };
    localStorage.setItem(storageKey, JSON.stringify(commitsObj));
    setSelected(idx);
  }, [gameAddress]);

  const removeCommit = useCallback((questionId: number) => {
    if (!gameAddress) return;
    const storageKey = `${STORAGE_KEYS.GAME_COMMITS_PREFIX}${gameAddress}`;
    const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
    delete commitsObj[questionId];
    localStorage.setItem(storageKey, JSON.stringify(commitsObj));
    setSelected(null);
  }, [gameAddress]);

  const getCommit = useCallback((questionId: number) => {
    if (!gameAddress) return null;
    const storageKey = `${STORAGE_KEYS.GAME_COMMITS_PREFIX}${gameAddress}`;
    const commitsObj = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return commitsObj[questionId] || null;
  }, [gameAddress]);

  const syncNewQuestion = useCallback((newQuestionData: any) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_QUESTION, JSON.stringify(newQuestionData));
    localStorage.setItem(STORAGE_KEYS.CURRENT_QUESTION_START_TIME, Date.now().toString());
    setQuestionData(newQuestionData);
    setSelected(null);
  }, []);

  return {
    questionData,
    selected,
    setSelected,
    initStorage,
    saveCommit,
    removeCommit,
    getCommit,
    syncNewQuestion
  };
}
