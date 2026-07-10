"use client";
import { useState } from "react";
import { GameplayUI } from "../../components/GameplayUI";

export default function MockGameplay() {
  const [selected, setSelected] = useState<number | null>(null);

  const mockQuestionData = {
    id: 0,
    question: "What does EVM stand for?",
    options: [
      "Ethereum Virtual Machine",
      "Ethereum Validating Machine",
      "Electronic Voting Machine",
      "Ether Value Multiplier",
    ],
  };

  return (
    <GameplayUI
      selected={selected}
      questionData={mockQuestionData}
      timeLeft={45} // Fijo para ver la UI
      totalTime={60}
      correctAnswerIdx={null} // null significa que aún no se reveló
      isRevealing={false}
      isCorrect={false}
      displayName="Test Student"
      isPending={false}
      handlePick={(idx) => setSelected(idx)}
    />
  );
}
