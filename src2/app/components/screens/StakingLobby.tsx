import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { PlayfulButton } from "../ui/PlayfulButton";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

export const StakingLobby = () => {
  const [address, setAddress] = useState("");
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.length > 5) {
      setSearched(true);
    }
  };

  const handleJoin = () => {
    navigate("/gameplay");
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
          {searched && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 32 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-purple-50 rounded-[20px] border-4 border-purple-100 p-6 mb-8 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-purple-200 transform rotate-12 opacity-50">
                  <ShieldCheck size={120} />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-600 mb-2 uppercase tracking-wide text-sm">Match Found</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center bg-white p-4 rounded-[12px] border-2 border-purple-100">
                      <span className="font-bold text-slate-500 text-lg">Host</span>
                      <span className="font-extrabold text-slate-800 text-xl">Prof. Monteiro</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-4 rounded-[12px] border-2 border-purple-100">
                      <span className="font-bold text-slate-500 text-lg">Entry Fee</span>
                      <span className="font-extrabold text-purple-600 text-xl">0.050 ETH</span>
                    </div>
                  </div>
                </div>
              </div>

              <PlayfulButton 
                variant="success" 
                size="xl" 
                className="w-full text-2xl py-6 flex items-center justify-center gap-3"
                onClick={handleJoin}
              >
                <Wallet className="h-8 w-8" />
                Stake 0.050 ETH & Enter Game
              </PlayfulButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
};
