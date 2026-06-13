import { useState, useCallback } from "react";
import { Search, ShieldCheck, AlertCircle } from "lucide-react";
import { PlayfulButton } from "../ui/PlayfulButton";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useReadContracts, useWriteContract, useAccount, useWaitForTransactionReceipt } from "wagmi";
import { isAddress, formatEther } from "viem";
import { kahootGameAbi } from "../../../lib/contracts";
import { useGame } from "../../../lib/GameContext";

type GameInfo = {
  entryFee: bigint;
  professor: string;
  isFinished: boolean;
  isCancelled: boolean;
  hasJoined: boolean;
};

export const StakingLobby = () => {
  const [rawAddress, setRawAddress] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<`0x${string}` | null>(null);
  const [validationError, setValidationError] = useState("");
  const navigate = useNavigate();
  const { address } = useAccount();
  const { setGameAddress } = useGame();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    if (!isAddress(rawAddress)) {
      setValidationError("Invalid Ethereum address");
      return;
    }
    setSearchedAddress(rawAddress as `0x${string}`);
  };

  // Read game state when user has searched
  const gameBase = searchedAddress
    ? { address: searchedAddress, abi: kahootGameAbi }
    : null;

  const { data, isLoading: isReadLoading, error: readError } = useReadContracts({
    contracts: gameBase
      ? [
          { ...gameBase, functionName: "entryFee" },
          { ...gameBase, functionName: "professor" },
          { ...gameBase, functionName: "isFinished" },
          { ...gameBase, functionName: "isCancelled" },
          { ...gameBase, functionName: "hasJoined", args: [address ?? "0x0000000000000000000000000000000000000000"] },
        ]
      : [],
    query: { enabled: !!searchedAddress },
  });

  const gameInfo: GameInfo | null =
    data && data.every((d) => d.status === "success")
      ? {
          entryFee: data[0].result as bigint,
          professor: data[1].result as string,
          isFinished: data[2].result as boolean,
          isCancelled: data[3].result as boolean,
          hasJoined: data[4].result as boolean,
        }
      : null;

  const readFailed = !!readError || (data && data.some((d) => d.status === "failure"));

  // joinGame write
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleJoin = useCallback(() => {
    if (!searchedAddress || !gameInfo) return;
    setGameAddress(searchedAddress);
    writeContract({
      address: searchedAddress,
      abi: kahootGameAbi,
      functionName: "joinGame",
      value: gameInfo.entryFee,
    });
  }, [searchedAddress, gameInfo, setGameAddress, writeContract]);

  // Navigate after successful join tx
  if (isTxSuccess) {
    navigate("/gameplay");
  }

  const isGameInvalid = gameInfo && (gameInfo.isFinished || gameInfo.isCancelled);
  const alreadyJoined = gameInfo?.hasJoined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full z-10"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4">Join a Game</h1>
        <p className="text-lg text-slate-500 font-medium">Enter the smart contract address to stake and play.</p>
      </div>

      <div className="bg-white w-full rounded-[24px] border-4 border-slate-200 p-6 md:p-8 shadow-xl relative">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <label className="text-xl font-bold text-slate-700 ml-2">Game Contract Address</label>
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <input
                type="text"
                value={rawAddress}
                onChange={(e) => { setRawAddress(e.target.value); setValidationError(""); }}
                placeholder="0x..."
                className="w-full pl-12 pr-4 py-4 bg-[#F4F6FA] border-4 border-slate-200 rounded-[16px] text-xl font-bold text-slate-700 outline-none focus:border-purple-500 focus:bg-white transition-colors placeholder:text-slate-400"
              />
            </div>
            <PlayfulButton variant="purple" size="lg" className="sm:w-auto w-full">
              Search
            </PlayfulButton>
          </div>
          {validationError && (
            <p className="text-red-500 font-semibold text-sm flex items-center gap-1">
              <AlertCircle size={14} /> {validationError}
            </p>
          )}
        </form>

        <AnimatePresence>
          {searchedAddress && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              {isReadLoading ? (
                <div className="flex items-center justify-center py-8 gap-3 text-slate-500 font-bold">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  Loading game data…
                </div>
              ) : readFailed ? (
                <div className="bg-red-50 border-4 border-red-100 rounded-[20px] p-5 text-red-600 font-bold flex items-center gap-2">
                  <AlertCircle size={20} />
                  No game found at this address. Are you connected to the right network?
                </div>
              ) : gameInfo ? (
                <>
                  {isGameInvalid ? (
                    <div className="bg-orange-50 border-4 border-orange-100 rounded-[20px] p-5 text-orange-700 font-bold flex items-center gap-2">
                      <AlertCircle size={20} />
                      {gameInfo.isFinished ? "This game has already ended." : "This game was cancelled."}
                    </div>
                  ) : alreadyJoined ? (
                    <div className="bg-blue-50 border-4 border-blue-100 rounded-[20px] p-5 text-blue-700 font-bold flex items-center gap-2 mb-4">
                      <ShieldCheck size={20} />
                      You already joined this game! Continue to gameplay.
                    </div>
                  ) : null}

                  {!isGameInvalid && (
                    <>
                      <div className="bg-purple-50 rounded-[20px] border-4 border-purple-100 p-6 mb-6 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 text-purple-200 transform rotate-12 opacity-50">
                          <ShieldCheck size={120} />
                        </div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold text-slate-600 mb-2 uppercase tracking-wide text-sm">Game Found</h3>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center bg-white p-4 rounded-[12px] border-2 border-purple-100">
                              <span className="font-bold text-slate-500 text-lg">Professor</span>
                              <span className="font-extrabold text-slate-800 text-sm font-mono">{gameInfo.professor.slice(0, 8)}…{gameInfo.professor.slice(-6)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-4 rounded-[12px] border-2 border-purple-100">
                              <span className="font-bold text-slate-500 text-lg">Entry Fee</span>
                              <span className="font-extrabold text-purple-600 text-xl">{formatEther(gameInfo.entryFee)} ETH</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {writeError && (
                        <p className="text-red-500 font-semibold text-sm mb-3 flex items-center gap-1">
                          <AlertCircle size={14} /> {(writeError as Error).message?.slice(0, 120)}
                        </p>
                      )}

                      {alreadyJoined ? (
                        <PlayfulButton
                          variant="success"
                          size="xl"
                          className="w-full text-2xl py-6 flex items-center justify-center gap-3"
                          onClick={() => { setGameAddress(searchedAddress); navigate("/gameplay"); }}
                        >
                          ▶ Continue to Gameplay
                        </PlayfulButton>
                      ) : (
                        <PlayfulButton
                          variant="success"
                          size="xl"
                          className="w-full text-2xl py-6 flex items-center justify-center gap-3"
                          onClick={handleJoin}
                          disabled={isWritePending || isTxLoading || !address}
                        >
                          {isWritePending || isTxLoading ? (
                            <>
                              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {isWritePending ? "Signing…" : "Confirming on-chain…"}
                            </>
                          ) : (
                            <>💰 Stake {formatEther(gameInfo.entryFee)} ETH &amp; Enter Game</>
                          )}
                        </PlayfulButton>
                      )}

                      {!address && (
                        <p className="text-center text-slate-400 font-semibold text-sm mt-3">
                          Connect MetaMask first to join.
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
