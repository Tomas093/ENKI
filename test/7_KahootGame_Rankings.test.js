import { expect } from "chai";
import { network } from "hardhat";
import { describe, it, beforeEach } from "node:test";
import { keccak256, encodePacked, parseEther } from "viem";

describe("KahootGame - Rankings y Distribución de Premios (Ranking Olímpico)", function () {
  let factory;
  let owner, profesor;
  let a1, a2, a3, a4, a5;
  let viem;

  const diplomaURI = "ipfs://QmMockDiploma...";
  const profeSalt  = "secretoProfe";
  const enunciado  = "¿Cuánto es 2+2?";
  const opciones   = ["A", "B", "C", "D"];
  const entryFee   = parseEther("0.01");
  const creationFee = parseEther("0.001");

  function generateHash(opcion, salt, address) {
    return keccak256(encodePacked(["uint8", "string", "address"], [opcion, salt, address]));
  }

  function buildRonda(opcionCorrecta, profesorAddr) {
    return {
      hashVerificacionPregunta: keccak256(encodePacked(
        ["string", "string", "string", "string", "string", "string"],
        [enunciado, opciones[0], opciones[1], opciones[2], opciones[3], profeSalt]
      )),
      hashRespuestaCorrecta: generateHash(opcionCorrecta, profeSalt, profesorAddr),
      commitPhaseOpen: false,
      revealPhaseOpen: false,
    };
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
    owner = clients[0];
    profesor = clients[1];
    a1 = clients[2];
    a2 = clients[3];
    a3 = clients[4];
    a4 = clients[5];
    a5 = clients[6];
    factory = await viem.deployContract("KahootFactory", [creationFee]);
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Juego de 1 pregunta (opción correcta = 1).
   * `players` = todos los participantes; `correct` = los que aciertan.
   */
  async function run1QuestionGame(players, correct) {
    const r1 = buildRonda(1, profesor.account.address);
    await factory.write.createGame(
      [1n, 1n, diplomaURI, [r1], entryFee],
      { account: profesor.account, value: creationFee }
    );
    const count = await factory.read.getGamesCount();
    const gameAddr = await factory.read.games([count - 1n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    for (const p of players) {
      await game.write.joinGame({ value: entryFee, account: p.account });
    }
    await game.write.startNextQuestion([enunciado, opciones, profeSalt], { account: profesor.account });
    for (const p of players) {
      const option = correct.includes(p) ? 1 : 2;
      await game.write.commitAnswer(
        [generateHash(option, "s", p.account.address)],
        { account: p.account }
      );
    }
    await game.write.closeQuestionAndStartReveal([1, profeSalt], { account: profesor.account });
    for (const p of players) {
      const option = correct.includes(p) ? 1 : 2;
      await game.write.revealAnswer([0n, option, "s"], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });
    return game;
  }

  /**
   * Juego de 2 preguntas. Recibe un array de arrays de correctos por pregunta.
   * correctPerQ[0] = jugadores que aciertan la pregunta 0.
   * correctPerQ[1] = jugadores que aciertan la pregunta 1.
   */
  async function run2QuestionGame(players, correctPerQ) {
    const r1 = buildRonda(1, profesor.account.address);
    const r2 = buildRonda(2, profesor.account.address);
    await factory.write.createGame(
      [1n, 2n, diplomaURI, [r1, r2], entryFee],
      { account: profesor.account, value: creationFee }
    );
    const count = await factory.read.getGamesCount();
    const gameAddr = await factory.read.games([count - 1n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    for (const p of players) {
      await game.write.joinGame({ value: entryFee, account: p.account });
    }

    // Pregunta 0 (opción correcta = 1)
    await game.write.startNextQuestion([enunciado, opciones, profeSalt], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[0].includes(p) ? 1 : 3;
      await game.write.commitAnswer([generateHash(opt, "s0", p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([1, profeSalt], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[0].includes(p) ? 1 : 3;
      await game.write.revealAnswer([0n, opt, "s0"], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    // Pregunta 1 (opción correcta = 2)
    await game.write.startNextQuestion([enunciado, opciones, profeSalt], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[1].includes(p) ? 2 : 3;
      await game.write.commitAnswer([generateHash(opt, "s1", p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([2, profeSalt], { account: profesor.account });
    for (const p of players) {
      const opt = correctPerQ[1].includes(p) ? 2 : 3;
      await game.write.revealAnswer([1n, opt, "s1"], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    return game;
  }

  // ─── Tests existentes actualizados al Ranking Olímpico ───────────────────────

  it("Ranking olímpico correcto: 2 empatados en 1° consumen slots 1+2, el 3° queda con slot 3", async function () {
    // Scores finales: a1=3, a2=3, a3=2, a4=1, a5=0  →  prizePool = 0.05 ETH
    //
    // Slots olímpicos:
    //   Grupo a1,a2 (score=3): slotStart=1, slotEnd=2  → pool = 60%+20% = 0.04 ETH
    //                           prizePerPlayer = 0.04/2 = 0.02 ETH cada uno
    //   Grupo a3    (score=2): slotStart=3, slotEnd=3  → pool = 10% = 0.005 ETH
    //                           prizePerPlayer = 0.005 ETH
    //   Grupo a4    (score=1): slotStart=4 → fuera del top 3, sin premio
    //   Profesor               = 10% base = 0.005 ETH
    const r1t = buildRonda(1, profesor.account.address);
    const r2t = buildRonda(2, profesor.account.address);
    const r3t = buildRonda(3, profesor.account.address);

    await factory.write.createGame(
      [2n, 3n, diplomaURI, [r1t, r2t, r3t], entryFee],
      { account: profesor.account, value: creationFee }
    );
    const gameAddr = await factory.read.games([0n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    for (const p of [a1, a2, a3, a4, a5]) {
      await game.write.joinGame({ value: entryFee, account: p.account });
    }

    // Q0 (correct=1): a1,a2,a3,a4 aciertan; a5 falla
    await game.write.startNextQuestion([enunciado, opciones, profeSalt], { account: profesor.account });
    for (const [p, opt] of [[a1,1],[a2,1],[a3,1],[a4,1],[a5,2]]) {
      await game.write.commitAnswer([generateHash(opt, "s", p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([1, profeSalt], { account: profesor.account });
    for (const [p, opt] of [[a1,1],[a2,1],[a3,1],[a4,1],[a5,2]]) {
      await game.write.revealAnswer([0n, opt, "s"], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    // Q1 (correct=2): a1,a2,a3 aciertan; a4,a5 fallan
    await game.write.startNextQuestion([enunciado, opciones, profeSalt], { account: profesor.account });
    for (const [p, opt] of [[a1,2],[a2,2],[a3,2],[a4,1],[a5,1]]) {
      await game.write.commitAnswer([generateHash(opt, "s", p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([2, profeSalt], { account: profesor.account });
    for (const [p, opt] of [[a1,2],[a2,2],[a3,2],[a4,1],[a5,1]]) {
      await game.write.revealAnswer([1n, opt, "s"], { account: p.account });
    }
    await game.write.advanceToNextQuestion({ account: profesor.account });

    // Q2 (correct=3): a1,a2 aciertan; a3,a4,a5 fallan
    await game.write.startNextQuestion([enunciado, opciones, profeSalt], { account: profesor.account });
    for (const [p, opt] of [[a1,3],[a2,3],[a3,1],[a4,1],[a5,1]]) {
      await game.write.commitAnswer([generateHash(opt, "s", p.account.address)], { account: p.account });
    }
    await game.write.closeQuestionAndStartReveal([3, profeSalt], { account: profesor.account });
    for (const [p, opt] of [[a1,3],[a2,3],[a3,1],[a4,1],[a5,1]]) {
      await game.write.revealAnswer([2n, opt, "s"], { account: p.account });
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
    // 3 jugadores, 1 pregunta, todos aciertan → scores: a1=1, a2=1, a3=1
    // prizePool = 0.03 ETH
    //   Grupo a1,a2,a3 (score=1): slots 1,2,3 → pool = 90% = 0.027 ETH
    //   prizePerPlayer = 0.027/3 = 0.009 ETH
    //   Profesor = 10% = 0.003 ETH
    const game = await run1QuestionGame([a1, a2, a3], [a1, a2, a3]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(1n);
    expect(await game.read.topScoreCounts([0n])).to.equal(3n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.009"));

    // No hay grupos 1 ni 2 (todos los slots premiados ya fueron consumidos)
    expect(await game.read.topScoreCounts([1n])).to.equal(0n);
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);

    expect(await game.read.professorPrize()).to.equal(parseEther("0.003"));
  });

  it("2 empatados en 1° ocupan slots 1+2; el 3° (score=0) recibe solo rank3", async function () {
    // 3 jugadores, 1 pregunta: a1,a2 aciertan; a3 falla
    // Scores: a1=1, a2=1, a3=0  →  prizePool = 0.03 ETH
    //   Grupo a1,a2 (score=1): slots 1+2 → 80% = 0.024 ETH → 0.012 ETH c/u
    //   Grupo a3    (score=0): slot 3    → 10% = 0.003 ETH
    //   Profesor               = 10% base = 0.003 ETH
    const game = await run1QuestionGame([a1, a2, a3], [a1, a2]);
    await game.write.calculatePrizes({ account: a1.account });

    expect(await game.read.topScoreValues([0n])).to.equal(1n);
    expect(await game.read.topScoreCounts([0n])).to.equal(2n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.012"));

    expect(await game.read.topScoreValues([1n])).to.equal(0n);
    expect(await game.read.topScoreCounts([1n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([1n])).to.equal(parseEther("0.003"));

    expect(await game.read.topScoreCounts([2n])).to.equal(0n); // sin tercer grupo
    expect(await game.read.professorPrize()).to.equal(parseEther("0.003"));
  });

  it("Jugador con score 0 en slot 3 puede reclamar su premio", async function () {
    // Mismo escenario anterior: a3 (score=0) queda en slot 3 y puede retirar
    const game = await run1QuestionGame([a1, a2, a3], [a1, a2]);
    await game.write.calculatePrizes({ account: a1.account });

    const publicClient = await viem.getPublicClient();
    const antes = await publicClient.getBalance({ address: a3.account.address });
    await game.write.claimPrize({ account: a3.account });
    const despues = await publicClient.getBalance({ address: a3.account.address });

    expect(despues > antes).to.be.true;
  });

  // ─── Nuevos tests: escenarios olímpicos ──────────────────────────────────────

  it("Empate en 2° puesto: 1 ganador limpio en 1°, 2 empatados acumulan rank2+rank3", async function () {
    // 3 jugadores, 2 preguntas:
    //   a1 acierta las 2  → score=2 (1° olímpico, slot 1)
    //   a2, a3 aciertan 1 → score=1 (empate en 2° olímpico, slots 2+3)
    // prizePool = 0.03 ETH
    //   a1:     60% = 0.018 ETH
    //   a2, a3: (20%+10%) / 2 = 0.009/2 = 0.0045 ETH c/u
    //   Profesor: 10% = 0.003 ETH
    const game = await run2QuestionGame(
      [a1, a2, a3],
      [[a1, a2, a3], [a1]]   // Q0: todos aciertan; Q1: solo a1 acierta
    );
    await game.write.calculatePrizes({ account: a1.account });

    // Grupo 0: a1 solo en 1° (slot 1 → 60%)
    expect(await game.read.topScoreValues([0n])).to.equal(2n);
    expect(await game.read.topScoreCounts([0n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.018"));

    // Grupo 1: a2,a3 empatan en 2° olímpico (slots 2+3 → 30% acumulado / 2)
    expect(await game.read.topScoreValues([1n])).to.equal(1n);
    expect(await game.read.topScoreCounts([1n])).to.equal(2n);
    expect(await game.read.prizePerPlayerAtRank([1n])).to.equal(parseEther("0.0045"));

    // Sin tercer grupo
    expect(await game.read.topScoreCounts([2n])).to.equal(0n);

    // Profesor: 10% = 0.003 ETH
    expect(await game.read.professorPrize()).to.equal(parseEther("0.003"));
  });

  it("Empate en 2° puesto: ambos empatados pueden retirar su premio", async function () {
    const game = await run2QuestionGame(
      [a1, a2, a3],
      [[a1, a2, a3], [a1]]
    );
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
    // 4 jugadores, 2 preguntas:
    //   a1 acierta las 2  → score=2 (1° olímpico, slot 1)
    //   a2 acierta solo Q0 → score=1 (2° olímpico, slot 2)
    //   a3, a4 no aciertan → score=0 (empate en 3° olímpico, slot 3 — dividen 10%)
    // prizePool = 0.04 ETH
    //   a1:     60% = 0.024 ETH
    //   a2:     20% = 0.008 ETH
    //   a3, a4: 10%/2 = 0.002 ETH c/u
    //   Profesor: 10% = 0.004 ETH
    const game = await run2QuestionGame(
      [a1, a2, a3, a4],
      [[a1, a2], [a1]]   // Q0: a1,a2 aciertan; Q1: solo a1 acierta
    );
    await game.write.calculatePrizes({ account: a1.account });

    // Grupo 0: a1 en 1° (slot 1 → 60%)
    expect(await game.read.topScoreValues([0n])).to.equal(2n);
    expect(await game.read.topScoreCounts([0n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([0n])).to.equal(parseEther("0.024"));

    // Grupo 1: a2 en 2° (slot 2 → 20%)
    expect(await game.read.topScoreValues([1n])).to.equal(1n);
    expect(await game.read.topScoreCounts([1n])).to.equal(1n);
    expect(await game.read.prizePerPlayerAtRank([1n])).to.equal(parseEther("0.008"));

    // Grupo 2: a3,a4 empatan en 3° olímpico (slot 3 → 10% / 2)
    expect(await game.read.topScoreValues([2n])).to.equal(0n);
    expect(await game.read.topScoreCounts([2n])).to.equal(2n);
    expect(await game.read.prizePerPlayerAtRank([2n])).to.equal(parseEther("0.002"));

    // Profesor: 10% base
    expect(await game.read.professorPrize()).to.equal(parseEther("0.004"));
  });

  it("Empate masivo en 1° (4 jugadores): acumulan slots 1+2+3, ningún otro recibe premio", async function () {
    // 4 jugadores, 1 pregunta, todos aciertan → score=1 cada uno
    // prizePool = 0.04 ETH
    //   Grupo: slots 1,2,3 → 90% = 0.036 ETH / 4 = 0.009 ETH c/u
    //   Profesor: 10% = 0.004 ETH
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
    // a1,a2 empatan en 1° (slots 1+2), a3 en slot 3, a4 queda en slot 4 (sin premio)
    const game = await run1QuestionGame([a1, a2, a3, a4], [a1, a2, a3]);
    await game.write.calculatePrizes({ account: a1.account });

    // a4 tiene score=0, no está en ningún topScoreValues premiado con frecuencia > 0
    await expectRevert(
      game.write.claimPrize({ account: a4.account }),
      "Tu puntaje no esta en el top 3"
    );
  });

  it("Un solo jugador: gana slot 1 solo, slots 2 y 3 vacantes acumulan al profesor", async function () {
    // 1 jugador, 1 pregunta, acierta → score=1
    // prizePool = 0.01 ETH
    //   a1: 60% = 0.006 ETH
    //   Profesor: 10% base + 20% + 10% vacantes = 40% = 0.004 ETH
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
    await expectRevert(
      game.write.calculatePrizes({ account: a1.account }),
      "Los premios ya fueron calculados"
    );
  });

  it("calculatePrizes falla si no hay pozo de premios (entryFee = 0)", async function () {
    const r0 = buildRonda(1, profesor.account.address);
    await factory.write.createGame(
      [1n, 1n, diplomaURI, [r0], 0n],
      { account: profesor.account, value: creationFee }
    );
    const gameAddr = await factory.read.games([0n]);
    const game = await viem.getContractAt("KahootGame", gameAddr);

    await game.write.joinGame({ value: 0n, account: a1.account });
    await game.write.startNextQuestion([enunciado, opciones, profeSalt], { account: profesor.account });
    await game.write.commitAnswer(
      [generateHash(1, "s", a1.account.address)],
      { account: a1.account }
    );
    await game.write.closeQuestionAndStartReveal([1, profeSalt], { account: profesor.account });
    await game.write.revealAnswer([0n, 1, "s"], { account: a1.account });
    await game.write.advanceToNextQuestion({ account: profesor.account });

    await expectRevert(
      game.write.calculatePrizes({ account: a1.account }),
      "No hay pozo de premios para distribuir"
    );
  });

  it("prizesCalculated se setea en true luego de calculatePrizes", async function () {
    const game = await run1QuestionGame([a1], [a1]);
    expect(await game.read.prizesCalculated()).to.equal(false);
    await game.write.calculatePrizes({ account: a1.account });
    expect(await game.read.prizesCalculated()).to.equal(true);
  });

  it("Jugador sin premio no puede llamar claimPrize antes de calculatePrizes", async function () {
    const game = await run1QuestionGame([a1], [a1]);
    await expectRevert(
      game.write.claimPrize({ account: a1.account }),
      "Primero se debe llamar a calculatePrizes()"
    );
  });
});
