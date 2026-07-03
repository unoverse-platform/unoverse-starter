/**
 * Normalize markdown tables so markdown-to-jsx reliably parses them.
 *
 * markdown-to-jsx only recognises a GFM table when its header row begins a new
 * block — i.e. it is preceded by a blank line. AI output frequently emits a
 * table directly under a line of prose:
 *
 *   Here are the options:
 *   | Card | APR |
 *   | --- | --- |
 *   | A    | 10% |
 *
 * Without the blank line the whole block is absorbed into a paragraph and the
 * pipes render literally. This helper inserts the missing blank line before a
 * table (and after it, when prose follows immediately), leaving everything else
 * untouched. Fenced code blocks are skipped so pipes in code are never altered.
 */

// Any line containing a pipe is a candidate table row.
const isTableRow = (line: string): boolean => line.includes("|");

// A delimiter row is the `| --- | :--: |` line under the header: only pipes,
// dashes, colons and whitespace, with at least one pipe and one dash.
const isDelimiterRow = (line: string): boolean =>
  line.includes("|") && line.includes("-") && /^[\s|:-]+$/.test(line);

const isFence = (line: string): boolean => /^\s*(```|~~~)/.test(line);

export function normalizeMarkdownTables(text: string): string {
  if (!text || !text.includes("|")) return text;

  const lines = text.split("\n");
  const out: string[] = [];
  let inTable = false;
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] ?? "";

    // Never touch fenced code blocks.
    if (isFence(line)) {
      inFence = !inFence;
      inTable = false;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }

    // A table starts where a header row is immediately followed by a delimiter.
    if (!inTable && isTableRow(line) && isDelimiterRow(next)) {
      if (out.length && out[out.length - 1].trim() !== "") {
        out.push(""); // ensure the header begins a new block
      }
      inTable = true;
      out.push(line);
      continue;
    }

    if (inTable) {
      if (isTableRow(line)) {
        out.push(line);
        continue;
      }
      // First non-row line ends the table; separate any prose that follows.
      inTable = false;
      if (line.trim() !== "") {
        out.push("");
      }
      out.push(line);
      continue;
    }

    out.push(line);
  }

  return out.join("\n");
}
