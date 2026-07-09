"use client";
import { Wallet, Award, Gift, Frown, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useLeaderboardClaims } from "../../hooks/useLeaderboardClaims";
import { LeaderboardPodium } from "./components/LeaderboardPodium";
import { Button } from "../../components/ui/Button";
import { PageBlobs } from "../../components/ui/PageBlobs";

export default function FinalLeaderboard() {
  const {
    loading,
    prizesCalculated,
    rank1Players,
    rank2Players,
    rank3Players,
    prizes,
    myData,
    myRank,
    myPrize,
    myPrizeFormatted,
    PASS_THRESHOLD,
    isPending,
    handleClaim,
    handleClaimDiploma,
    address,
  } = useLeaderboardClaims();

  // Loading state
  if (!prizesCalculated || loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <Loader2 className="animate-spin text-purple-500" size={44} strokeWidth={2} />
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Calculating Results...
        </h2>
        <p className="text-slate-500 font-medium text-lg">
          Waiting for the host to finalize the session.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col lg:flex-row gap-10 xl:gap-16 w-full max-w-7xl mx-auto items-start pt-10 pb-20 px-4 md:px-8 relative"
    >
      <PageBlobs primary="amber" secondary="indigo" />

      {/* Left: Podium */}
      <div className="flex-1 w-full flex flex-col relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-12 tracking-tight">
          Final Results
        </h1>
        <LeaderboardPodium
          rank1Players={rank1Players}
          rank2Players={rank2Players}
          rank3Players={rank3Players}
          prizes={prizes}
          currentAddress={address}
        />
      </div>

      {/* Right: Claim Card */}
      <div className="w-full lg:w-[380px] shrink-0 relative z-10 lg:mt-20">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col items-center text-center gap-5">

          {/* Winner or Not */}
          {myRank !== -1 && myPrize > 0n ? (
            <>
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center border border-amber-100">
                <Gift size={30} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">You're a Winner!</h2>
                <div className="text-5xl font-black text-purple-700 tracking-tight">
                  {myPrizeFormatted} ETH
                </div>
              </div>
              {!myData?.claimed ? (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isPending}
                  onClick={handleClaim}
                  leftIcon={<Wallet size={20} />}
                >
                  {isPending ? "Claiming..." : "Claim Prize"}
                </Button>
              ) : (
                <div className="w-full bg-emerald-50 text-emerald-600 rounded-xl py-4 font-extrabold border border-emerald-100 flex items-center justify-center gap-2">
                  Prize Claimed! <Wallet size={18} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center border border-slate-100">
                <Frown size={30} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Good effort!</h2>
                <p className="text-slate-500 font-medium leading-relaxed">
                  You didn't make the top 3. Keep learning and try again!
                </p>
              </div>
            </>
          )}

          {/* Diploma Section */}
          {myData && myData.score >= PASS_THRESHOLD ? (
            !myData.diplomaClaimed ? (
              <Button
                variant="secondary"
                size="md"
                fullWidth
                loading={isPending}
                onClick={handleClaimDiploma}
                leftIcon={<Award size={18} />}
              >
                Claim NFT Diploma
              </Button>
            ) : (
              <div className="w-full bg-blue-50 text-blue-600 rounded-xl py-3.5 font-bold border border-blue-100 flex items-center justify-center gap-2 text-sm">
                Diploma Claimed! <Award size={16} />
              </div>
            )
          ) : myData && myData.score < PASS_THRESHOLD ? (
            <p className="text-slate-400 text-sm font-medium">
              Did not meet the passing score threshold for a diploma.
            </p>
          ) : null}

        </div>
      </div>
    </motion.div>
  );
}
