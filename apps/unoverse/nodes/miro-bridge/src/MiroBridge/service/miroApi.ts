import type { BoardItem, BoardConnector, BoardTag, BoardState, AppCardField } from "../util/types";

const BASE = "https://api.miro.com/v2";

async function req(method: string, path: string, accessToken: string, body?: any): Promise<any> {
  console.log(`[MiroAPI] ${method} ${path} token=${accessToken?.slice(0,20)}...${accessToken?.slice(-10)} len=${accessToken?.length}`);
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Miro API ${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---- Board state ----

export async function apiBoardState(accessToken: string, boardId: string): Promise<Omit<BoardState, "version" | "updatedAt">> {
  const items: BoardItem[] = [];
  const connectors: BoardConnector[] = [];
  const tags: BoardTag[] = [];

  // Paginate all items
  let cursor: string | undefined;
  do {
    const url = `/boards/${boardId}/items?limit=50${cursor ? `&cursor=${cursor}` : ""}`;
    const page = await req("GET", url, accessToken);
    for (const i of page.data ?? []) {
      if (i.type === "connector") {
        connectors.push({
          id: i.id,
          startItemId: i.startItem?.id,
          endItemId: i.endItem?.id,
          caption: i.captions?.[0]?.content,
        });
      } else if (i.type === "tag") {
        tags.push({ id: i.id, title: i.title, color: i.fillColor, itemIds: [] });
      } else {
        items.push(normalise(i));
      }
    }
    cursor = page.cursor;
  } while (cursor);

  return { items, connectors, tags };
}

function normalise(i: any): BoardItem {
  return {
    id: i.id,
    type: i.type,
    content: i.data?.content ?? i.data?.title ?? "",
    x: i.position?.x,
    y: i.position?.y,
    width: i.geometry?.width,
    height: i.geometry?.height,
    ...(i.parent?.id ? { parentId: i.parent.id } : {}),
  };
}

// ---- Creates ----

export async function apiCreateSticky(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body: any = {
    data: { content: params.content, shape: "square" },
    position: { x: params.x ?? 0, y: params.y ?? 0, origin: "center" },
    geometry: { width: params.width ?? 300 },
    style: { fillColor: stickyColor(params.style?.fillColor ?? "yellow") },
  };
  if (params.parentId) body.parent = { id: params.parentId };
  const res = await req("POST", `/boards/${boardId}/sticky_notes`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateText(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body: any = {
    data: { content: params.content },
    position: { x: params.x ?? 0, y: params.y ?? 0, origin: "center" },
    style: { fontSize: String(params.style?.fontSize ?? 14) },
  };
  if (params.parentId) body.parent = { id: params.parentId };
  const res = await req("POST", `/boards/${boardId}/texts`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateFrame(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body = {
    data: { title: params.content, format: "custom", type: "freeform" },
    position: { x: params.x ?? 0, y: params.y ?? 0, origin: "center" },
    geometry: { width: params.width ?? 1600, height: params.height ?? 900 },
  };
  const res = await req("POST", `/boards/${boardId}/frames`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateShape(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body: any = {
    data: { content: params.content ?? "", shape: params.style?.shape ?? "rectangle" },
    position: { x: params.x ?? 0, y: params.y ?? 0, origin: "center" },
    geometry: { width: params.width ?? 200, height: params.height ?? 100 },
    style: { fillColor: params.style?.fillColor ?? "#ffffff" },
  };
  if (params.parentId) body.parent = { id: params.parentId };
  const res = await req("POST", `/boards/${boardId}/shapes`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateCard(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body: any = {
    data: {
      title: params.content,
      description: params.style?.description ?? "",
      ...(params.style?.dueDate ? { dueDate: params.style.dueDate } : {}),
    },
    position: { x: params.x ?? 0, y: params.y ?? 0, origin: "center" },
  };
  if (params.parentId) body.parent = { id: params.parentId };
  const res = await req("POST", `/boards/${boardId}/cards`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateAppCard(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const fields: AppCardField[] = params.style?.fields ?? [];
  const body: any = {
    data: {
      title: params.content,
      description: params.style?.description ?? "",
      status: params.style?.status ?? "connected",
      fields: fields.slice(0, 20),
    },
    position: { x: params.x ?? 0, y: params.y ?? 0, origin: "center" },
  };
  if (params.parentId) body.parent = { id: params.parentId };
  const res = await req("POST", `/boards/${boardId}/app_cards`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateImage(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body: any = {
    data: { url: params.content },
    position: { x: params.x ?? 0, y: params.y ?? 0, origin: "center" },
    geometry: { width: params.width ?? 300 },
  };
  if (params.parentId) body.parent = { id: params.parentId };
  const res = await req("POST", `/boards/${boardId}/images`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateConnector(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body: any = {
    startItem: { id: params.startItemId },
    endItem: { id: params.endItemId },
    style: {
      strokeStyle: params.shape ?? "elbowed",
      startStrokeCap: params.startCap ?? "none",
      endStrokeCap: params.endCap ?? "filled_arrow",
    },
    ...(params.label ? { captions: [{ content: params.label, position: "50%" }] } : {}),
  };
  const res = await req("POST", `/boards/${boardId}/connectors`, accessToken, body);
  return { id: res.id };
}

export async function apiCreateTag(accessToken: string, boardId: string, params: any): Promise<{ id: string }> {
  const body = { title: params.title, fillColor: params.color ?? "yellow" };
  const res = await req("POST", `/boards/${boardId}/tags`, accessToken, body);
  // Attach to item
  await req("POST", `/boards/${boardId}/items/${params.itemId}/tags/${res.id}`, accessToken);
  return { id: res.id };
}

// ---- Update / Delete ----

const TYPE_ENDPOINT_MAP: Record<string, string> = {
  sticky_note: "sticky_notes",
  text: "texts",
  frame: "frames",
  shape: "shapes",
  card: "cards",
  app_card: "app_cards",
  image: "images",
  connector: "connectors",
};

async function resolveEndpointAndType(accessToken: string, boardId: string, itemId: string, knownType?: string): Promise<[string, string]> {
  if (knownType && TYPE_ENDPOINT_MAP[knownType]) return [TYPE_ENDPOINT_MAP[knownType], knownType];
  const item = await req("GET", `/boards/${boardId}/items/${itemId}`, accessToken);
  const type = item?.type ?? "shape";
  return [TYPE_ENDPOINT_MAP[type] ?? "shapes", type];
}

const TITLE_TYPES = new Set(["frame", "card", "app_card"]);

export async function apiUpdateItem(accessToken: string, boardId: string, params: any): Promise<void> {
  const [endpoint, resolvedType] = await resolveEndpointAndType(accessToken, boardId, params.id, params.itemType);

  const body: any = {};
  if (params.content !== undefined) {
    body.data = TITLE_TYPES.has(resolvedType)
      ? { title: params.content }
      : { content: params.content };
  }
  if (params.x !== undefined || params.y !== undefined) {
    body.position = { x: params.x, y: params.y, origin: "center" };
  }
  if (params.width !== undefined || params.height !== undefined) {
    body.geometry = { width: params.width, height: params.height };
  }
  if (params.style !== undefined) body.style = params.style;

  // App card: merge incoming fields onto existing ones rather than replacing the whole array
  if (resolvedType === "app_card" && params.fields !== undefined) {
    const existing = await req("GET", `/boards/${boardId}/${endpoint}/${params.id}`, accessToken);
    const existingFields: AppCardField[] = existing?.data?.fields ?? [];
    const incomingFields: AppCardField[] = params.fields ?? [];
    // Merge by index — incoming fields overwrite positionally, extras are appended
    const merged = [...existingFields];
    incomingFields.forEach((f, i) => {
      if (i < merged.length) merged[i] = { ...merged[i], ...f };
      else merged.push(f);
    });
    body.data = { ...body.data, fields: merged.slice(0, 20) };
  }

  await req("PATCH", `/boards/${boardId}/${endpoint}/${params.id}`, accessToken, body);
}

export async function apiDeleteItem(accessToken: string, boardId: string, itemId: string, itemType?: string): Promise<void> {
  const [endpoint] = await resolveEndpointAndType(accessToken, boardId, itemId, itemType);
  await req("DELETE", `/boards/${boardId}/${endpoint}/${itemId}`, accessToken);
}

// ---- Helpers ----

const STICKY_COLOR_MAP: Record<string, string> = {
  yellow: "yellow",
  light_yellow: "light_yellow",
  orange: "orange",
  red: "red",
  pink: "pink",
  light_pink: "light_pink",
  violet: "violet",
  blue: "blue",
  light_blue: "light_blue",
  dark_blue: "dark_blue",
  cyan: "cyan",
  green: "green",
  light_green: "light_green",
  dark_green: "dark_green",
  gray: "gray",
  black: "black",
};

function stickyColor(name: string): string {
  return STICKY_COLOR_MAP[name] ?? "yellow";
}
