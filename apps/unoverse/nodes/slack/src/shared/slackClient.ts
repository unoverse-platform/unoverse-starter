export interface SlackCredentials {
  token: string;
  host?: string;
}

export interface SlackRequestOptions {
  method?: "GET" | "POST";
  params?: Record<string, string | string[] | boolean | number | undefined>;
  body?: Record<string, any>;
}

export async function slackApi(
  credentials: SlackCredentials,
  apiMethod: string,
  options: SlackRequestOptions = {},
): Promise<any> {
  const host = credentials.host
    ? credentials.host.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    : "slack.com";

  const url = `https://${host}/api/${apiMethod}`;
  const httpMethod = options.method ?? "POST";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credentials.token}`,
    "Content-Type": "application/json; charset=utf-8",
  };

  const fetchOptions: RequestInit = {
    method: httpMethod,
    headers,
  };

  if (httpMethod === "POST" && options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  } else if (httpMethod === "GET" && options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(","));
      } else {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      const separator = url.includes("?") ? "&" : "?";
      (fetchOptions as any).__url = `${url}${separator}${qs}`;
    }
  }

  const finalUrl = (fetchOptions as any).__url ?? url;
  delete (fetchOptions as any).__url;

  const response = await fetch(finalUrl, fetchOptions);
  const data: any = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error ?? JSON.stringify(data)}`);
  }

  return data;
}
