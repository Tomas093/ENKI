"use client";
import { Search, Wallet, Play } from "lucide-react";
import { useJoinGame } from "../../hooks/useJoinGame";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export function JoinGameTerminal() {
  const {
    addressInput,
    setAddressInput,
    searchedAddress,
    isReading,
    isGameFound,
    professor,
    entryFeeFormatted,
    entryFee,
    hasJoined,
    isConnected,
    isPending,
    handleSearch,
    handleJoin,
  } = useJoinGame();

  return (
    <Card variant="elevated" padding="lg" className="flex flex-col h-full">
      <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
        Join a Game
      </h2>
      <p className="text-slate-600 font-medium mb-8">
        Enter the contract address provided by your teacher.
      </p>

      {/* Address Search Form */}
      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <label htmlFor="address-input" className="text-sm font-bold text-slate-600 ml-1">
          Game Contract Address
        </label>
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              id="address-input"
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-700 font-mono text-sm outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all duration-200 shadow-inner"
            />
          </div>
          <Button type="submit" variant="secondary" size="md" className="shrink-0 font-bold">
            Search
          </Button>
        </div>
      </form>

      {/* Game Info Panel */}
      {searchedAddress && (
        <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-400">
          {isReading ? (
            <div className="flex items-center gap-3 text-slate-500 font-medium py-4">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              Fetching game data...
            </div>
          ) : isGameFound ? (
            <div className="flex flex-col gap-6">
              {/* Game Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    Teacher Address
                  </div>
                  <div className="font-mono text-slate-700 text-sm break-all leading-relaxed">
                    {professor?.slice(0, 10)}...{professor?.slice(-8)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="text-xs font-semibold text-purple-600 mb-2">
                    Required Stake
                  </div>
                  <div className="font-black text-purple-700 text-2xl tracking-tight">
                    {entryFeeFormatted} <span className="text-base font-bold">ETH</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              {hasJoined ? (
                <Button
                  onClick={() => window.location.href = `/join-waiting?game=${searchedAddress}`}
                  fullWidth
                  size="lg"
                  variant="primary"
                  leftIcon={<Play size={20} />}
                >
                  Already Joined - Resume Game
                </Button>
              ) : (
                <Button
                  onClick={handleJoin}
                  loading={isPending}
                  fullWidth
                  size="lg"
                  variant={!isConnected ? "secondary" : "primary"}
                  leftIcon={!isConnected ? <Wallet size={20} /> : <Play size={20} />}
                >
                  {isPending
                    ? "Broadcasting transaction..."
                    : !isConnected
                    ? "Connect Wallet to Join"
                    : `Stake ${entryFeeFormatted} ETH & Enter Game`}
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-red-50 text-red-600 rounded-xl p-4 font-medium border border-red-100 text-center">
              Could not connect to this game. Please verify the address.
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
