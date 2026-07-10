"use client";
import { useStudentGameplay } from "../../hooks/useStudentGameplay";
import { GameplayUI } from "../components/GameplayUI";

export default function ActiveGameplay() {
  const {
    selected,
    questionData,
    timeLeft,
    totalTime,
    correctAnswerIdx,
    isRevealing,
    isCorrect,
    displayName,
    isPending,
    handlePick,
  } = useStudentGameplay();

  return (
    <GameplayUI
      selected={selected}
      questionData={questionData}
      timeLeft={timeLeft}
      totalTime={totalTime}
      correctAnswerIdx={correctAnswerIdx}
      isRevealing={isRevealing}
      isCorrect={isCorrect}
      displayName={displayName}
      isPending={isPending}
      handlePick={handlePick}
    />
  );
}
