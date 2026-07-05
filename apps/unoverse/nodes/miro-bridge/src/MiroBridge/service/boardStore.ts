import type { BoardState, BoardItem, BoardConnector, BoardTag } from "../util/types";

const BOARD_TTL = 60 * 60 * 24; // 24h

const itemSlotCounters = new Map<string, number>();
const textSlotCounters = new Map<string, number>();
const frameSlotCounters = new Map<string, number>();

export function nextItemSlot(_api: any, key: string, parentId: string): number {
  const counterKey = `${key}:${parentId}`;
  const slot = itemSlotCounters.get(counterKey) ?? 0;
  itemSlotCounters.set(counterKey, slot + 1);
  return slot;
}

export function nextTextSlot(_api: any, key: string, parentId: string): number {
  const counterKey = `${key}:text:${parentId}`;
  const slot = textSlotCounters.get(counterKey) ?? 0;
  textSlotCounters.set(counterKey, slot + 1);
  return slot;
}

export function nextFrameSlot(_api: any, key: string): number {
  const slot = frameSlotCounters.get(key) ?? 0;
  frameSlotCounters.set(key, slot + 1);
  return slot;
}

export function seedCountersFromBoard(key: string, state: BoardState): void {
  const frames = state.items.filter((i) => i.type === "frame");
  frameSlotCounters.set(key, frames.length);
  for (const frame of frames) {
    const children = state.items.filter((i) => i.parentId === frame.id && i.type !== "frame" && i.type !== "text");
    itemSlotCounters.set(`${key}:${frame.id}`, children.length);
    const texts = state.items.filter((i) => i.parentId === frame.id && i.type === "text");
    textSlotCounters.set(`${key}:text:${frame.id}`, texts.length);
  }
}

export async function nextFrameX(api: any, key: string, frameWidth: number): Promise<number> {
  const board = await getBoard(api, key);
  if (!board) return 0;
  const frames = board.items.filter((i) => i.type === "frame");
  if (frames.length === 0) return 0;
  // Frame positions are center-based. Find the rightmost edge of existing frames,
  // then place the new frame's center at (rightEdge + gap + newWidth/2)
  const rightEdge = frames.reduce((max, f) => {
    const fRight = (f.x ?? 0) + (f.width ?? 1600) / 2;
    return Math.max(max, fRight);
  }, 0);
  return rightEdge + 200 + frameWidth / 2;
}

export function keyFor(chatId: string, nodeId: string): string {
  return `miro:${chatId}:${nodeId}`;
}

function emptyBoard(): BoardState {
  return { items: [], connectors: [], tags: [], version: 0, updatedAt: new Date().toISOString() };
}

export async function getBoard(api: any, key: string): Promise<BoardState | null> {
  try {
    const raw = await api.redis?.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // backfill missing fields for boards saved before connectors/tags were added
    return {
      items: parsed.items ?? [],
      connectors: parsed.connectors ?? [],
      tags: parsed.tags ?? [],
      version: parsed.version ?? 0,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveBoard(api: any, key: string, state: BoardState): Promise<void> {
  try {
    await api.redis?.set(key, JSON.stringify(state), "EX", BOARD_TTL);
  } catch {
    // best-effort
  }
}

export async function applyCreate(
  api: any,
  key: string,
  item: BoardItem,
): Promise<BoardState> {
  const board = (await getBoard(api, key)) ?? emptyBoard();
  const next: BoardState = {
    ...board,
    items: [...board.items, item],
    version: board.version + 1,
    updatedAt: new Date().toISOString(),
  };
  await saveBoard(api, key, next);
  return next;
}

export async function applyCreateConnector(
  api: any,
  key: string,
  connector: BoardConnector,
): Promise<BoardState> {
  const board = (await getBoard(api, key)) ?? emptyBoard();
  const next: BoardState = {
    ...board,
    connectors: [...board.connectors, connector],
    version: board.version + 1,
    updatedAt: new Date().toISOString(),
  };
  await saveBoard(api, key, next);
  return next;
}

export async function applyCreateTag(
  api: any,
  key: string,
  tag: BoardTag,
): Promise<BoardState> {
  const board = (await getBoard(api, key)) ?? emptyBoard();
  // If tag with same title already exists, merge item IDs onto it
  const existing = board.tags.find((t) => t.title === tag.title && t.color === tag.color);
  const tags = existing
    ? board.tags.map((t) =>
        t === existing
          ? { ...t, itemIds: [...new Set([...t.itemIds, ...tag.itemIds])] }
          : t,
      )
    : [...board.tags, tag];
  const next: BoardState = { ...board, tags, version: board.version + 1, updatedAt: new Date().toISOString() };
  await saveBoard(api, key, next);
  return next;
}

export async function applyUpdate(
  api: any,
  key: string,
  id: string,
  changes: Partial<BoardItem>,
): Promise<BoardState | null> {
  const board = await getBoard(api, key);
  if (!board) return null;
  const idx = board.items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  const items = board.items.map((item, i) => i === idx ? { ...item, ...changes } : item);
  const next: BoardState = { ...board, items, version: board.version + 1, updatedAt: new Date().toISOString() };
  await saveBoard(api, key, next);
  return next;
}

export async function applyDelete(
  api: any,
  key: string,
  id: string,
): Promise<BoardState | null> {
  const board = await getBoard(api, key);
  if (!board) return null;
  const next: BoardState = {
    ...board,
    items: board.items.filter((i) => i.id !== id),
    connectors: board.connectors.filter((c) => c.startItemId !== id && c.endItemId !== id),
    tags: board.tags.map((t) => ({ ...t, itemIds: t.itemIds.filter((iid) => iid !== id) })),
    version: board.version + 1,
    updatedAt: new Date().toISOString(),
  };
  await saveBoard(api, key, next);
  return next;
}
