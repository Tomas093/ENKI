import { useState, useEffect } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import KahootGameABI from "../abi/KahootGame.json";

export type Player = { wallet: string, score: number, claimed: boolean, diplomaClaimed: boolean };

export function useFinalLeaderboard(gameAddress: string | null, txHash: string | null = null) {
  const wagmiClient = usePublicClient();
  const [loading, setLoading] = useState(true);
  const [isConfirmingTx, setIsConfirmingTx] = useState(!!txHash);
  const [isRefetching, setIsRefetching] = useState(false);
  const [txConfirmed, setTxConfirmed] = useState(false);
  
  const [participants, setParticipants] = useState<Player[]>([]);
  const [prizes, setPrizes] = useState<bigint[]>([0n, 0n, 0n]);

  const { data: prizesCalculated, refetch: refetchPrizesCalculated } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'prizesCalculated',
    query: {
      enabled: !!gameAddress
    }
  });

  const { data: passingScoreData } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'passingScore',
    query: {
      enabled: !!gameAddress
    }
  });

  const PASS_THRESHOLD = Number(passingScoreData) || 1;

  useEffect(() => {
    if (!gameAddress || !wagmiClient) return;

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const init = async () => {
      if (txHash && !txConfirmed) {
        if (isMounted) setIsConfirmingTx(true);
        try {
          await wagmiClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
        } catch (e) {
          console.error("Failed waiting for tx receipt", e);
        }
        if (isMounted) {
          setTxConfirmed(true);
          setIsConfirmingTx(false);
        }
      }

      if (!isMounted) return;

      if (!prizesCalculated) {
        intervalId = setInterval(() => {
          if (isMounted) refetchPrizesCalculated();
        }, 3000);
      } else {
        fetchStats();
      }
    };

    init();

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameAddress, prizesCalculated, wagmiClient, txHash, txConfirmed]);

  const fetchStats = async () => {
    try {
      if (!gameAddress) return;

      const res = await fetch(`/api/game/${gameAddress}/leaderboard`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");

      const data = await res.json();

      setPrizes([
        BigInt(data.prizes[0]),
        BigInt(data.prizes[1]),
        BigInt(data.prizes[2])
      ]);

      setParticipants(data.players);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const refetchStats = async () => {
    setIsRefetching(true);
    await fetchStats();
    setIsRefetching(false);
  };

  const markPrizeClaimed = (address: string) => {
    setParticipants(prev => prev.map(p => p.wallet.toLowerCase() === address.toLowerCase() ? { ...p, claimed: true } : p));
  };

  const markDiplomaClaimed = (address: string) => {
    setParticipants(prev => prev.map(p => p.wallet.toLowerCase() === address.toLowerCase() ? { ...p, diplomaClaimed: true } : p));
  };

  return {
    loading,
    isConfirmingTx,
    isRefetching,
    participants,
    prizes,
    prizesCalculated: Boolean(prizesCalculated),
    PASS_THRESHOLD,
    markPrizeClaimed,
    markDiplomaClaimed,
    refetchStats
  };
}
