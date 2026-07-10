"use client";
import { useLeaderboardClaims } from "../../hooks/useLeaderboardClaims";
import { LeaderboardUI } from "./components/LeaderboardUI";

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
    isConfirmingTx,
    isRefetching,
    refetchStats,
    handleClaim,
    handleClaimDiploma,
    address,
  } = useLeaderboardClaims();

  return (
    <LeaderboardUI
      loading={loading}
      prizesCalculated={prizesCalculated}
      rank1Players={rank1Players}
      rank2Players={rank2Players}
      rank3Players={rank3Players}
      prizes={prizes}
      myData={myData}
      myRank={myRank}
      myPrize={myPrize}
      myPrizeFormatted={myPrizeFormatted}
      PASS_THRESHOLD={PASS_THRESHOLD}
      isPending={isPending}
      isConfirmingTx={isConfirmingTx}
      isRefetching={isRefetching}
      refetchStats={refetchStats}
      handleClaim={handleClaim}
      handleClaimDiploma={handleClaimDiploma}
      address={address}
    />
  );
}
