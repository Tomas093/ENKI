import {expect} from "chai";
import {network} from "hardhat";
import {beforeEach, describe, it} from "node:test";
import {encodePacked, keccak256, parseEther} from "viem";
import {buildGameMerkleTree, buildPlaceholderQuestions, PROFE_SALT, STUDENT_SALT} from "./testHelpers.js";

describe("KahootGame - Fases y Roles", function () {
  let factory, game;
  let owner, profesor, alumnoHonesto, alumnoTramposo;
  let viem;

  const diplomaURI = "ipfs://QmMockDiploma...";
  const entryFee = parseEther("0.01");
  const creationFee = parseEther("0.001");

  let merkleTree;
  let qs;

  function generateStudentHash(opcion, salt, address) {
    return keccak256(
      encodePacked(
        ["uint8", "bytes32", "address"],
        [opcion, salt, address]
      )
    );
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
    const networkContext = await network.create({
      network: "hardhatMainnet",
      chainType: "l1",
    });
    viem = networkContext.viem;

    [owner, profesor, alumnoHonesto, alumnoTramposo] = await viem.getWalletClients();

    factory = await viem.deployContract("KahootFactory", [creationFee]);
    qs = buildPlaceholderQuestions(1);
    merkleTree = buildGameMerkleTree(qs, profesor.account.address);
    await factory.write.createGame(
      ["Test Game", 1n, 1n, diplomaURI, merkleTree.root, entryFee],
      { account: profesor.account, value: creationFee }
    );
    const gameAddress = await factory.read.games([0n]);
    game = await viem.getContractAt("KahootGame", gameAddress);
  });

  it("Deberia fallar si intentan acciones fuera de fase", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.joinGame({ value: entryFee, account: alumnoTramposo.account });

    const hash = generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address);

    await expectRevert(
      game.write.commitAnswer([hash], { account: alumnoHonesto.account }),
      "Fase de commit cerrada"
    );

    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([hash], { account: alumnoHonesto.account });

    await expectRevert(
      game.write.revealAnswer([0n, 1, STUDENT_SALT], { account: alumnoHonesto.account }),
      "Fase de reveal cerrada"
    );

    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });

    const hash2 = generateStudentHash(2, STUDENT_SALT, alumnoTramposo.account.address);
    await expectRevert(
      game.write.commitAnswer([hash2], { account: alumnoTramposo.account }),
      "Fase de commit cerrada"
    );
  });

  it("Profesor no puede abrir pregunta 2 si la pregunta 1 está en commit", async function () {
    const q2 = buildPlaceholderQuestions(2);
    const mt2 = buildGameMerkleTree(q2, profesor.account.address);
    await factory.write.createGame(["Test Game", 1n, 2n, diplomaURI, mt2.root, entryFee], { account: profesor.account, value: creationFee });
    const gameAddr = await factory.read.games([1n]);
    const game2 = await viem.getContractAt("KahootGame", gameAddr);

    await game2.write.startNextQuestion([mt2.questions[0].questionHash, mt2.questions[0].correctAnswerHash, mt2.getProof(0), mt2.questions[0].enunciado, mt2.questions[0].opciones, mt2.questions[0].saltPregunta], { account: profesor.account });

    await expectRevert(
      game2.write.advanceToNextQuestion({ account: profesor.account }),
      "Primero hay que abrir los reveals"
    );
  });

  it("Profesor no puede abrir pregunta 2 si la pregunta 1 está en reveal", async function () {
    const q2 = buildPlaceholderQuestions(2);
    const mt2 = buildGameMerkleTree(q2, profesor.account.address);
    await factory.write.createGame(["Test Game", 1n, 2n, diplomaURI, mt2.root, entryFee], { account: profesor.account, value: creationFee });
    const gameAddr = await factory.read.games([1n]);
    const game2 = await viem.getContractAt("KahootGame", gameAddr);

    await game2.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game2.write.startNextQuestion([mt2.questions[0].questionHash, mt2.questions[0].correctAnswerHash, mt2.getProof(0), mt2.questions[0].enunciado, mt2.questions[0].opciones, mt2.questions[0].saltPregunta], { account: profesor.account });
    await game2.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    
    await game2.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });

    await expectRevert(
      game2.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account }),
      "No esta en fase de commit"
    );
  });

  it("advanceToNextQuestion falla si la fase actual es commit (no reveal)", async function () {
    const q2 = buildPlaceholderQuestions(2);
    const mt2 = buildGameMerkleTree(q2, profesor.account.address);
    await factory.write.createGame(["Test Game", 1n, 2n, diplomaURI, mt2.root, entryFee], { account: profesor.account, value: creationFee });
    const gameAddr = await factory.read.games([1n]);
    const game2 = await viem.getContractAt("KahootGame", gameAddr);

    await game2.write.startNextQuestion([mt2.questions[0].questionHash, mt2.questions[0].correctAnswerHash, mt2.getProof(0), mt2.questions[0].enunciado, mt2.questions[0].opciones, mt2.questions[0].saltPregunta], { account: profesor.account });

    await expectRevert(
      game2.write.advanceToNextQuestion({ account: profesor.account }),
      "Primero hay que abrir los reveals"
    );
  });

  it("Seguridad del Profesor (start y close)", async function () {
    await expectRevert(
      game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: alumnoTramposo.account }),
      "Solo el profe puede ejecutar esto"
    );
    await expectRevert(
      game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: alumnoTramposo.account }),
      "Solo el profe puede ejecutar esto"
    );
  });

  it("Alumno no puede llamar startNextQuestion", async function () {
    await expectRevert(
      game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: alumnoHonesto.account }),
      "Solo el profe puede ejecutar esto"
    );
  });

  it("Alumno no puede llamar closeQuestionAndStartReveal", async function () {
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await expectRevert(
      game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: alumnoHonesto.account }),
      "Solo el profe puede ejecutar esto"
    );
  });

  it("Alumno no puede llamar advanceToNextQuestion", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });

    await expectRevert(
      game.write.advanceToNextQuestion({ account: alumnoHonesto.account }),
      "Solo el profe puede ejecutar esto"
    );
  });

  it("Owner (no profesor) tampoco puede ejecutar funciones de profesor", async function () {
    await expectRevert(
      game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: owner.account }),
      "Solo el profe puede ejecutar esto"
    );
    await expectRevert(
      game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: owner.account }),
      "Solo el profe puede ejecutar esto"
    );
    await expectRevert(
      game.write.advanceToNextQuestion({ account: owner.account }),
      "Solo el profe puede ejecutar esto"
    );
  });

  it("startNextQuestion falla cuando no hay más preguntas", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    await game.write.revealAnswer([0n, 1, STUDENT_SALT], { account: alumnoHonesto.account });
    await game.write.advanceToNextQuestion({ account: profesor.account });

    await expectRevert(
      game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account }),
      "El juego termino"
    );
  });

  it("closeQuestionAndStartReveal falla si no hay commit phase abierta", async function () {
    await expectRevert(
      game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account }),
      "No esta en fase de commit"
    );
  });

});
