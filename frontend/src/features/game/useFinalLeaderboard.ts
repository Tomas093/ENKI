import { useState, useEffect } from "react";
import { useReadContract, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import KahootGameABI from '@/core/blockchain/abi/KahootGame.json';

export type Player = { 
  wallet: string; 
  score: number; 
  claimed: boolean; 
  diplomaClaimed: boolean; 
  nickname?: string; 
};

export function useFinalLeaderboard(gameAddress: string | null, txHash: string | null = null) {
  const wagmiClient = usePublicClient();
  const [loading, setLoading] = useState(true);
  const [isConfirmingTx, setIsConfirmingTx] = useState(!!txHash);
  const [isRefetching, setIsRefetching] = useState(false);
  const [txConfirmed, setTxConfirmed] = useState(false);
  
  const [participants, setParticipants] = useState<Player[]>([]);
  const [prizes, setPrizes] = useState<bigint[]>([0n, 0n, 0n]);

  const { data: prizesCalculated } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'prizesCalculated',
    chainId: sepolia.id,
    query: {
      enabled: !!gameAddress,
      refetchInterval: 3000
    }
  });

  const { data: isFinishedData } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'isFinished',
    chainId: sepolia.id,
    query: { 
      enabled: !!gameAddress,
      refetchInterval: 3000
    }
  });

  const { data: prizePoolData } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'prizePool',
    chainId: sepolia.id,
    query: { 
      enabled: !!gameAddress,
      refetchInterval: 3000
    }
  });

  const { data: passingScoreData } = useReadContract({
    address: gameAddress as `0x${string}`,
    abi: KahootGameABI.abi,
    functionName: 'passingScore',
    chainId: sepolia.id,
    query: {
      enabled: !!gameAddress
    }
  });

  const PASS_THRESHOLD = Number(passingScoreData) || 1;
  
  const isFinished = Boolean(isFinishedData);
  const prizePool = prizePoolData as bigint | undefined;
  
  // Si el juego terminó y no hay pozo, consideramos que los premios ya se "calcularon"
  const effectivelyPrizesCalculated = Boolean(prizesCalculated) || (isFinished && prizePool === 0n);

  useEffect(() => {
    if (!gameAddress || !wagmiClient) return;

    let isMounted = true;

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

      if (effectivelyPrizesCalculated) {
        fetchStats();
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [gameAddress, effectivelyPrizesCalculated, wagmiClient, txHash, txConfirmed]);

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
    prizesCalculated: effectivelyPrizesCalculated,
    PASS_THRESHOLD,
    markPrizeClaimed,
    markDiplomaClaimed,
    refetchStats
  };
}
