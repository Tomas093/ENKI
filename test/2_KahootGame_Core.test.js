import {expect} from "chai";
import {network} from "hardhat";
import {beforeEach, describe, it} from "node:test";
import {encodePacked, keccak256, parseEther} from "viem";
import {buildGameMerkleTree, buildPlaceholderQuestions, STUDENT_SALT} from "./testHelpers.js";

describe("KahootGame - Flujo Principal (Core)", function () {
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

  it("El copion no puede robar el hash", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.joinGame({ value: entryFee, account: alumnoTramposo.account });

    const q = merkleTree.questions[0];
    await game.write.startNextQuestion(
      [q.questionHash, q.correctAnswerHash, merkleTree.getProof(0), q.enunciado, q.opciones, q.saltPregunta],
      { account: profesor.account }
    );

    const secretoHonesto = STUDENT_SALT;

    const hashHonesto = generateStudentHash(1, secretoHonesto, alumnoHonesto.account.address);
    
    await game.write.commitAnswer([hashHonesto], { account: alumnoHonesto.account });
    await game.write.commitAnswer([hashHonesto], { account: alumnoTramposo.account });

    await game.write.closeQuestionAndStartReveal([1, q.saltRespuesta], { account: profesor.account });

    await game.write.revealAnswer([0n, 1, secretoHonesto], { account: alumnoHonesto.account });
    expect(await game.read.scores([alumnoHonesto.account.address])).to.equal(1n);

    await expectRevert(
      game.write.revealAnswer([0n, 1, secretoHonesto], { account: alumnoTramposo.account }),
      "El hash no coincide"
    );
  });

  it("Partida completa de 3 preguntas (Loop completo)", async function () {
    const q3 = buildPlaceholderQuestions(3);
    q3[0].correctOption = 1;
    q3[1].correctOption = 2;
    q3[2].correctOption = 1;
    const mt3 = buildGameMerkleTree(q3, profesor.account.address);

    await factory.write.createGame(
      ["Test Game 3", 2n, 3n, diplomaURI, mt3.root, entryFee],
      { account: profesor.account, value: creationFee }
    );
    const game3Address = await factory.read.games([1n]);
    const game3 = await viem.getContractAt("KahootGame", game3Address);

    await game3.write.joinGame({ value: entryFee, account: alumnoHonesto.account });

    const secreto = STUDENT_SALT;

    // Q1
    await game3.write.startNextQuestion([mt3.questions[0].questionHash, mt3.questions[0].correctAnswerHash, mt3.getProof(0), mt3.questions[0].enunciado, mt3.questions[0].opciones, mt3.questions[0].saltPregunta], { account: profesor.account });
    await game3.write.commitAnswer([generateStudentHash(1, secreto, alumnoHonesto.account.address)], { account: alumnoHonesto.account });
    await game3.write.closeQuestionAndStartReveal([1, mt3.questions[0].saltRespuesta], { account: profesor.account }); 
    await game3.write.revealAnswer([0n, 1, secreto], { account: alumnoHonesto.account });
    await game3.write.advanceToNextQuestion({ account: profesor.account });

    // Q2
    await game3.write.startNextQuestion([mt3.questions[1].questionHash, mt3.questions[1].correctAnswerHash, mt3.getProof(1), mt3.questions[1].enunciado, mt3.questions[1].opciones, mt3.questions[1].saltPregunta], { account: profesor.account });
    await game3.write.commitAnswer([generateStudentHash(2, secreto, alumnoHonesto.account.address)], { account: alumnoHonesto.account });
    await game3.write.closeQuestionAndStartReveal([2, mt3.questions[1].saltRespuesta], { account: profesor.account }); 
    await game3.write.revealAnswer([1n, 2, secreto], { account: alumnoHonesto.account });
    await game3.write.advanceToNextQuestion({ account: profesor.account });

    // Q3
    await game3.write.startNextQuestion([mt3.questions[2].questionHash, mt3.questions[2].correctAnswerHash, mt3.getProof(2), mt3.questions[2].enunciado, mt3.questions[2].opciones, mt3.questions[2].saltPregunta], { account: profesor.account });
    await game3.write.commitAnswer([generateStudentHash(1, secreto, alumnoHonesto.account.address)], { account: alumnoHonesto.account });
    await game3.write.closeQuestionAndStartReveal([1, mt3.questions[2].saltRespuesta], { account: profesor.account }); 
    await game3.write.revealAnswer([2n, 1, secreto], { account: alumnoHonesto.account });
    await game3.write.advanceToNextQuestion({ account: profesor.account });

    expect(await game3.read.scores([alumnoHonesto.account.address])).to.equal(3n);
    expect(await game3.read.isFinished()).to.be.true;

    await game3.write.claimDiploma({ account: alumnoHonesto.account });
  });

  it("KahootGame - variables de estado", async function () {
    expect((await game.read.professor()).toLowerCase()).to.equal(profesor.account.address.toLowerCase());
    expect(await game.read.passingScore()).to.equal(1n);
    expect(await game.read.totalQuestions()).to.equal(1n);
    expect(await game.read.isFinished()).to.be.false;
    expect(await game.read.currentQuestionId()).to.equal(0n);
  });

  it("Un alumno NO puede unirse después de que comience el juego", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    const q = merkleTree.questions[0];
    await game.write.startNextQuestion(
      [q.questionHash, q.correctAnswerHash, merkleTree.getProof(0), q.enunciado, q.opciones, q.saltPregunta],
      { account: profesor.account }
    );
    await expectRevert(
      game.write.joinGame({ value: entryFee, account: alumnoTramposo.account }),
      "El juego ya comenzo o ya termino"
    );
  });

});

