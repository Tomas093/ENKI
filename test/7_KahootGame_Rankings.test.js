import { expect } from "chai";
import { network } from "hardhat";
import { describe, it, beforeEach } from "node:test";
import { keccak256, encodePacked, parseEther } from "viem";
import { buildGameMerkleTree, buildPlaceholderQuestions, PROFE_SALT, STUDENT_SALT } from "./testHelpers.js";

describe("KahootGame - Rankings y Distribución de Premios (Ranking Olímpico)", function () {
  let factory;
  let profesor;
  let a1, a2, a3, a4, a5;
  let viem;

  const diplomaURI = "ipfs://QmMockDiploma...";
  const entryFee   = parseEther("0.01");
  const creationFee = parseEther("0.001");

  function generateStudentHash(opcion, salt, address) {
    return keccak256(encodePacked(["uint8", "bytes32", "address"], [opcion, salt, address]));
  }

  async function expectRevert(promise, expectedReason) {
    try {
      await promise;
      expect.fail("La transaccion deberia haber fallado");
    } catch (error) {
      expect(error.message).to.include(expectedReason);
    }
  }

  beforeEach(async function () {
    const networkContext = await network.create({ network: "hardhatMainnet", chainType: "l1" });
    viem = networkContext.viem;
    const clients = await viem.getWalletClients();
    profesor = clients[1];
    a1 = clients[2];
    a2 = clients[3];
    a3 = clients[4];
    a4 = clients[5];
    a5 = clients[6];
    factory = await viem.deployContract("KahootFactory", [creationFee]);
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  async function run1QuestionGame(players, correct) {
    const qs = buildPlaceholderQuestions(1);
    const mt = buildGameMerkleTree(qs, profesor.account.address);

    await factory.write.createGame(
      ["Test 1Q", 1n, 1n, diplomaURI, mt.root, entryFee],
      { account: profesor.account, value: creationFee }
    );
    const count = await factory.read.getGamesCount();
    const gameAddr = await factory.read.games([count - 1n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    for (const p of players) {
      await game.write.joinGame({ value: entryFee, account: p.account });
    }
    await game.write.startNextQuestion([mt.questions[0].questionHash, mt.questions[0].correctAnswerHash, mt.getProof(0), mt.questions[0].enunciado, mt.questions[0].opciones, mt.questions[0].saltPregunta], { account: profesor.account });
    for (const p of players) {
      const option = correct.includes(p) ? 1 : 2;
      await game.write.commitAnswer(
        [generateStudentHash(option, STUDENT_SALT, p.account.address)],
        { account: p.account }
      );
    }
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    for (const p of players) {
      const option = correct.includes(p) ? 1 : 2;
      await game.write.revealAnswer([0n, option, STUDENT_SALT], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });
    return game;
  }

  async function run2QuestionGame(players, correctPerQ) {
    const qs = buildPlaceholderQuestions(2);
    qs[0].correctOption = 1;
    qs[1].correctOption = 2;
    const mt = buildGameMerkleTree(qs, profesor.account.address);

    await factory.write.createGame(
      ["Test 2Q", 2n, 2n, diplomaURI, mt.root, entryFee],
      { account: profesor.account, value: creationFee }
    );
    const count = await factory.read.getGamesCount();
    const gameAddr = await factory.read.games([count - 1n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    for (const p of players) {
      await game.write.joinGame({ value: entryFee, account: p.account });
    }

    // Pregunta 0 (opción correcta = 1)
    await game.write.startNextQuestion([mt.questions[0].questionHash, mt.questions[0].correctAnswerHash, mt.getProof(0), mt.questions[0].enunciado, mt.questions[0].opciones, mt.questions[0].saltPregunta], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[0].includes(p) ? 1 : 3;
      await game.write.commitAnswer([generateStudentHash(opt, STUDENT_SALT, p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[0].includes(p) ? 1 : 3;
      await game.write.revealAnswer([0n, opt, STUDENT_SALT], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    // Pregunta 1 (opción correcta = 2)
    await game.write.startNextQuestion([mt.questions[1].questionHash, mt.questions[1].correctAnswerHash, mt.getProof(1), mt.questions[1].enunciado, mt.questions[1].opciones, mt.questions[1].saltPregunta], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[1].includes(p) ? 2 : 3;
      await game.write.commitAnswer([generateStudentHash(opt, STUDENT_SALT, p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([2, PROFE_SALT], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[1].includes(p) ? 2 : 3;
      await game.write.revealAnswer([1n, opt, STUDENT_SALT], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    return game;
  }

  // ─── Tests existentes actualizados al Ranking Olímpico ───────────────────────

  it("Ranking olímpico correcto: 2 empatados en 1° consumen slots 1+2, el 3° queda con slot 3", async function () {
    const qs = buildPlaceholderQuestions(3);
    qs[0].correctOption = 1;
    qs[1].correctOption = 2;
    qs[2].correctOption = 3;
    const mt = buildGameMerkleTree(qs, profesor.account.address);

    await factory.write.createGame(
      ["Test 3Q", 3n, 3n, diplomaURI, mt.root, entryFee],
      { account: profesor.account, value: creationFee }
    );
    const count = await factory.read.getGamesCount();
    const gameAddr = await factory.read.games([count - 1n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    for (const p of [a1, a2, a3, a4, a5]) {
      await game.write.joinGame({ value: entryFee, account: p.account });
    }

    // Q0 (correct=1): a1,a2,a3,a4 aciertan; a5 falla
    await game.write.startNextQuestion([mt.questions[0].questionHash, mt.questions[0].correctAnswerHash, mt.getProof(0), mt.questions[0].enunciado, mt.questions[0].opciones, mt.questions[0].saltPregunta], { account: profesor.account });
    for (const [p, opt] of [[a1,1],[a2,1],[a3,1],[a4,1],[a5,2]]) {
      await game.write.commitAnswer([generateStudentHash(opt, STUDENT_SALT, p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    for (const [p, opt] of [[a1,1],[a2,1],[a3,1],[a4,1],[a5,2]]) {
      await game.write.revealAnswer([0n, opt, STUDENT_SALT], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    // Q1 (correct=2): a1,a2,a3 aciertan; a4,a5 fallan
    await game.write.startNextQuestion([mt.questions[1].questionHash, mt.questions[1].correctAnswerHash, mt.getProof(1), mt.questions[1].enunciado, mt.questions[1].opciones, mt.questions[1].saltPregunta], { account: profesor.account });
    for (const [p, opt] of [[a1,2],[a2,2],[a3,2],[a4,1],[a5,1]]) {
      await game.write.commitAnswer([generateStudentHash(opt, STUDENT_SALT, p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([2, PROFE_SALT], { account: profesor.account });
    for (const [p, opt] of [[a1,2],[a2,2],[a3,2],[a4,1],[a5,1]]) {
      await game.write.revealAnswer([1n, opt, STUDENT_SALT], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    // Q2 (correct=3): a1,a2 aciertan; a3,a4,a5 fallan
    await game.write.startNextQuestion([mt.questions[2].questionHash, mt.questions[2].correctAnswerHash, mt.getProof(2), mt.questions[2].enunciado, mt.questions[2].opciones, mt.questions[2].saltPregunta], { account: profesor.account });
    for (const [p, opt] of [[a1,3],[a2,3],[a3,1],[a4,1],[a5,1]]) {
      await game.write.commitAnswer([generateStudentHash(opt, STUDENT_SALT, p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([3, PROFE_SALT], { account: profesor.account });
    for (const [p, opt] of [[a1,3],[a2,3],[a3,1],[a4,1],[a5,1]]) {
      await game.write.revealAnswer([2n, opt, STUDENT_SALT], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    await game.write.calculatePrizes({ account: a1.account });

    // Grupo 0: a1,a2 empatan en 1° olímpico (slots 1+2 → 80%)
    expect(await game.read.topScoreValues([0n])).to.equal(3n);
    expect(await game.read.topScoreCounts([0n])).to.equal(2n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.02"));

    // Grupo 1: a3 queda en 3° olímpico (slot 3 → 10%)
    expect(await game.read.topScoreValues([1n])).to.equal(2n);
    expect(await game.read.topScoreCounts([1n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([1n])).to.equal(parseEther("0.005"));

    // Grupo 2: vacante (a4 es 4° olímpico, fuera del top 3)
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);

    // Profesor: 10% base
    expect(await game.read.professorPrize()).to.equal(parseEther("0.005"));
  });

  it("Empate total en 1° (3 jugadores): acumulan rank1+rank2+rank3, profesor recibe 10%", async function () {
    const game = await run1QuestionGame([a1, a2, a3], [a1, a2, a3]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(1n);
    expect(await game.read.topScoreCounts([0n])).to.equal(3n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.009"));
    expect(await game.read.topScoreCounts([1n])).to.equal(0n);
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);
    expect(await game.read.professorPrize()).to.equal(parseEther("0.003"));
  });

  it("2 empatados en 1° ocupan slots 1+2; el 3° (score=0) recibe solo rank3", async function () {
    const game = await run1QuestionGame([a1, a2, a3], [a1, a2]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(1n);
    expect(await game.read.topScoreCounts([0n])).to.equal(2n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.012"));
    expect(await game.read.topScoreValues([1n])).to.equal(0n);
    expect(await game.read.topScoreCounts([1n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([1n])).to.equal(parseEther("0.003"));
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);
    expect(await game.read.professorPrize()).to.equal(parseEther("0.003"));
  });

  it("Jugador con score 0 en slot 3 puede reclamar su premio", async function () {
    const game = await run1QuestionGame([a1, a2, a3], [a1, a2]);
    await game.write.calculatePrizes({ account: a1.account });

    const publicClient = await viem.getPublicClient();
    const antes = await publicClient.getBalance({ address: a3.account.address });
    await game.write.claimPrize({ account: a3.account });
    const despues = await publicClient.getBalance({ address: a3.account.address });

    expect(despues > antes).to.be.true;
  });

  it("Empate en 2° puesto: 1 ganador limpio en 1°, 2 empatados acumulan rank2+rank3", async function () {
    const game = await run2QuestionGame([a1, a2, a3], [[a1, a2, a3], [a1]]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(2n);
    expect(await game.read.topScoreCounts([0n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.018"));
    expect(await game.read.topScoreValues([1n])).to.equal(1n);
    expect(await game.read.topScoreCounts([1n])).to.equal(2n);
    expect(await game.read.prizePerPlayerAtRank([1n])).to.equal(parseEther("0.0045"));
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);
    expect(await game.read.professorPrize()).to.equal(parseEther("0.003"));
  });

  it("Empate en 2° puesto: ambos empatados pueden retirar su premio", async function () {
    const game = await run2QuestionGame([a1, a2, a3], [[a1, a2, a3], [a1]]);
    await game.write.calculatePrizes({ account: a1.account });

    const publicClient = await viem.getPublicClient();
    const antesA2 = await publicClient.getBalance({ address: a2.account.address });
    await game.write.claimPrize({ account: a2.account });
    const despuesA2 = await publicClient.getBalance({ address: a2.account.address });
    expect(despuesA2 > antesA2).to.be.true;

    const antesA3 = await publicClient.getBalance({ address: a3.account.address });
    await game.write.claimPrize({ account: a3.account });
    const despuesA3 = await publicClient.getBalance({ address: a3.account.address });
    expect(despuesA3 > antesA3).to.be.true;
  });

  it("Empate en 3° puesto: slots 1 y 2 ocupados limpiamente, 2 empatados comparten solo rank3", async function () {
    const game = await run2QuestionGame([a1, a2, a3, a4], [[a1, a2], [a1]]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(2n);
    expect(await game.read.topScoreCounts([0n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.024"));
    expect(await game.read.topScoreValues([1n])).to.equal(1n);
    expect(await game.read.topScoreCounts([1n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([1n])).to.equal(parseEther("0.008"));
    expect(await game.read.topScoreValues([2n])).to.equal(0n);
    expect(await game.read.topScoreCounts([2n])).to.equal(2n);
    expect(await game.read.prizePerPlayerAtRank([2n])).to.equal(parseEther("0.002"));
    expect(await game.read.professorPrize()).to.equal(parseEther("0.004"));
  });

  it("Empate masivo en 1° (4 jugadores): acumulan slots 1+2+3, ningún otro recibe premio", async function () {
    const game = await run1QuestionGame([a1, a2, a3, a4], [a1, a2, a3, a4]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(1n);
    expect(await game.read.topScoreCounts([0n])).to.equal(4n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.009"));
    expect(await game.read.topScoreCounts([1n])).to.equal(0n);
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);
    expect(await game.read.professorPrize()).to.equal(parseEther("0.004"));
  });

  it("4° jugador olímpico no puede reclamar premio (fuera del top 3 de slots)", async function () {
    const game = await run1QuestionGame([a1, a2, a3, a4], [a1, a2, a3]);
    await game.write.calculatePrizes({ account: a1.account });
    await expectRevert(game.write.claimPrize({ account: a4.account }), "Tu puntaje no esta en el top 3");
  });

  it("Un solo jugador: gana slot 1 solo, slots 2 y 3 vacantes acumulan al profesor", async function () {
    const game = await run1QuestionGame([a1], [a1]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(1n);
    expect(await game.read.topScoreCounts([0n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.006"));
    expect(await game.read.topScoreCounts([1n])).to.equal(0n);
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);
    expect(await game.read.professorPrize()).to.equal(parseEther("0.004"));
  });

  // ─── Tests de infraestructura (sin cambios de lógica) ────────────────────────

  it("calculatePrizes no puede llamarse dos veces", async function () {
    const game = await run1QuestionGame([a1], [a1]);
    await game.write.calculatePrizes({ account: a1.account });
    await expectRevert(game.write.calculatePrizes({ account: a1.account }), "Los premios ya fueron calculados");
  });

  it("calculatePrizes no falla si no hay pozo de premios (entryFee = 0), pero los premios son 0", async function () {
    const qs = buildPlaceholderQuestions(1);
    const mt = buildGameMerkleTree(qs, profesor.account.address);

    await factory.write.createGame(
      ["Test Zero Fee", 1n, 1n, diplomaURI, mt.root, 0n],
      { account: profesor.account, value: creationFee }
    );
    const count = await factory.read.getGamesCount();
    const gameAddr = await factory.read.games([count - 1n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    await game.write.joinGame({ value: 0n, account: a1.account });
    await game.write.startNextQuestion([mt.questions[0].questionHash, mt.questions[0].correctAnswerHash, mt.getProof(0), mt.questions[0].enunciado, mt.questions[0].opciones, mt.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer(
      [generateStudentHash(1, STUDENT_SALT, a1.account.address)],
      { account: a1.account }
    );
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    await game.write.revealAnswer([0n, 1, STUDENT_SALT], { account: a1.account });
    await game.write.advanceToNextQuestion({ account: profesor.account });

    await game.write.calculatePrizes({ account: a1.account });
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(0n);
  });

  it("prizesCalculated se setea en true luego de calculatePrizes", async function () {
    const game = await run1QuestionGame([a1], [a1]);
    expect(await game.read.prizesCalculated()).to.equal(false);
    await game.write.calculatePrizes({ account: a1.account });
    expect(await game.read.prizesCalculated()).to.equal(true);
  });

  it("Jugador sin premio no puede llamar claimPrize antes de calculatePrizes", async function () {
    const game = await run1QuestionGame([a1], [a1]);
    await expectRevert(game.write.claimPrize({ account: a1.account }), "Primero se debe llamar a calculatePrizes()");
  });
});
