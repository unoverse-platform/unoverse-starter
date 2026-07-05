import type { MiroBridgeConfig } from "../util/types";
import type { NodeExecutionContext } from "@unoverse-platform/plugin-base";
import {
  keyFor,
  getBoard,
  saveBoard,
  applyCreate,
  applyCreateConnector,
  applyCreateTag,
  applyUpdate,
  applyDelete,
  nextItemSlot,
  nextTextSlot,
  nextFrameSlot,
  nextFrameX,
  seedCountersFromBoard,
} from "./boardStore";
import { parseMermaid, computeLayout, miroShapeFor, fillColorFor, NODE_WIDTH, NODE_HEIGHT } from "./diagramLayout";
import {
  apiBoardState,
  apiCreateSticky,
  apiCreateText,
  apiCreateFrame,
  apiCreateShape,
  apiCreateCard,
  apiCreateAppCard,
  apiCreateImage,
  apiCreateConnector,
  apiCreateTag,
  apiUpdateItem,
  apiDeleteItem,
} from "./miroApi";

async function getCredentials(api: any, credentialContext: any, context: NodeExecutionContext): Promise<{ accessToken: string; boardId: string }> {
  // Platform resolves credentials into credentialContext.credentials before execution
  const available = credentialContext.credentials || {};
  let creds: any;
  for (const val of Object.values(available)) {
    if ((val as any)?.accessToken) { creds = val; break; }
  }
  if (!creds?.accessToken || !creds?.boardId) {
    throw new Error("miroCredential missing accessToken or boardId");
  }
  return { accessToken: creds.accessToken, boardId: creds.boardId };
}

// Only use parentId if the caller explicitly provides one. Never auto-parent.
function resolveExplicitParent(explicit?: string): string | undefined {
  return explicit || undefined;
}

function resolveGridPosition(api: any, key: string | null, parentId?: string): { x: number; y: number } {
  const slotKey = parentId ?? "__board__";
  const slot = key ? nextItemSlot(api, key, slotKey) : 0;
  const col = slot % 4;
  const row = Math.floor(slot / 4);
  // Absolute board coordinates. 320px pitch (300px sticky + 20px gap).
  return { x: col * 320, y: row * 320 };
}

function resolveKey(context: NodeExecutionContext): string | null {
  const chatId =
    (context as any).publishingContext?.chatId ??
    (context as any).chatId ??
    null;
  if (!chatId) return null;
  return keyFor(chatId, context.nodeId);
}

// ---- Reads (REST API → Redis cache) ----

export async function handleGetBoardState(
  _params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const snapshot = await apiBoardState(accessToken, boardId);
  const state = { ...snapshot, version: 1, updatedAt: new Date().toISOString() };
  if (key) {
    await saveBoard(api, key, state);
    seedCountersFromBoard(key, state);
  }

  return { ok: true, items: state.items, connectors: state.connectors, tags: state.tags, count: state.items.length };
}

export async function handleGetSelection(
  _params: Record<string, any>,
  _config: MiroBridgeConfig,
  _context: NodeExecutionContext,
  _api: any,
  _credentialContext: any,
): Promise<any> {
  return { ok: true, items: [], note: "get_selection requires the Miro panel to be open" };
}

// ---- Writes (REST API + Redis) ----

export async function handleCreateSticky(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.text) return { ok: false, error: "MISSING_PARAM", hint: "'text' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const parentId = resolveExplicitParent(params.parentId);
  const { x, y } = (params.x != null && params.y != null)
    ? { x: params.x, y: params.y }
    : resolveGridPosition(api, key, parentId);
  const p = { content: params.text, x, y, width: params.width, style: { fillColor: params.color ?? "yellow" }, parentId };
  const { id } = await apiCreateSticky(accessToken, boardId, p);
  if (key) await applyCreate(api, key, { id, type: "sticky_note", content: params.text, x, y, parentId });
  return { ok: true, id };
}

export async function handleCreateText(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.text) return { ok: false, error: "MISSING_PARAM", hint: "'text' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const parentId = resolveExplicitParent(params.parentId);
  let x = params.x ?? 0;
  let y = params.y ?? 0;
  if (params.x == null && params.y == null && key) {
    const slotKey = parentId ?? "__text__";
    const slot = nextTextSlot(api, key, slotKey);
    x = 0;
    y = slot * 120;
  }
  const p = { content: params.text, x, y, style: { fontSize: params.fontSize }, parentId };
  const { id } = await apiCreateText(accessToken, boardId, p);
  if (key) await applyCreate(api, key, { id, type: "text", content: params.text, x, y, parentId });
  return { ok: true, id };
}

