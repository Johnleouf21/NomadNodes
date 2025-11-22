export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatCurrency(amount: string, currency: "USDC" | "EURC"): string {
  const symbol = currency === "USDC" ? "$" : "€";
  const numAmount = parseFloat(amount);
  return `${symbol}${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
