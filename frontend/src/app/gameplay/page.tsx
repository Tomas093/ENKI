"use client";
import { useStudentGameplay } from "../../hooks/useStudentGameplay";
import { GameplayUI } from "../components/GameplayUI";
import { useAudio } from "../../contexts/AudioContext";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export default function ActiveGameplay() {
  const searchParams = useSearchParams();
  const gameAddress = searchParams.get("game") as string | undefined;

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
  const { playMusic, playSFX } = useAudio();
  const prevTimeLeft = useRef(timeLeft);
  const prevIsRevealing = useRef(isRevealing);

  useEffect(() => {
    playMusic("tense");
  }, [playMusic]);

  // SFX for tick
  useEffect(() => {
    if (timeLeft > 0 && timeLeft < prevTimeLeft.current && timeLeft <= 5) {
      playSFX("tick");
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, playSFX]);

  // SFX for correct/incorrect
  useEffect(() => {
    if (isRevealing && !prevIsRevealing.current) {
      if (isCorrect) playSFX("correct");
      else playSFX("incorrect");
    }
    prevIsRevealing.current = isRevealing;
  }, [isRevealing, isCorrect, playSFX]);

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
      gameAddress={gameAddress}
    />
  );
}
