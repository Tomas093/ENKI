import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWaitForTransactionReceipt } from "wagmi";

export function useTransactionMining() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hash = searchParams.get("hash");
  const game = searchParams.get("game");

  const { isSuccess, isLoading, isError } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });

  useEffect(() => {
    if (isSuccess && game) {
      router.push(`/join-waiting?game=${game}`);
    }
  }, [isSuccess, router, game]);

  return {
    isSuccess,
    isLoading,
    isError
  };
}
