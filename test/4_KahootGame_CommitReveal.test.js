import {expect} from "chai";
import {network} from "hardhat";
import {beforeEach, describe, it} from "node:test";
import {encodePacked, keccak256, pad, parseEther, stringToHex} from "viem";
import {buildGameMerkleTree, buildPlaceholderQuestions, PROFE_SALT, STUDENT_SALT} from "./testHelpers.js";

describe("KahootGame - Commit & Reveal Seguros", function () {
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

  it("Reveal sin haber hecho commit previo (revelación fantasma)", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.joinGame({ value: entryFee, account: alumnoTramposo.account });

    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });

    await expectRevert(
      game.write.revealAnswer([0n, 1, pad(stringToHex("fake"), { size: 32 })], { account: alumnoTramposo.account }),
      "No hiciste commit"
    );
  });

  it("Commit de bytes32(0) debería fallar", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    const nullHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    await expectRevert(
      game.write.commitAnswer([nullHash], { account: alumnoHonesto.account }),
      "Hash nulo"
    );
  });

  it("No se puede hacer commit dos veces en la misma pregunta", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });

    const hash = generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address);
    await game.write.commitAnswer([hash], { account: alumnoHonesto.account });

    const hash2 = generateStudentHash(2, STUDENT_SALT, alumnoHonesto.account.address);
    await expectRevert(
      game.write.commitAnswer([hash2], { account: alumnoHonesto.account }),
      "Ya respondiste"
    );
  });

  it("No se puede hacer reveal dos veces", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    
    await game.write.revealAnswer([0n, 1, STUDENT_SALT], { account: alumnoHonesto.account });

    await expectRevert(
      game.write.revealAnswer([0n, 1, STUDENT_SALT], { account: alumnoHonesto.account }),
      "No hiciste commit en esta pregunta"
    );
  });

  it("Reveal con hash incorrecto (salt equivocado)", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });

    await expectRevert(
      game.write.revealAnswer([0n, 1, pad(stringToHex("salt_falso"), { size: 32 })], { account: alumnoHonesto.account }),
      "El hash no coincide con tu commit"
    );
  });

  it("Reveal con opción distinta a la commiteada", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });

    await expectRevert(
      game.write.revealAnswer([0n, 2, STUDENT_SALT], { account: alumnoHonesto.account }),
      "El hash no coincide con tu commit"
    );
  });

  it("El Profesor no puede cambiar la respuesta correcta (Doble Commit-Reveal)", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    
    const hash = generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address);
    await game.write.commitAnswer([hash], { account: alumnoHonesto.account });

    await expectRevert(
      game.write.closeQuestionAndStartReveal([2, PROFE_SALT], { account: profesor.account }),
      "Hash de respuesta incorrecto" 
    );

    await expectRevert(
      game.write.closeQuestionAndStartReveal([1, pad(stringToHex("saltFalso"), { size: 32 })], { account: profesor.account }),
      "Hash de respuesta incorrecto"
    );

    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    expect(await game.read.revealedAnswers([0n])).to.equal(1);
  });

});
