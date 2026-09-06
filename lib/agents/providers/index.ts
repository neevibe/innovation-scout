import type { SearchProvider } from "./types";
import { tavilyProvider } from "./tavily";
import { gdeltProvider } from "./gdelt";
import { googleNewsProvider } from "./googlenews";
import { githubProvider } from "./github";
import { redditProvider } from "./reddit";
import { youtubeProvider } from "./youtube";
import { arxivProvider } from "./arxiv";

export * from "./types";
export { tavilyProvider } from "./tavily";
export { gdeltProvider } from "./gdelt";
export { googleNewsProvider } from "./googlenews";
export { githubProvider } from "./github";
export { redditProvider } from "./reddit";
export { youtubeProvider } from "./youtube";
export { arxivProvider } from "./arxiv";

const REGISTRY: Record<string, SearchProvider> = {
  tavily: tavilyProvider,
  gdelt: gdeltProvider,
  googlenews: googleNewsProvider,
  github: githubProvider,
  reddit: redditProvider,
  youtube: youtubeProvider,
  arxiv: arxivProvider,
};

/**
 * Select the active provider:
 *   1. explicit SCOUT_SEARCH_PROVIDER, else
 *   2. tavily if TAVILY_API_KEY is present, else
 *   3. googlenews (keyless dev default).
 * The order also defines the automatic fallback chain if the primary errors.
 */
export function selectProvider(): SearchProvider {
  const explicit = process.env.SCOUT_SEARCH_PROVIDER?.toLowerCase();
  if (explicit && REGISTRY[explicit]) return REGISTRY[explicit];
  if (process.env.TAVILY_API_KEY) return tavilyProvider;
  return googleNewsProvider;
}

export function fallbackChain(): SearchProvider[] {
  const primary = selectProvider();
  const rest = [tavilyProvider, gdeltProvider, googleNewsProvider].filter(
    (p) => p.id !== primary.id && (p.keyless || !!process.env.TAVILY_API_KEY)
  );
  return [primary, ...rest];
}
