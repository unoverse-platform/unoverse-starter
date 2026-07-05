export interface XSearchConfig {
  query: string;
  maxResults: number;
  tweetFields: string;
}

export interface XTweet {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    impression_count: number;
  };
}

export interface XSearchResult {
  tweets: XTweet[];
  resultCount: number;
  raw: string;
}

export async function xSearchService(
  config: XSearchConfig,
  bearerToken: string
): Promise<XSearchResult> {
  const params = new URLSearchParams({
    query: config.query,
    max_results: String(Math.min(Math.max(config.maxResults ?? 10, 1), 100)),
    "tweet.fields": config.tweetFields || "created_at,public_metrics,author_id",
  });

  const res = await fetch(
    `https://api.x.com/2/tweets/search/recent?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const tweets: XTweet[] = json.data ?? [];

  return {
    tweets,
    resultCount: tweets.length,
    raw: JSON.stringify(json),
  };
}
