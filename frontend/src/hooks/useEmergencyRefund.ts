import { useState } from "react";
import { useRouter } from "next/navigation";

export function useEmergencyRefund() {
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);

  const handleClaim = () => {
    if (signing || done) return;
    setSigning(true);
    // TODO: implement actual contract call for refunding
    setTimeout(() => {
      setSigning(false);
      setDone(true);
    }, 3000);
  };

  return {
    signing,
    done,
    handleClaim,
    router
  };
}
