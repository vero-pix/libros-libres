"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/utils/analytics";

interface Props {
  orderId: string;
  total: number;
  itemCount: number;
}

export default function PurchaseTracker({ orderId, total, itemCount }: Props) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("purchase", {
      transaction_id: orderId,
      currency: "CLP",
      value: total,
      items: itemCount,
    });
  }, [orderId, total, itemCount]);
  return null;
}
