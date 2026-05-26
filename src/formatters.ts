export function euro(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

export function deltaLabel(value: number) {
  if (value === 0) return "Quadrato";
  return value > 0
    ? `Eccedenza ${euro(value)}`
    : `Ammanco ${euro(Math.abs(value))}`;
}
