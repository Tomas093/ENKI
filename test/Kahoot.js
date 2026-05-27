import { expect } from "chai";
import { network } from "hardhat";
import { describe, it, beforeEach } from "node:test";
import { keccak256, encodePacked } from "viem";

describe("Kahoot Web3 - Patrón Factory y Commit/Reveal Seguro", function () {
  let factory, game, diplomaNFT;
  let owner, profesor, alumnoHonesto, alumnoTramposo;
  let viem;

  const metadataURI = "ipfs://QmMockMetadata...";
  const diplomaURI = "ipfs://QmMockDiploma...";

  function generateHash(opcion, salt, address) {
    return keccak256(
      encodePacked(
        ["uint8", "string", "address"],
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

    const walletClients = await viem.getWalletClients();
    owner = walletClients;
    profesor = walletClients;
    alumnoHonesto = walletClients;
    alumnoTramposo = walletClients;

    factory = await viem.deployContract("KahootFactory");

    // CORRECCIÓN: Argumentos posicionales (sueltos) en lugar de array
    await factory.write.createGame(
      1n, 
      1n, 
      metadataURI, 
      diplomaURI, 
      { account: profesor.account }
    );

    // CORRECCIÓN: Argumento suelto
    const gameAddress = await factory.read.games(0n);
    game = await viem.getContractAt("KahootGame", gameAddress);

    const diplomaAddress = await game.read.diplomaContract();
    diplomaNFT = await viem.getContractAt("DiplomaNFT", diplomaAddress);
  });

  it("TEST 1: El copion no puede robar el hash (Vulnerabilidad Arreglada)", async function () {
    await game.write.startNextQuestion({ account: profesor.account });

    const hashHonesto = generateHash(1, "secreto", alumnoHonesto.account.address);
    // CORRECCIÓN: Argumento suelto
    await game.write.commitAnswer(hashHonesto, { account: alumnoHonesto.account });

    await game.write.commitAnswer(hashHonesto, { account: alumnoTramposo.account });

    await game.write.closeQuestionAndStartReveal({ account: profesor.account });

    // CORRECCIÓN: Argumentos sueltos
    await game.write.revealAnswer(0n, 1, "secreto", { account: alumnoHonesto.account });
    expect(await game.read.scores(alumnoHonesto.account.address)).to.equal(1n);

    await expectRevert(
      game.write.revealAnswer(0n, 1, "secreto", { account: alumnoTramposo.account }),
      "El hash no coincide"
    );
  });

  it("TEST 2: Deberia fallar si intentan acciones fuera de fase", async function () {
    const hash = generateHash(1, "salt", alumnoHonesto.account.address);

    await expectRevert(
      game.write.commitAnswer(hash, { account: alumnoHonesto.account }),
      "Fase de commit cerrada"
    );

    await game.write.startNextQuestion({ account: profesor.account });
    await game.write.commitAnswer(hash, { account: alumnoHonesto.account });

    await expectRevert(
      game.write.revealAnswer(0n, 1, "salt", { account: alumnoHonesto.account }),
      "Fase de reveal cerrada"
    );

    await game.write.closeQuestionAndStartReveal({ account: profesor.account });

    const hash2 = generateHash(2, "salt2", alumnoTramposo.account.address);
    await expectRevert(
      game.write.commitAnswer(hash2, { account: alumnoTramposo.account }),
      "Fase de commit cerrada"
    );
  });

  it("TEST 3: Proteccion de Doble Claim", async function () {
    await game.write.startNextQuestion({ account: profesor.account });
    await game.write.commitAnswer(generateHash(1, "s1", alumnoHonesto.account.address), { account: alumnoHonesto.account });
    await game.write.closeQuestionAndStartReveal({ account: profesor.account });
    await game.write.revealAnswer(0n, 1, "s1", { account: alumnoHonesto.account });
    await game.write.advanceToNextQuestion({ account: profesor.account });

    await game.write.claimDiploma({ account: alumnoHonesto.account });

    await expectRevert(
      game.write.claimDiploma({ account: alumnoHonesto.account }),
      "Ya reclamaste tu diploma"
    );
  });

  it("TEST 4: Seguridad del Profesor", async function () {
    await expectRevert(
      game.write.startNextQuestion({ account: alumnoTramposo.account }),
      "Solo el profe puede ejecutar esto"
    );

    await expectRevert(
      game.write.closeQuestionAndStartReveal({ account: alumnoTramposo.account }),
      "Solo el profe puede ejecutar esto"
    );
  });

  it("TEST 5: Partida completa de 3 preguntas (Loop completo)", async function () {
    // CORRECCIÓN: Argumentos sueltos
    await factory.write.createGame(
      2n, 
      3n, 
      metadataURI, 
      diplomaURI, 
      { account: profesor.account }
    );
    const game3Address = await factory.read.games(1n);
    const game3 = await viem.getContractAt("KahootGame", game3Address);

    await game3.write.startNextQuestion({ account: profesor.account });
    await game3.write.commitAnswer(generateHash(1, "s1", alumnoHonesto.account.address), { account: alumnoHonesto.account });
    await game3.write.closeQuestionAndStartReveal({ account: profesor.account });
    await game3.write.revealAnswer(0n, 1, "s1", { account: alumnoHonesto.account });
    await game3.write.advanceToNextQuestion({ account: profesor.account });

    await game3.write.startNextQuestion({ account: profesor.account });
    await game3.write.commitAnswer(generateHash(2, "s2", alumnoHonesto.account.address), { account: alumnoHonesto.account });
    await game3.write.closeQuestionAndStartReveal({ account: profesor.account });
    await game3.write.revealAnswer(1n, 2, "s2", { account: alumnoHonesto.account });
    await game3.write.advanceToNextQuestion({ account: profesor.account });

    await game3.write.startNextQuestion({ account: profesor.account });
    await game3.write.commitAnswer(generateHash(1, "s3", alumnoHonesto.account.address), { account: alumnoHonesto.account });
    await game3.write.closeQuestionAndStartReveal({ account: profesor.account });
    await game3.write.revealAnswer(2n, 1, "s3", { account: alumnoHonesto.account });
    await game3.write.advanceToNextQuestion({ account: profesor.account });

    expect(await game3.read.scores(alumnoHonesto.account.address)).to.equal(2n);
    expect(await game3.read.isFinished()).to.be.true;

    await game3.write.claimDiploma({ account: alumnoHonesto.account });
  });
});