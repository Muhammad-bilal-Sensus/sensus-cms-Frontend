export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 3 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
