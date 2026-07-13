import { keccak256, encodePacked } from "viem";

export interface PlayerCommit {
  option: number;
  salt: string;
}

export interface RevealBatch {
  questionIds: bigint[];
  options: number[];
  salts: string[];
}

/**
 * Computes the cryptographic commit hash matching the KahootGame.sol implementation:
 * keccak256(abi.encodePacked(_option, _salt, msg.sender))
 */
export function computeCommitHash(
  option: number,
  salt: string,
  playerAddress: `0x${string}`
): `0x${string}` {
  return keccak256(
    encodePacked(
      ['uint8', 'string', 'address'],
      [option, salt, playerAddress]
    )
  );
}

/**
 * Parses a dictionary of pending commits and builds the arrays required
 * by the batchRevealAnswers smart contract function.
 * Filters out invalid commits and timeouts (option === -1).
 */
export function buildRevealBatch(
  commitsObj: Record<string, PlayerCommit>
): RevealBatch {
  const qIds: bigint[] = [];
  const options: number[] = [];
  const salts: string[] = [];

  Object.keys(commitsObj).forEach((qIdStr) => {
    const qId = Number(qIdStr);
    const info = commitsObj[qIdStr];
    
    // Ignore invalid commits and explicitly logged timeouts (-1)
    if (info && info.option !== -1 && info.option !== undefined && info.salt) {
      qIds.push(BigInt(qId));
      options.push(info.option);
      salts.push(info.salt);
    }
  });

  return { questionIds: qIds, options, salts };
}
