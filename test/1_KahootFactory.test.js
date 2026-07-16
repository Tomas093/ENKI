import {expect} from "chai";
import {network} from "hardhat";
import {beforeEach, describe, it} from "node:test";
import {parseEther} from "viem";
import {buildGameMerkleTree, buildPlaceholderQuestions} from "./testHelpers.js";

describe("KahootFactory - Creación de Juegos y Validaciones", function () {
  let factory;
  let owner, profesor;
  let viem;

  const diplomaURI = "ipfs://QmMockDiploma...";
  const entryFee = parseEther("0.01");
  const creationFee = parseEther("0.001");

  // Helpers removidos en favor de testHelpers.js

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

    [owner, profesor] = await viem.getWalletClients();

    factory = await viem.deployContract("KahootFactory", [creationFee]);
  });

  it("Factory revert si _totalQuestions == 0", async function () {
    const tree = buildGameMerkleTree([], profesor.account.address);
    await expectRevert(
      factory.write.createGame(
        ["Test Game", 1n, 0n, diplomaURI, tree.root, entryFee],
        { account: profesor.account, value: creationFee }
      ),
      "Debe tener preguntas"
    );
  });

  it("Factory revert si _passingScore == 0", async function () {
    const qs = buildPlaceholderQuestions(1);
    const tree = buildGameMerkleTree(qs, profesor.account.address);
    await expectRevert(
      factory.write.createGame(
        ["Test Game", 0n, 1n, diplomaURI, tree.root, entryFee],
        { account: profesor.account, value: creationFee }
      ),
      "Puntaje invalido"
    );
  });

  it("Factory revert si _passingScore > _totalQuestions", async function () {
    const qs = buildPlaceholderQuestions(2);
    const tree = buildGameMerkleTree(qs, profesor.account.address);
    await expectRevert(
      factory.write.createGame(
        ["Test Game", 5n, 2n, diplomaURI, tree.root, entryFee],
        { account: profesor.account, value: creationFee }
      ),
      "Puntaje mayor al total"
    );
  });



  it("KahootFactory - getGamesCount funciona", async function () {
    const countAntes = await factory.read.getGamesCount();
    const qs = buildPlaceholderQuestions(1);
    const tree = buildGameMerkleTree(qs, profesor.account.address);

    await factory.write.createGame(
      ["Test Game", 1n, 1n, diplomaURI, tree.root, entryFee],
      { account: profesor.account, value: creationFee }
    );

    const countDespues = await factory.read.getGamesCount();
    expect(countDespues).to.equal(countAntes + 1n);
  });

  it("Factory revert si no se paga la tarifa de creacion", async function () {
    const qs = buildPlaceholderQuestions(1);
    const tree = buildGameMerkleTree(qs, profesor.account.address);
    await expectRevert(
      factory.write.createGame(
        ["Test Game", 1n, 1n, diplomaURI, tree.root, entryFee],
        { account: profesor.account }
      ),
      "Tarifa de creacion insuficiente"
    );
  });

  it("Factory: owner puede cambiar la tarifa de creacion", async function () {
    await factory.write.setCreationFee([parseEther("0.002")], { account: owner.account });
    const newFee = await factory.read.creationFee();
    expect(newFee).to.equal(parseEther("0.002"));
  });

  it("Factory: no-owner no puede cambiar la tarifa de creacion", async function () {
    await expectRevert(
      factory.write.setCreationFee([parseEther("0.002")], { account: profesor.account }),
      "Solo el owner"
    );
  });

  it("Factory: owner puede retirar las tarifas acumuladas", async function () {
    const qs = buildPlaceholderQuestions(1);
    const tree = buildGameMerkleTree(qs, profesor.account.address);
    await factory.write.createGame(
      ["Test Game", 1n, 1n, diplomaURI, tree.root, entryFee],
      { account: profesor.account, value: creationFee }
    );
    await factory.write.withdrawFees({ account: owner.account });
  });

});
