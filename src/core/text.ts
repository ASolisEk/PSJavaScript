/** Utilidades de texto compartidas (sugerencias "¿quisiste decir…?"). */

/** Distancia de edición entre dos textos. */
export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Nombre más parecido (tolerando ~1 error cada 3 letras), o null. */
export function closest(name: string, candidates: Iterable<string>): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = levenshtein(c.toLowerCase(), name.toLowerCase());
    if (d < bestD && d <= Math.max(1, Math.floor(name.length / 3))) {
      best = c;
      bestD = d;
    }
  }
  return best;
}
