import { searchApi } from "../../shared/searchApiClient";

export interface SearchVideosConfig {
  query: string;
  numResults: number;
  country: string;
  language: string;
}

export interface VideoResult {
  title: string;
  url: string;
  channel: string;
  channelUrl: string;
  views: number | null;
  length: string;
  publishedTime: string;
  description: string;
  thumbnail: string;
}

export interface SearchVideosResult {
  videoResults: VideoResult[];
}

/**
 * YouTube video search via the youtube engine.
 */
export async function searchVideos(
  config: SearchVideosConfig,
  api: any,
  credentialContext: any
): Promise<SearchVideosResult> {
  const data = await searchApi(api, credentialContext, "youtube", {
    q: config.query,
    gl: config.country,
    hl: config.language,
  });

  const videoResults: VideoResult[] = (data.videos || [])
    .slice(0, config.numResults)
    .map((v: any) => ({
      title: v.title || "",
      url: v.link || "",
      channel: v.channel?.title || "",
      channelUrl: v.channel?.link || "",
      views: typeof v.extracted_views === "number" ? v.extracted_views : v.views ?? null,
      length: v.length || "",
      publishedTime: v.published_time || "",
      description: v.description || "",
      thumbnail: v.thumbnail?.static || v.thumbnail?.rich || "",
    }));

  return { videoResults };
}
