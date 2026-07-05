import { searchApi } from "../../shared/searchApiClient";

export interface SearchNewsConfig {
  query: string;
  numResults: number;
  country: string;
  language: string;
}

export interface NewsResult {
  title: string;
  url: string;
  source: string;
  date: string;
  snippet: string;
  thumbnail: string;
}

export interface SearchNewsResult {
  newsResults: NewsResult[];
}

/**
 * Recent news articles via the Google News engine.
 */
export async function searchNews(
  config: SearchNewsConfig,
  api: any,
  credentialContext: any
): Promise<SearchNewsResult> {
  const data = await searchApi(api, credentialContext, "google_news", {
    q: config.query,
    num: config.numResults,
    gl: config.country,
    hl: config.language,
  });

  const newsResults: NewsResult[] = (data.organic_results || []).map((r: any) => ({
    title: r.title || "",
    url: r.link || "",
    // `source` may be a string or an object ({ name, icon }) depending on the result.
    source: typeof r.source === "string" ? r.source : r.source?.name || "",
    date: r.date || "",
    snippet: r.snippet || "",
    thumbnail: r.thumbnail || "",
  }));

  return { newsResults };
}
