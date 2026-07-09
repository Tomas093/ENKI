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
      if (!wagmiClient || !gameAddress) return;
      const currentBlock = await wagmiClient.getBlockNumber();
      const fromBlock = currentBlock > 9000n ? currentBlock - 9000n : 0n;

      const logs = await wagmiClient.getContractEvents({
        address: gameAddress as `0x${string}`,
        abi: KahootGameABI.abi,
        eventName: 'PlayerJoined',
        fromBlock: fromBlock,
        toBlock: 'latest'
      });
      const wallets = Array.from(new Set(logs.map(l => (l as any).args?.player as `0x${string}`)));

      if (!wagmiClient) return;
      
      const scores = await Promise.all(wallets.map(w => wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'scores', args: [w] })));
      const claims = await Promise.all(wallets.map(w => wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'hasPrizeClaimed', args: [w] })));
      const diplomaClaims = await Promise.all(wallets.map(w => wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'hasClaimed', args: [w] })));

      const p0 = await wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [0] }).catch(() => 0n);
      const p1 = await wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [1] }).catch(() => 0n);
      const p2 = await wagmiClient.readContract({ address: gameAddress as `0x${string}`, abi: KahootGameABI.abi, functionName: 'prizePerPlayerAtRank', args: [2] }).catch(() => 0n);

      setPrizes([p0 as bigint, p1 as bigint, p2 as bigint]);

      const p = wallets.map((w, i) => ({
        wallet: w,
        score: Number(scores[i]),
        claimed: Boolean(claims[i]),
        diplomaClaimed: Boolean(diplomaClaims[i])
      })).sort((a, b) => b.score - a.score);

      setParticipants(p);
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
