import { expect } from "chai";
import { network } from "hardhat";
import { describe, it, beforeEach } from "node:test";
import { keccak256, encodePacked, parseEther } from "viem";

describe("8 – KahootGame: Timeout por inactividad", function () {
  let game, factory;
  let professor, player1, player2, player3;
  let viem;

  const ENTRY_FEE = parseEther("0.01");
  const CREATION_FEE = parseEther("0.001");
  const DIPLOMA_URI = "ipfs://test-uri";
  const INACTIVITY_TIMEOUT = 12n * 60n * 60n; // 12 h en segundos

  // Datos para rondas con hashes reales (necesarios para el test de lastActionTime)
  const PROFE_SALT = "salt123";
  const ENUNCIADO = "¿Cuánto es 2+2?";
  const OPCIONES = ["A", "B", "C", "D"];
  const OPCION_CORRECTA = 1; // uint8

  function buildRonda(correctOption, professorAddr) {
    return {
      hashVerificacionPregunta: keccak256(
        encodePacked(
          ["string", "string", "string", "string", "string", "string"],
          [ENUNCIADO, OPCIONES[0], OPCIONES[1], OPCIONES[2], OPCIONES[3], PROFE_SALT]
        )
      ),
      hashRespuestaCorrecta: keccak256(
        encodePacked(
          ["uint8", "string", "address"],
          [correctOption, PROFE_SALT, professorAddr]
        )
      ),
      commitPhaseOpen: false,
      revealPhaseOpen: false,
    };
  }

  // Ronda con hashes placeholder (juego queda estancado sin poder avanzar)
  function buildPlaceholderRonda() {
    return {
      hashVerificacionPregunta: keccak256(encodePacked(["string"], ["placeholder"])),
      hashRespuestaCorrecta: keccak256(encodePacked(["string"], ["placeholder_r"])),
      commitPhaseOpen: false,
      revealPhaseOpen: false,
    };
  }

  // Helper: avanza el tiempo de la cadena en `seconds` segundos usando el testClient de viem
  async function increaseTime(seconds) {
    const testClient = await viem.getTestClient();
    await testClient.increaseTime({ seconds: Number(seconds) });
    await testClient.mine({ blocks: 1 });
  }

  // Helper: captura errores de revert y verifica el mensaje
  async function expectRevert(promise, expectedReason) {
    try {
      await promise;
      expect.fail("La transaccion deberia haber revertido");
    } catch (error) {
      expect(error.message).to.include(expectedReason);
    }
  }

  beforeEach(async function () {
    const ctx = await network.create({ network: "hardhatMainnet", chainType: "l1" });
    viem = ctx.viem;

    const walletClients = await viem.getWalletClients();
    [professor, player1, player2, player3] = walletClients;

    factory = await viem.deployContract("KahootFactory", [CREATION_FEE]);

    // Desplegar un juego con 2 preguntas placeholder (el profe no podrá avanzar → timeout)
    const rondas = [buildPlaceholderRonda(), buildPlaceholderRonda()];
    await factory.write.createGame(
      [1n, 2n, DIPLOMA_URI, rondas, ENTRY_FEE],
      { account: professor.account, value: CREATION_FEE }
    );

    const gameAddr = await factory.read.games([0n]);
    game = await viem.getContractAt("KahootGame", gameAddr);
  });

  // ─── Variables de estado ──────────────────────────────────────────────────

  describe("Variables de estado iniciales", function () {
    it("INACTIVITY_TIMEOUT vale exactamente 43 200 s (12 h)", async function () {
      expect(await game.read.INACTIVITY_TIMEOUT()).to.equal(INACTIVITY_TIMEOUT);
    });

    it("lastActionTime se inicializa al timestamp del bloque del constructor", async function () {
      const publicClient = await viem.getPublicClient();
      const block = await publicClient.getBlock();
      const lat = await game.read.lastActionTime();
      // lastActionTime debe estar dentro del mismo bloque (o un bloque antes)
      expect(lat <= block.timestamp && lat >= block.timestamp - 2n).to.be.true;
    });

    it("isCancelled arranca en false", async function () {
      expect(await game.read.isCancelled()).to.equal(false);
    });
  });

  // ─── Validaciones: jugador no registrado ─────────────────────────────────

  describe("claimRefund() – jugador no registrado", function () {
    it("revierte si el caller nunca llamó joinGame()", async function () {
      await increaseTime(INACTIVITY_TIMEOUT + 1n);
      await expectRevert(
        game.write.claimRefund({ account: player1.account }),
        "No participaste en este juego"
      );
    });
  });

  // ─── Validaciones: doble reembolso ───────────────────────────────────────

  describe("claimRefund() – doble reembolso", function () {
    it("revierte si el jugador intenta reclamar por segunda vez", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);

      await game.write.claimRefund({ account: player1.account });

      await expectRevert(
        game.write.claimRefund({ account: player1.account }),
        "Ya retiraste un premio o reembolso"
      );
    });
  });

  // ─── Validaciones: timeout no vencido ────────────────────────────────────

  describe("claimRefund() – timeout no vencido", function () {
    it("revierte si no pasó ningún tiempo", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await expectRevert(
        game.write.claimRefund({ account: player1.account }),
        "El timeout de inactividad aun no vencio"
      );
    });

    it("revierte si pasó tiempo pero menos de 12 h", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT - 60n); // 60 s antes del límite (margen para el timestamp del bloque)
      await expectRevert(
        game.write.claimRefund({ account: player1.account }),
        "El timeout de inactividad aun no vencio"
      );
    });
  });

  // ─── Happy path: reembolso exitoso ───────────────────────────────────────

  describe("claimRefund() – happy path", function () {
    it("permite reclamar el reembolso incluso si el juego nunca comenzó (currentQuestionId == 0)", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      
      // Verificamos explícitamente que el juego no ha comenzado
      expect(await game.read.currentQuestionId()).to.equal(0n);

      await increaseTime(INACTIVITY_TIMEOUT + 1n);

      const publicClient = await viem.getPublicClient();
      const balBefore = await publicClient.getBalance({ address: player1.account.address });
      const txHash = await game.write.claimRefund({ account: player1.account });
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      const tx = await publicClient.getTransaction({ hash: txHash });
      const gasCost = receipt.gasUsed * tx.gasPrice;
      const balAfter = await publicClient.getBalance({ address: player1.account.address });

      expect(balAfter).to.equal(balBefore + ENTRY_FEE - gasCost);
    });

    it("transfiere exactamente el entryFee al jugador", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);

      const publicClient = await viem.getPublicClient();
      const balBefore = await publicClient.getBalance({ address: player1.account.address });
      const txHash = await game.write.claimRefund({ account: player1.account });
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      const tx = await publicClient.getTransaction({ hash: txHash });
      const gasCost = receipt.gasUsed * tx.gasPrice;
      const balAfter = await publicClient.getBalance({ address: player1.account.address });

      expect(balAfter).to.equal(balBefore + ENTRY_FEE - gasCost);
    });

    it("permite el reembolso si el profesor abandona la partida estando en fase de commit", async function () {
      // Necesitamos un juego nuevo con hashes válidos para poder llamar a startNextQuestion
      const ctx2 = await network.create({ network: "hardhatMainnet", chainType: "l1" });
      const viem2 = ctx2.viem;
      const wallets2 = await viem2.getWalletClients();
      const [prof2, al2] = wallets2;

      const factory2 = await viem2.deployContract("KahootFactory", [CREATION_FEE]);
      const ronda = buildRonda(OPCION_CORRECTA, prof2.account.address);
      await factory2.write.createGame(
        [1n, 1n, DIPLOMA_URI, [ronda], ENTRY_FEE],
        { account: prof2.account, value: CREATION_FEE }
      );
      const gameAddr2 = await factory2.read.games([0n]);
      const game2 = await viem2.getContractAt("KahootGame", gameAddr2);

      // Jugador entra
      await game2.write.joinGame({ value: ENTRY_FEE, account: al2.account });

      // Profesor abre la pregunta (fase de commit)
      await game2.write.startNextQuestion(
        [ENUNCIADO, OPCIONES, PROFE_SALT],
        { account: prof2.account }
      );

      // Verificar que estamos en la fase de commit
      const currentQ = await game2.read.currentQuestionId();
      const rondaEnCurso = await game2.read.listaDeRondas([currentQ]);
      // rondaEnCurso devuelve una tupla/array, el campo commitPhaseOpen es el 3er elemento (índice 2) en el struct
      expect(rondaEnCurso[2]).to.be.true; // commitPhaseOpen == true

      // Avanza el tiempo 12 h desde que el profesor abrió la pregunta
      const testClient2 = await viem2.getTestClient();
      await testClient2.increaseTime({ seconds: Number(INACTIVITY_TIMEOUT) + 1 });
      await testClient2.mine({ blocks: 1 });

      const publicClient2 = await viem2.getPublicClient();
      const balBefore = await publicClient2.getBalance({ address: al2.account.address });
      
      const txHash = await game2.write.claimRefund({ account: al2.account });
      const receipt = await publicClient2.getTransactionReceipt({ hash: txHash });
      const tx = await publicClient2.getTransaction({ hash: txHash });
      const gasCost = receipt.gasUsed * tx.gasPrice;
      const balAfter = await publicClient2.getBalance({ address: al2.account.address });

      // Verifica que el jugador recuperó el dinero
      expect(balAfter).to.equal(balBefore + ENTRY_FEE - gasCost);
    });

    it("emite el evento RefundClaimed con los parámetros correctos", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);

      const publicClient = await viem.getPublicClient();
      const txHash = await game.write.claimRefund({ account: player1.account });
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      const logs = await game.getEvents.RefundClaimed(
        {},
        { fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber }
      );
      expect(logs.length).to.equal(1);
      expect(logs[0].args.player.toLowerCase()).to.equal(player1.account.address.toLowerCase());
      expect(logs[0].args.amount).to.equal(ENTRY_FEE);
    });

    it("decrementa prizePool en exactamente entryFee", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await game.write.joinGame({ value: ENTRY_FEE, account: player2.account });

      const poolBefore = await game.read.prizePool();
      await increaseTime(INACTIVITY_TIMEOUT + 1n);
      await game.write.claimRefund({ account: player1.account });

      expect(await game.read.prizePool()).to.equal(poolBefore - ENTRY_FEE);
    });

    it("marca hasPrizeClaimed[player] = true después del retiro", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);
      await game.write.claimRefund({ account: player1.account });

      expect(await game.read.hasPrizeClaimed([player1.account.address])).to.equal(true);
    });
  });

  // ─── Circuit Breaker ─────────────────────────────────────────────────────

  describe("Circuit Breaker – isCancelled", function () {
    it("pone isCancelled = true tras el primer claimRefund", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);
      await game.write.claimRefund({ account: player1.account });

      expect(await game.read.isCancelled()).to.equal(true);
    });

    it("emite GameCancelledByInactivity solo en el primer reembolso", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await game.write.joinGame({ value: ENTRY_FEE, account: player2.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);

      const publicClient = await viem.getPublicClient();

      // Primer reembolso → debe emitir GameCancelledByInactivity
      const hash1 = await game.write.claimRefund({ account: player1.account });
      const rec1 = await publicClient.getTransactionReceipt({ hash: hash1 });
      const cancelLogs1 = await game.getEvents.GameCancelledByInactivity(
        {},
        { fromBlock: rec1.blockNumber, toBlock: rec1.blockNumber }
      );
      expect(cancelLogs1.length).to.equal(1);

      // Segundo reembolso → NO debe volver a emitir GameCancelledByInactivity
      const hash2 = await game.write.claimRefund({ account: player2.account });
      const rec2 = await publicClient.getTransactionReceipt({ hash: hash2 });
      const cancelLogs2 = await game.getEvents.GameCancelledByInactivity(
        {},
        { fromBlock: rec2.blockNumber, toBlock: rec2.blockNumber }
      );
      expect(cancelLogs2.length).to.equal(0);
    });

    it("bloquea startNextQuestion() con notCancelled", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);
      await game.write.claimRefund({ account: player1.account });

      await expectRevert(
        game.write.startNextQuestion([ENUNCIADO, OPCIONES, PROFE_SALT], { account: professor.account }),
        "El juego fue cancelado por inactividad"
      );
    });

    it("bloquea closeQuestionAndStartReveal() con notCancelled", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);
      await game.write.claimRefund({ account: player1.account });

      await expectRevert(
        game.write.closeQuestionAndStartReveal([OPCION_CORRECTA, PROFE_SALT], { account: professor.account }),
        "El juego fue cancelado por inactividad"
      );
    });

    it("bloquea advanceToNextQuestion() con notCancelled", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await increaseTime(INACTIVITY_TIMEOUT + 1n);
      await game.write.claimRefund({ account: player1.account });

      await expectRevert(
        game.write.advanceToNextQuestion({ account: professor.account }),
        "El juego fue cancelado por inactividad"
      );
    });
  });

  // ─── Múltiples jugadores ─────────────────────────────────────────────────

  describe("Múltiples jugadores", function () {
    it("todos los jugadores pueden reclamar su reembolso de forma independiente", async function () {
      await game.write.joinGame({ value: ENTRY_FEE, account: player1.account });
      await game.write.joinGame({ value: ENTRY_FEE, account: player2.account });
      await game.write.joinGame({ value: ENTRY_FEE, account: player3.account });

      await increaseTime(INACTIVITY_TIMEOUT + 1n);

      await game.write.claimRefund({ account: player1.account });
      await game.write.claimRefund({ account: player2.account });
      await game.write.claimRefund({ account: player3.account });

      expect(await game.read.prizePool()).to.equal(0n);
    });
  });

  // ─── lastActionTime se actualiza con acciones del profesor ───────────────

  describe("lastActionTime – reseteo por acción del profesor", function () {
    it("startNextQuestion() actualiza lastActionTime al timestamp actual", async function () {
      // Nuevo contexto con hashes reales para poder llamar startNextQuestion
      const ctx2 = await network.create({ network: "hardhatMainnet", chainType: "l1" });
      const viem2 = ctx2.viem;
      const wallets2 = await viem2.getWalletClients();
      const [prof2] = wallets2;

      const factory2 = await viem2.deployContract("KahootFactory", [CREATION_FEE]);
      const ronda = buildRonda(OPCION_CORRECTA, prof2.account.address);
      await factory2.write.createGame(
        [1n, 1n, DIPLOMA_URI, [ronda], ENTRY_FEE],
        { account: prof2.account, value: CREATION_FEE }
      );
      const gameAddr2 = await factory2.read.games([0n]);
      const game2 = await viem2.getContractAt("KahootGame", gameAddr2);

      // Avanzar 1 hora para que lastActionTime quede desactualizado
      const testClient2 = await viem2.getTestClient();
      await testClient2.increaseTime({ seconds: 3600 });
      await testClient2.mine({ blocks: 1 });

      const latBefore = await game2.read.lastActionTime();

      await game2.write.startNextQuestion(
        [ENUNCIADO, OPCIONES, PROFE_SALT],
        { account: prof2.account }
      );

      const publicClient2 = await viem2.getPublicClient();
      const block = await publicClient2.getBlock();
      const latAfter = await game2.read.lastActionTime();

      // lastActionTime debe haberse actualizado al timestamp del bloque actual
      expect(latAfter).to.be.greaterThan(latBefore);
      expect(latAfter).to.equal(block.timestamp);
    });
  });
});
