# Plan to Truly Reduce Signatures (Batch Reveal at the end)

1. Modify `waiting/page.tsx`:
   - When `RevealPhaseStarted` is detected:
     - DO NOT prompt a MetaMask transaction.
     - Instead, take `myIdx` and `mySalt` from `sessionStorage` and append it to an array `pending_reveals` in `sessionStorage`.
     - Call `readContract` for `revealedAnswers[qId]` to get the correct answer and show the UI feedback ("Correct Answer: ...").
   - Wait for `QuestionRevealed` or `isFinished`.
   - If `QuestionRevealed`, just route to `/gameplay` (no tx needed).
   - If `isFinished`, THEN automatically trigger `writeContract(batchRevealAnswers)` using the accumulated `pending_reveals` array.
   - Once the transaction is successful, wait for `PrizesCalculated` and route to `/leaderboard`.

2. Modify `ProfessorDashboard` / `TeacherDashboard`:
   - The Professor needs to know that students are revealing their answers. But actually, `calculatePrizes` can be called anytime after `isFinished`.
   - The Professor should wait a little bit before clicking "Calculate Prizes". The UI for the professor should say "Game Finished! Waiting for students to submit their final answers..." before allowing them to calculate prizes.

This plan perfectly addresses "Reducir la cantidad de firmas necesarias" by making reveals 100% batched.
