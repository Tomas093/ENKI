"use client";
import { useState } from "react";
import { Search, ShieldCheck, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { PlayfulButton } from "../components/ui/PlayfulButton";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useReadContracts, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import KahootGameABI from "../../abi/KahootGame.json";

export default function StakingLobby() {
  const [addressInput, setAddressInput] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<`0x${string}` | undefined>(undefined);
  const router = useRouter();

  const { data, isLoading: isReading } = useReadContracts({
    contracts: searchedAddress ? [
      { address: searchedAddress, abi: KahootGameABI.abi, functionName: 'professor' },
      { address: searchedAddress, abi: KahootGameABI.abi, functionName: 'entryFee' },
    ] : [],
  });

  const { writeContractAsync, isPending } = useWriteContract();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.length === 42 && addressInput.startsWith("0x")) {
      setSearchedAddress(addressInput as `0x${string}`);
    } else {
      toast.error("Please enter a valid 0x... contract address");
    }
  };

  const handleJoin = async () => {
    if (!searchedAddress || !data || data[1]?.result === undefined) return;
    try {
      const hash = await writeContractAsync({
        address: searchedAddress,
        abi: KahootGameABI.abi,
        functionName: 'joinGame',
        value: data[1]?.result as bigint,
        gas: 500000n,
      });
      router.push(`/transaction-mining?hash=${hash}&game=${searchedAddress}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to join. Did you reject the transaction?");
    }
  };

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
          <label className="text-xl font-bold text-slate-700 ml-2">
            Game Contract Address
          </label>
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="0x..."
                className="w-full pl-12 pr-4 py-4 bg-[#F4F6FA] border-4 border-slate-200 rounded-[16px] text-xl font-bold text-slate-700 outline-none focus:border-purple-500 focus:bg-white transition-colors placeholder:text-slate-400"
              />
            </div>
            <PlayfulButton variant="purple" size="lg" className="sm:w-auto w-full">
              Search
            </PlayfulButton>
          </div>
        </form>

        <AnimatePresence>
          {searchedAddress && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              {isReading ? (
                <div className="text-center font-bold text-slate-500">Loading game info...</div>
              ) : data && data[0]?.status === "success" ? (
                <>
                  <div className="bg-purple-50 rounded-[20px] border-4 border-purple-100 p-6 mb-8 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 text-purple-200 transform rotate-12 opacity-50">
                      <ShieldCheck size={120} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold text-slate-600 mb-2 uppercase tracking-wide text-sm">Match Found</h3>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center bg-white p-4 rounded-[12px] border-2 border-purple-100">
                          <span className="font-bold text-slate-500 text-lg">Game Address</span>
                          <span className="font-extrabold text-slate-800 text-xl">{searchedAddress.slice(0,6)}...{searchedAddress.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-4 rounded-[12px] border-2 border-purple-100">
                          <span className="font-bold text-slate-500 text-lg">Host</span>
                          <span className="font-extrabold text-slate-800 text-lg break-all ml-4">
                            {(data[0]?.result as string)?.slice(0, 6)}...{(data[0]?.result as string)?.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-4 rounded-[12px] border-2 border-purple-100">
                          <span className="font-bold text-slate-500 text-lg">Entry Fee</span>
                          <span className="font-extrabold text-purple-600 text-xl">
                            {formatEther((data[1]?.result as bigint) || 0n)} ETH
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <PlayfulButton 
                    variant="success" 
                    size="xl" 
                    className="w-full text-2xl py-6 flex items-center justify-center gap-3"
                    onClick={handleJoin}
                    disabled={isPending}
                  >
                    {isPending ? (
                       <div className="w-8 h-8 rounded-full border-4 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <Wallet className="h-8 w-8" />
                        Stake {formatEther((data[1]?.result as bigint) || 0n)} ETH & Enter Game
                      </>
                    )}
                  </PlayfulButton>
                </>
              ) : (
                <div className="text-center font-bold text-red-500">Game not found. Check address.</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
};
