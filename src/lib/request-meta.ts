declare global {
  var __upforgeRequests: number | undefined;
}

/** Counts requests on this server instance; the first one is a cold start. Called from the app layout. */
export function requestMeta() {
  globalThis.__upforgeRequests = (globalThis.__upforgeRequests ?? 0) + 1;
  return { coldStart: globalThis.__upforgeRequests === 1, serverStartedAt: Date.now() };
}
