"use client";
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useConnect } from "wagmi";
import { motion, AnimatePresence } from "motion/react";
import { User, CheckCircle2, Loader2, Wallet, Copy, Check, Pencil, ArrowRight } from "lucide-react";
import { PROFILES_ADDRESS, enkiProfilesAbi } from "../../lib/contracts";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();

  const { data: currentNickname, refetch: refetchNickname } = useReadContract({
    address: PROFILES_ADDRESS,
    abi: enkiProfilesAbi,
    functionName: "nicknames",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const nickname = currentNickname as string | undefined;

  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (nickname !== undefined) {
      setInput(nickname || "");
      setIsEditing(nickname === "");
    }
  }, [nickname]);

  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Nickname saved on-chain!");
      setIsEditing(false);
      refetchNickname();
    }
  }, [isSuccess, refetchNickname]);

  const isBusy = isWriting || isConfirming;

  const validateInput = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.length === 0) return "Nickname can't be empty.";
    if (new TextEncoder().encode(trimmed).length > 30) return "Too long (max 30 bytes).";
    return null;
  };

  const handleSave = async () => {
    const err = validateInput(input);
    if (err) { toast.error(err); return; }
    if (input.trim() === nickname) { setIsEditing(false); return; }

    try {
      const hash = await writeContractAsync({
        address: PROFILES_ADDRESS,
        abi: enkiProfilesAbi,
        functionName: "setNickname",
        args: [input.trim()],
      });
      setTxHash(hash);
    } catch (e: any) {
      toast.error(e?.shortMessage || "Transaction rejected.");
    }
  };

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputError = input !== nickname ? validateInput(input) : null;

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg flex flex-col gap-6"
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-5">
          <div
            className="inline-flex items-center gap-2 bg-neo-accent border-2 border-black px-3 py-1 mb-4"
            style={{ boxShadow: "2px 2px 0px #000" }}
          >
            <User size={12} strokeWidth={3} />
            <span className="font-black text-[11px] uppercase tracking-[0.1em]">[ My Profile ]</span>
          </div>
          <h1 className="font-black text-[40px] uppercase tracking-tight leading-[0.9] text-black">
            Your<br />Identity.
          </h1>
          <p className="text-gray-500 font-medium text-[14px] mt-3 leading-relaxed">
            Your nickname is stored globally on-chain. Set it once and it will appear in every game you join.
          </p>
        </div>

        {!isConnected ? (
          /* ─── Not Connected ──────────────────────────────────────────── */
          <div className="flex flex-col gap-4 bg-white border-2 border-black p-8 shadow-[4px_4px_0px_#000] items-center text-center">
            <div className="w-16 h-16 bg-[#F4F4F0] border-2 border-black flex items-center justify-center">
              <Wallet size={28} strokeWidth={2} className="text-gray-400" />
            </div>
            <div>
              <h2 className="font-black text-[18px] uppercase tracking-tight text-black">Connect your wallet</h2>
              <p className="text-gray-500 font-medium text-[13px] mt-1">
                You need to connect a wallet to manage your profile.
              </p>
            </div>
            <button
              onClick={() => connectors.length > 0 && connect({ connector: connectors[0] })}
              className="h-12 px-8 bg-black text-white border-2 border-black font-black uppercase text-[12px] tracking-widest shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:bg-gray-800 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
            >
              <Wallet size={16} />
              Connect Wallet
            </button>
          </div>
        ) : (
          /* ─── Connected ─────────────────────────────────────────────── */
          <>
            {/* Wallet Card */}
            <div className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between gap-3">
              <div>
                <span className="font-black text-[10px] uppercase tracking-widest text-gray-400">Wallet Address</span>
                <p className="font-mono font-bold text-[15px] text-black mt-0.5 break-all">{address}</p>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 w-10 h-10 border-2 border-black bg-[#F4F4F0] hover:bg-neo-accent flex items-center justify-center transition-colors shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                title="Copy address"
              >
                {copied ? <Check size={15} strokeWidth={3} className="text-black" /> : <Copy size={15} strokeWidth={2.5} className="text-black" />}
              </button>
            </div>

            {/* Nickname Card */}
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
              {/* Card Header */}
              <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
                <span className="font-black text-[11px] uppercase tracking-widest">Global Nickname</span>
                {nickname && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-neo-accent hover:text-white transition-colors font-bold text-[11px] uppercase tracking-widest"
                  >
                    <Pencil size={12} strokeWidth={3} />
                    Edit
                  </button>
                )}
              </div>

              <div className="p-6 flex flex-col gap-5">
                <AnimatePresence mode="wait">
                  {/* Display Mode */}
                  {nickname && !isEditing ? (
                    <motion.div
                      key="display"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-14 h-14 border-2 border-black bg-neo-accent flex items-center justify-center shrink-0"
                        style={{ boxShadow: "3px 3px 0px #000" }}
                      >
                        <span className="font-black text-[28px] uppercase">{nickname.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-black text-[28px] text-black leading-none">{nickname}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle2 size={12} className="text-neo-accent" strokeWidth={3} />
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Registered on-chain</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* Edit Mode */
                    <motion.div
                      key="edit"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-4"
                    >
                      {!nickname && (
                        <p className="text-[13px] font-medium text-gray-500 leading-relaxed">
                          You don't have a global nickname yet. Pick one — it will show up in the final leaderboard of every game you play.
                        </p>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <label className="font-black text-[11px] uppercase tracking-widest text-gray-500">
                          // Your Nickname
                        </label>
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                          maxLength={30}
                          placeholder="e.g. 0xBrainBlast"
                          autoFocus
                          className="h-14 px-4 border-2 border-black bg-[#F4F4F0] font-bold text-[16px] text-black placeholder:text-gray-400 outline-none focus:border-neo-accent focus:bg-white transition-colors shadow-[2px_2px_0px_#000]"
                        />
                        {inputError && (
                          <span className="text-[11px] font-bold text-red-500 uppercase tracking-wide">{inputError}</span>
                        )}
                        <span className="text-[10px] font-bold text-gray-400 text-right">
                          {new TextEncoder().encode(input.trim()).length} / 30 bytes
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSave}
                          disabled={isBusy || !!inputError || input.trim() === ""}
                          className="flex-1 h-12 border-2 border-black font-black uppercase text-[13px] tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-neo-accent text-black shadow-[4px_4px_0px_#000] hover:shadow-[2px_2px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                          {isBusy ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              {isConfirming ? "Confirming..." : "Signing..."}
                            </>
                          ) : (
                            <>
                              Save on-chain <ArrowRight size={14} strokeWidth={3} />
                            </>
                          )}
                        </button>
                        {nickname && (
                          <button
                            onClick={() => { setInput(nickname); setIsEditing(false); }}
                            disabled={isBusy}
                            className="h-12 px-5 border-2 border-black font-black uppercase text-[12px] tracking-widest text-black bg-white hover:bg-[#F4F4F0] transition-colors shadow-[2px_2px_0px_#000]"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {/* Gas cost note */}
                      <p className="text-[10px] font-medium text-gray-400 leading-relaxed border-t-2 border-dashed border-gray-200 pt-3">
                        ⛽ This writes to the Sepolia blockchain — you'll need to sign one transaction. On testnet, gas is free. You only need to do this once (or whenever you want to change your name).
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
