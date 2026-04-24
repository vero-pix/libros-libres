type SellerPlan = "free" | "librero" | "libreria";
type TransactionType = "sale" | "rental";

const RATES: Record<SellerPlan, Record<TransactionType, number>> = {
  free:     { sale: 0.08, rental: 0.10 },
  librero:  { sale: 0.05, rental: 0.07 },
  libreria: { sale: 0.03, rental: 0.05 },
};

export function getCommissionRate(plan: SellerPlan, type: TransactionType): number {
  return RATES[plan]?.[type] ?? RATES.free[type];
}

export function calculateCommission(
  amount: number,
  plan: SellerPlan,
  type: TransactionType
): { rate: number; commission: number } {
  const rate = getCommissionRate(plan, type);
  const commission = Math.round(amount * rate);
  return { rate, commission };
}
