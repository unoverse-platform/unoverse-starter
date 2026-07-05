import { searchApi } from "../../shared/searchApiClient";

export interface SearchWebConfig {
  query: string;
  numResults: number;
  numImages: number;
  searchImages: boolean;
  safeSearch: string;
  country: string;
  language: string;
}

export interface WebResult {
  title: string;
  url: string;
  source: string;
  snippet: string;
}

export interface ImageResult {
  url: string;
  title: string;
  thumbnail: string;
  source_url: string;
  source_name: string;
}

export interface SearchWebResult {
  webResults: WebResult[];
  imageResults: ImageResult[];
}

/**
 * Google web search, plus an optional dedicated Google Images pass.
 */
export async function searchWeb(
  config: SearchWebConfig,
  api: any,
  credentialContext: any
): Promise<SearchWebResult> {
  // SearchAPI's google/google_images `safe` param accepts ONLY "active" or "off".
  // The node historically also offered "moderate" (now removed from the schema),
  // which SearchAPI rejects with HTTP 400 "Unsupported value `moderate`". Coerce
  // any non-"off" value to "active" so workflows already saved with "moderate"
  // (or any other value) keep working instead of failing every search.
  const safe = config.safeSearch === "off" ? "off" : "active";

  const web = await searchApi(api, credentialContext, "google", {
    q: config.query,
    num: config.numResults,
    gl: config.country,
    hl: config.language,
    safe,
  });

  const webResults: WebResult[] = (web.organic_results || []).map((r: any) => ({
    title: r.title || "",
    url: r.link || "",
    source: r.source || "",
    snippet: r.snippet || "",
  }));

  let imageResults: ImageResult[] = [];

  if (config.searchImages && config.numImages > 0) {
    const img = await searchApi(api, credentialContext, "google_images", {
      q: config.query,
      num: config.numImages,
      safe,
      size: "large",
    });

    imageResults = (img.images || []).slice(0, config.numImages).map((i: any) => ({
      url: i.original?.link || i.link || "",
      title: i.title || "",
      thumbnail: i.thumbnail || "",
      source_url: i.source?.link || "",
      source_name: i.source?.name || "",
    }));
  }

  return { webResults, imageResults };
}
