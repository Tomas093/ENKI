import { keccak256, encodePacked, encodeAbiParameters, parseAbiParameters, stringToHex, pad } from "viem";
import { MerkleTree } from "merkletreejs";

export function stringToBytes32(str) {
  return pad(stringToHex(str), { size: 32 });
}

export const PROFE_SALT = stringToBytes32("salt123");
export const STUDENT_SALT = stringToBytes32("studentSalt");

// Builds the question hash according to KahootGame.sol
export function getQuestionHash(enunciado, opciones, salt) {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters("string, string, string, string, string, bytes32"),
      [enunciado, opciones[0], opciones[1], opciones[2], opciones[3], salt]
    )
  );
}

// Builds the correct answer hash according to KahootGame.sol
export function getCorrectAnswerHash(correctOption, salt, professorAddr) {
  return keccak256(
    encodePacked(
      ["uint8", "bytes32", "address"],
      [correctOption, salt, professorAddr]
    )
  );
}

// Builds the leaf for the Merkle tree
export function getLeafHash(questionId, questionHash, correctAnswerHash) {
  return keccak256(
    encodePacked(
      ["uint256", "bytes32", "bytes32"],
      [BigInt(questionId), questionHash, correctAnswerHash]
    )
  );
}

export function buildGameMerkleTree(questions, professorAddr) {
  const leaves = questions.map((q, idx) => {
    const qHash = getQuestionHash(q.enunciado, q.opciones, q.saltPregunta);
    const ansHash = getCorrectAnswerHash(q.correctOption, q.saltRespuesta, professorAddr);
    return getLeafHash(idx, qHash, ansHash);
  });

  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  return {
    root: root === "0x" ? "0x" + "0".repeat(64) : root,
    getProof: (index) => tree.getHexProof(leaves[index]),
    questions: questions.map((q) => ({
      ...q,
      questionHash: getQuestionHash(q.enunciado, q.opciones, q.saltPregunta),
      correctAnswerHash: getCorrectAnswerHash(q.correctOption, q.saltRespuesta, professorAddr)
    }))
  };
}

// Helper to quickly build placeholder questions for tests that don't need real ones
export function buildPlaceholderQuestions(count) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    qs.push({
      enunciado: `Pregunta ${i}`,
      opciones: ["A", "B", "C", "D"],
      correctOption: 1,
      saltPregunta: PROFE_SALT,
      saltRespuesta: PROFE_SALT,
    });
  }
  return qs;
}
