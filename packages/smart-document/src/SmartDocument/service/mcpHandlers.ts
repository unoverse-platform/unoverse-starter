import { getDoc, patchDoc, replaceDoc } from "./markdownStore";
import type { ServiceCallResult } from "../util/types";

function withLineNumbers(content: string): string {
  const lines = content.split("\n");
  const width = String(lines.length).length;
  return lines
    .map((line, i) => `${String(i + 1).padStart(width, " ")}  ${line}`)
    .join("\n");
}

function clampRange(
  content: string,
  range: [number, number]
): { content: string; total: number } {
  const lines = content.split("\n");
  const total = lines.length;
  const start = Math.max(1, range[0]);
  const end = Math.min(total, range[1]);
  if (end < start) return { content: "", total };
  return { content: lines.slice(start - 1, end).join("\n"), total };
}

function countMatches(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  let count = 0;
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return count;
    count++;
    from = idx + needle.length;
  }
}

export async function handleView(
  api: any,
  key: string,
  params: { withLineNumbers?: boolean; range?: [number, number] } = {}
): Promise<{ content: string; version: number } | ServiceCallResult> {
  const doc = await getDoc(api, key);
  if (!doc) {
    return { ok: false, error: "not_initialised" };
  }

  let content = doc.content;
  if (params.range && Array.isArray(params.range) && params.range.length === 2) {
    content = clampRange(content, params.range as [number, number]).content;
  }

  const useLineNumbers = params.withLineNumbers !== false;
  if (useLineNumbers) {
    content = withLineNumbers(content);
  }

  return { content, version: doc.version };
}

export async function handleCreate(
  api: any,
  key: string,
  params: { content?: string }
): Promise<ServiceCallResult> {
  if (typeof params?.content !== "string") {
    return { ok: false, error: "invalid_params", message: "content must be a string" };
  }
  const doc = await replaceDoc(api, key, params.content);
  return { ok: true, version: doc.version, content: doc.content };
}

export async function handleStrReplace(
  api: any,
  key: string,
  params: { old_str?: string; new_str?: string }
): Promise<ServiceCallResult> {
  const oldStr = params?.old_str;
  const newStr = params?.new_str;

  if (typeof oldStr !== "string" || typeof newStr !== "string") {
    return {
      ok: false,
      error: "invalid_params",
      message: "old_str and new_str must be strings",
    };
  }
  if (oldStr.length === 0) {
    return { ok: false, error: "invalid_params", message: "old_str must be non-empty" };
  }

  const result = await patchDoc(api, key, (current) => {
    const matches = countMatches(current, oldStr);
    if (matches === 0) return { ok: false, error: "not_found" };
    if (matches > 1) return { ok: false, error: "not_unique", extra: { matches } };
    return { ok: true, content: current.replace(oldStr, newStr) };
  });

  if (!result.ok) {
    const err: ServiceCallResult = {
      ok: false,
      error: (result.error as any) ?? "invalid_params",
    };
    if (result.extra?.matches !== undefined) (err as any).matches = result.extra.matches;
    return err;
  }
  return { ok: true, version: result.doc.version, content: result.doc.content };
}

export async function handleInsert(
  api: any,
  key: string,
  params: { line?: number; text?: string }
): Promise<ServiceCallResult> {
  const line = params?.line;
  const text = params?.text;

  if (typeof line !== "number" || !Number.isInteger(line) || line < 0) {
    return {
      ok: false,
      error: "invalid_params",
      message: "line must be a non-negative integer",
    };
  }
  if (typeof text !== "string") {
    return { ok: false, error: "invalid_params", message: "text must be a string" };
  }

  const result = await patchDoc(api, key, (current) => {
    const lines = current.length === 0 ? [] : current.split("\n");
    const maxLine = lines.length;
    if (line > maxLine) {
      return { ok: false, error: "line_out_of_range", extra: { maxLine } };
    }
    const next = [...lines.slice(0, line), text, ...lines.slice(line)].join("\n");
    return { ok: true, content: next };
  });

  if (!result.ok) {
    const err: ServiceCallResult = {
      ok: false,
      error: (result.error as any) ?? "invalid_params",
    };
    if (result.extra?.maxLine !== undefined) (err as any).maxLine = result.extra.maxLine;
    return err;
  }
  return { ok: true, version: result.doc.version, content: result.doc.content };
}