export async function handleCreateFrame(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.title) return { ok: false, error: "MISSING_PARAM", hint: "'title' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const frameWidth = params.width ?? 1600;
  const frameHeight = params.height ?? 900;
  const xOffset = key ? await nextFrameX(api, key, frameWidth) : 0;
  if (key) nextFrameSlot(api, key);
  const p = { content: params.title, x: xOffset, y: 0, width: frameWidth, height: frameHeight };
  const { id } = await apiCreateFrame(accessToken, boardId, p);
  if (key) await applyCreate(api, key, { id, type: "frame", content: params.title, x: p.x, y: p.y, width: p.width, height: p.height });
  return { ok: true, id };
}

export async function handleCreateShape(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const p = { content: params.text ?? "", x: params.x ?? config.defaultX ?? 0, y: params.y ?? config.defaultY ?? 0, width: params.width ?? 200, height: params.height ?? 100, style: { shape: params.shape ?? "rectangle", fillColor: params.fillColor }, parentId: params.parentId };
  const { id } = await apiCreateShape(accessToken, boardId, p);
  if (key) await applyCreate(api, key, { id, type: "shape", content: p.content, x: p.x, y: p.y, width: p.width, height: p.height, parentId: params.parentId });
  return { ok: true, id };
}

export async function handleCreateCard(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.title) return { ok: false, error: "MISSING_PARAM", hint: "'title' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const parentId = resolveExplicitParent(params.parentId);
  const { x, y } = (params.x != null && params.y != null)
    ? { x: params.x, y: params.y }
    : resolveGridPosition(api, key, parentId);
  const p = { content: params.title, x, y, style: { description: params.description, dueDate: params.dueDate }, parentId };
  const { id } = await apiCreateCard(accessToken, boardId, p);
  if (key) await applyCreate(api, key, { id, type: "card", content: params.title, x, y, parentId });
  return { ok: true, id };
}

export async function handleCreateAppCard(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.title) return { ok: false, error: "MISSING_PARAM", hint: "'title' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const parentId = resolveExplicitParent(params.parentId);
  const { x, y } = (params.x != null && params.y != null)
    ? { x: params.x, y: params.y }
    : resolveGridPosition(api, key, parentId);
  const p = { content: params.title, x, y, style: { description: params.description, status: params.status, fields: params.fields }, parentId };
  const { id } = await apiCreateAppCard(accessToken, boardId, p);
  if (key) await applyCreate(api, key, { id, type: "app_card", content: params.title, x, y, parentId });
  return { ok: true, id };
}

export async function handleCreateImage(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.url) return { ok: false, error: "MISSING_PARAM", hint: "'url' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const parentId = resolveExplicitParent(params.parentId);
  const { x, y } = (params.x != null && params.y != null)
    ? { x: params.x, y: params.y }
    : resolveGridPosition(api, key, parentId);
  const p = { content: params.url, x, y, width: params.width ?? 300, parentId };
  const { id } = await apiCreateImage(accessToken, boardId, p);
  if (key) await applyCreate(api, key, { id, type: "image", content: params.url, x, y, parentId });
  return { ok: true, id };
}

export async function handleUpdateItem(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.id) return { ok: false, error: "MISSING_PARAM", hint: "'id' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  // Look up item type from board state so apiUpdateItem routes to the correct endpoint
  const board = key ? await getBoard(api, key) : null;
  const item = board?.items.find((i) => i.id === params.id);
  const paramsWithType = { ...params, itemType: item?.type };

  await apiUpdateItem(accessToken, boardId, paramsWithType);
  if (key) await applyUpdate(api, key, params.id, { content: params.content, x: params.x, y: params.y, width: params.width, height: params.height });
  return { ok: true, id: params.id };
}

export async function handleDeleteItem(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.id) return { ok: false, error: "MISSING_PARAM", hint: "'id' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const deleteBoard = key ? await getBoard(api, key) : null;
  const deleteItem = deleteBoard?.items.find((i) => i.id === params.id);
  await apiDeleteItem(accessToken, boardId, params.id, deleteItem?.type);
  if (key) await applyDelete(api, key, params.id);
  return { ok: true };
}

