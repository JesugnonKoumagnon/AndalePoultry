export function formatFCFA(n) {
  if (!n && n !== 0) return "0 FCFA";
  const abs = Math.abs(n);
  let str;
  if (abs >= 1_000_000) str = `${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M FCFA`;
  else if (abs >= 1_000) str = `${new Intl.NumberFormat("fr-FR").format(Math.round(abs))} FCFA`;
  else str = `${new Intl.NumberFormat("fr-FR").format(abs)} FCFA`;
  return n < 0 ? `−${str}` : str;
}