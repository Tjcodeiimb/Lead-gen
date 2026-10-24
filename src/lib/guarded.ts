/**
 * Runs page queries with a time limit so a page always renders. A failed or slow query comes
 * back as { error } and the page shows it, instead of hanging on a skeleton.
 */
export type Guarded<T> = { ok: true; value: T; ms: number } | { ok: false; error: string; ms: number };

export async function guarded<T>(label: string, fn: () => Promise<T>, timeoutMs = 8000): Promise<Guarded<T>> {
  const t = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    const value = await Promise.race<T>([
      fn(),
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs / 1000}s`)), timeoutMs); }),
    ]);
    return { ok: true, value, ms: Date.now() - t };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error(`[page] ${label}: ${error}`);
    return { ok: false, error: `${label}: ${error}`, ms: Date.now() - t };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const val = <T,>(g: Guarded<T>, fallback: T): T => (g.ok ? g.value : fallback);
