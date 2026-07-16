import {expect} from "chai";
import {network} from "hardhat";
import {beforeEach, describe, it} from "node:test";
import {encodePacked, keccak256, parseEther} from "viem";
import {buildGameMerkleTree, buildPlaceholderQuestions, PROFE_SALT, STUDENT_SALT} from "./testHelpers.js";

describe("KahootGame - Diploma NFT y Reclamos", function () {
  let factory, game, diplomaNFT;
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
    
    const diplomaAddress = await game.read.diplomaContract();
    diplomaNFT = await viem.getContractAt("DiplomaNFT", diplomaAddress);
  });

  it("Proteccion de Doble Claim", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });

    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)], { account: alumnoHonesto.account });
    
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account }); 
    
    await game.write.revealAnswer([0n, 1, STUDENT_SALT], { account: alumnoHonesto.account });
    await game.write.advanceToNextQuestion({ account: profesor.account });

    await game.write.claimDiploma({ account: alumnoHonesto.account });

    await expectRevert(
      game.write.claimDiploma({ account: alumnoHonesto.account }),
      "Ya reclamaste tu diploma"
    );
  });

  it("Alumno desaprobado no puede reclamar diploma", async function () {
    const q2 = buildPlaceholderQuestions(2);
    q2[0].correctOption = 1;
    q2[1].correctOption = 2;
    const mt2 = buildGameMerkleTree(q2, profesor.account.address);

    await factory.write.createGame(
      ["Test Game 2", 2n, 2n, diplomaURI, mt2.root, entryFee], 
      { account: profesor.account, value: creationFee }
    );
    const gameAddr = await factory.read.games([1n]);
    const gameDesa = await viem.getContractAt("KahootGame", gameAddr);

    await gameDesa.write.joinGame({ value: entryFee, account: alumnoHonesto.account });

    // Q1
    await gameDesa.write.startNextQuestion([mt2.questions[0].questionHash, mt2.questions[0].correctAnswerHash, mt2.getProof(0), mt2.questions[0].enunciado, mt2.questions[0].opciones, mt2.questions[0].saltPregunta], { account: profesor.account });
    await gameDesa.write.commitAnswer([generateStudentHash(3, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    await gameDesa.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    await gameDesa.write.revealAnswer([0n, 3, STUDENT_SALT], { account: alumnoHonesto.account });
    await gameDesa.write.advanceToNextQuestion({ account: profesor.account });

    // Q2
    await gameDesa.write.startNextQuestion([mt2.questions[1].questionHash, mt2.questions[1].correctAnswerHash, mt2.getProof(1), mt2.questions[1].enunciado, mt2.questions[1].opciones, mt2.questions[1].saltPregunta], { account: profesor.account });
    await gameDesa.write.commitAnswer([generateStudentHash(2, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    await gameDesa.write.closeQuestionAndStartReveal([2, PROFE_SALT], { account: profesor.account });
    await gameDesa.write.revealAnswer([1n, 2, STUDENT_SALT], { account: alumnoHonesto.account });
    await gameDesa.write.advanceToNextQuestion({ account: profesor.account });

    expect(await gameDesa.read.isFinished()).to.be.true;
    expect(await gameDesa.read.scores([alumnoHonesto.account.address])).to.equal(1n);

    await expectRevert(
      gameDesa.write.claimDiploma({ account: alumnoHonesto.account }),
      "No alcanzas el puntaje"
    );
  });

  it("claimDiploma falla si el juego no terminó", async function () {
    await expectRevert(
      game.write.claimDiploma({ account: alumnoHonesto.account }),
      "El juego no ha terminado"
    );
  });

  it("Alumno que nunca jugó no puede reclamar diploma", async function () {
    await game.write.joinGame({ value: entryFee, account: alumnoHonesto.account });
    await game.write.startNextQuestion([merkleTree.questions[0].questionHash, merkleTree.questions[0].correctAnswerHash, merkleTree.getProof(0), merkleTree.questions[0].enunciado, merkleTree.questions[0].opciones, merkleTree.questions[0].saltPregunta], { account: profesor.account });
    await game.write.commitAnswer([generateStudentHash(1, STUDENT_SALT, alumnoHonesto.account.address)],{ account: alumnoHonesto.account });
    await game.write.closeQuestionAndStartReveal([1, PROFE_SALT], { account: profesor.account });
    await game.write.revealAnswer([0n, 1, STUDENT_SALT], { account: alumnoHonesto.account });
    await game.write.advanceToNextQuestion({ account: profesor.account });

    expect(await game.read.isFinished()).to.be.true;

    await expectRevert(
      game.write.claimDiploma({ account: alumnoTramposo.account }),
      "No alcanzas el puntaje minimo"
    );
  });

  it("DiplomaNFT - solo el contrato KahootGame puede mintear", async function () {
    await expectRevert(
      diplomaNFT.write.mintDiploma(
        [alumnoHonesto.account.address],
        { account: profesor.account }
      ),
      "UnauthorizedGame"
    );
  });

  it("DiplomaNFT - falla con InvalidAddress si game es address(0)", async function () {
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    await expectRevert(
      viem.deployContract("DiplomaNFT", [zeroAddress, diplomaURI]),
      "InvalidAddress"
    );
  });

});
