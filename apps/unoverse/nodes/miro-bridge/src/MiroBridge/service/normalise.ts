// Normalises common LLM parameter mistakes before they reach handlers.

// Extract item/widget ID from a full Miro URL, or return the value as-is.
function extractMiroId(value: string): string {
  if (!value.includes("miro.com")) return value;
  const widgetMatch = value.match(/[?&](?:moveToWidget|focusWidget)=([^&]+)/);
  if (widgetMatch) return widgetMatch[1];
  const boardMatch = value.match(/\/board\/([^/?]+)/);
  if (boardMatch) return boardMatch[1];
  return value;
}

// Canonical param names — maps known wrong casings to correct ones.
const ALIASES: Record<string, string> = {
  parentID: "parentId",
  ParentId: "parentId",
  parent_id: "parentId",
  startItemID: "startItemId",
  endItemID: "endItemId",
  itemID: "itemId",
  fillcolor: "fillColor",
  FillColor: "fillColor",
  fontSize: "fontSize",
  fontsize: "fontSize",
  duedate: "dueDate",
  DueDate: "dueDate",
};

// Fields whose values should be extracted as Miro IDs.
const ID_FIELDS = new Set(["id", "parentId", "itemId", "startItemId", "endItemId"]);

export function normaliseParams(params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    const normKey = ALIASES[key] ?? key;

    let normValue = value;

    // Extract IDs from URLs
    if (ID_FIELDS.has(normKey) && typeof value === "string") {
      normValue = extractMiroId(value);
    }

    // Coerce string booleans
    if (value === "true") normValue = true;
    else if (value === "false") normValue = false;

    result[normKey] = normValue;
  }

  return result;
}
