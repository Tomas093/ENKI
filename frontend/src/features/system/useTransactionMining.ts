import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWaitForTransactionReceipt } from "wagmi";

export function useTransactionMining() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hash = searchParams.get("hash");
  const game = searchParams.get("game");

  const nick = searchParams.get("nick");

  const { isSuccess, isLoading, isError } = useWaitForTransactionReceipt({
    hash: hash as `0x${string}`,
  });

  useEffect(() => {
    if (isSuccess && game) {
      const nickParam = nick ? `&nick=${encodeURIComponent(nick)}` : "";
      router.push(`/join-waiting?game=${game}${nickParam}`);
    }
  }, [isSuccess, router, game, nick]);

  return {
    isSuccess,
    isLoading,
    isError
  };
}