export async function handleCreateConnector(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.startItemId || !params.endItemId) return { ok: false, error: "MISSING_PARAM", hint: "'startItemId' and 'endItemId' are required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const connParams = {
    ...params,
    shape: params.shape ?? "elbowed",
    startCap: params.startCap ?? "none",
    endCap: params.endCap ?? "filled_arrow",
  };
  const { id } = await apiCreateConnector(accessToken, boardId, connParams);
  if (key) await applyCreateConnector(api, key, { id, startItemId: params.startItemId, endItemId: params.endItemId, caption: params.label });
  return { ok: true, id };
}

export async function handleCreateDiagram(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.dsl) return { ok: false, error: "MISSING_PARAM", hint: "'dsl' is required" };

  let parsed: ReturnType<typeof parseMermaid>;
  try {
    parsed = parseMermaid(params.dsl);
  } catch (e: any) {
    return { ok: false, error: "PARSE_ERROR", hint: e.message };
  }

  const layout = computeLayout(parsed.nodes, parsed.edges, parsed.direction);

  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  // Place diagram at absolute board coordinates (no parent frame).
  // Community pattern: create shapes at board level, then wrap in a frame.
  const startX = key ? await nextFrameX(api, key, layout.bounds.width + 100) : 0;
  const startY = 0;

  const nodeIdMap = new Map<string, string>();
  const allIds: string[] = [];

  for (const node of layout.nodes) {
    const p = {
      content: node.label,
      x: startX + node.x,
      y: startY + node.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      style: { shape: miroShapeFor(node.shape), fillColor: fillColorFor(node.shape) },
    };
    const { id } = await apiCreateShape(accessToken, boardId, p);
    if (key) await applyCreate(api, key, { id, type: "shape", content: node.label, x: p.x, y: p.y, width: NODE_WIDTH, height: NODE_HEIGHT });
    nodeIdMap.set(node.id, id);
    allIds.push(id);
  }

  for (const edge of parsed.edges) {
    const startItemId = nodeIdMap.get(edge.from);
    const endItemId = nodeIdMap.get(edge.to);
    if (!startItemId || !endItemId) continue;
    const cp = { startItemId, endItemId, label: edge.label, shape: "elbowed", endCap: "filled_arrow" };
    const { id } = await apiCreateConnector(accessToken, boardId, cp);
    if (key) await applyCreateConnector(api, key, { id, startItemId, endItemId, caption: edge.label });
    allIds.push(id);
  }

  // Wrap in a frame after all items are placed at board level
  const frameWidth = layout.bounds.width + 100;
  const frameHeight = layout.bounds.height + 100;
  const frameCenterX = startX + layout.bounds.width / 2;
  const frameCenterY = startY + layout.bounds.height / 2;
  const title = params.title ?? "Diagram";
  const { id: frameId } = await apiCreateFrame(accessToken, boardId, {
    content: title, x: frameCenterX, y: frameCenterY, width: frameWidth, height: frameHeight,
  });
  if (key) {
    nextFrameSlot(api, key);
    await applyCreate(api, key, { id: frameId, type: "frame", content: title, x: frameCenterX, y: frameCenterY, width: frameWidth, height: frameHeight });
  }

  return { ok: true, itemIds: allIds, frameId };
}

export async function handleAddTag(
  params: Record<string, any>,
  config: MiroBridgeConfig,
  context: NodeExecutionContext,
  api: any,
  credentialContext: any,
): Promise<any> {
  if (!params.title) return { ok: false, error: "MISSING_PARAM", hint: "'title' is required" };
  if (!params.itemId) return { ok: false, error: "MISSING_PARAM", hint: "'itemId' is required" };
  const key = resolveKey(context);
  const { accessToken, boardId } = await getCredentials(api, credentialContext, context);

  const { id } = await apiCreateTag(accessToken, boardId, params);
  if (key) await applyCreateTag(api, key, { id, title: params.title, color: params.color ?? "yellow", itemIds: [params.itemId] });
  return { ok: true, id };
}

export async function handleZoomTo(
  params: Record<string, any>,
  _config: MiroBridgeConfig,
  _context: NodeExecutionContext,
  _api: any,
  _credentialContext: any,
): Promise<any> {
  if (!params.itemIds?.length) return { ok: false, error: "MISSING_PARAM", hint: "'itemIds' is required" };
  return { ok: true, note: "zoom_to is handled by the Miro panel when open" };
}
