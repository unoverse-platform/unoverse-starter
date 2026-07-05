import type { DiagramNode, DiagramEdge, DiagramLayout, DiagramNodeShape, MiroShapeType, PositionedNode } from "../util/types";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const VERTICAL_GAP = 120;
const HORIZONTAL_GAP = 80;
const MAX_NODES = 50;
const MAX_LINES = 200;

// ---- Mermaid parser ----

const RE_DIRECTION = /^flowchart\s+(TD|TB|LR|RL)/i;
const RE_NODE_RECT = /^(\w+)\[([^\]]+)\]/;
const RE_NODE_DIAMOND = /^(\w+)\{([^}]+)\}/;
const RE_NODE_CIRCLE = /^(\w+)\(\(([^)]+)\)\)/;
const RE_NODE_DB = /^(\w+)\[\(([^)]+)\)\]/;
const RE_NODE_PARALLEL = /^(\w+)\[\/([^/]+)\/\]/;
const RE_EDGE_LABEL = /^(\w+)\s*--?>?\|([^|]+)\|\s*(\w+)/;
const RE_EDGE = /^(\w+)\s*--?-?>?\s*(\w+)/;

function inferShape(type: string): DiagramNodeShape {
  switch (type) {
    case "rect":     return "process";
    case "diamond":  return "decision";
    case "circle":   return "terminator";
    case "db":       return "database";
    case "parallel": return "parallelogram";
    default:         return "default";
  }
}

export function parseMermaid(dsl: string): { nodes: DiagramNode[]; edges: DiagramEdge[]; direction: "TB" | "LR" } {
  const lines = dsl.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > MAX_LINES) throw new Error("INPUT_TOO_LONG: max 200 lines");

  let direction: "TB" | "LR" = "TB";
  const nodeMap = new Map<string, DiagramNode>();
  const edges: DiagramEdge[] = [];

  function ensureNode(id: string, label?: string, shape?: DiagramNodeShape) {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label: label ?? id, shape: shape ?? "default" });
    } else if (label) {
      const existing = nodeMap.get(id)!;
      nodeMap.set(id, { ...existing, label, shape: shape ?? existing.shape });
    }
  }

  for (const line of lines) {
    // direction
    const dMatch = RE_DIRECTION.exec(line);
    if (dMatch) {
      direction = (dMatch[1].toUpperCase() === "LR" || dMatch[1].toUpperCase() === "RL") ? "LR" : "TB";
      continue;
    }

    // node declarations (check before edge patterns)
    const dbMatch = RE_NODE_DB.exec(line);
    if (dbMatch) { ensureNode(dbMatch[1], dbMatch[2], "database"); continue; }

    const circMatch = RE_NODE_CIRCLE.exec(line);
    if (circMatch) { ensureNode(circMatch[1], circMatch[2], "terminator"); continue; }

    const parallelMatch = RE_NODE_PARALLEL.exec(line);
    if (parallelMatch) { ensureNode(parallelMatch[1], parallelMatch[2], "parallelogram"); continue; }

    const diamondMatch = RE_NODE_DIAMOND.exec(line);
    if (diamondMatch) { ensureNode(diamondMatch[1], diamondMatch[2], "decision"); continue; }

    const rectMatch = RE_NODE_RECT.exec(line);
    if (rectMatch) { ensureNode(rectMatch[1], rectMatch[2], "process"); continue; }

    // edge with label — also declares nodes implicitly if not yet seen
    const edgeLabelMatch = RE_EDGE_LABEL.exec(line);
    if (edgeLabelMatch) {
      ensureNode(edgeLabelMatch[1]);
      ensureNode(edgeLabelMatch[3]);
      edges.push({ from: edgeLabelMatch[1], to: edgeLabelMatch[3], label: edgeLabelMatch[2].trim() });
      continue;
    }

    // plain edge
    const edgeMatch = RE_EDGE.exec(line);
    if (edgeMatch) {
      ensureNode(edgeMatch[1]);
      ensureNode(edgeMatch[2]);
      edges.push({ from: edgeMatch[1], to: edgeMatch[2] });
      continue;
    }
  }

  const nodes = Array.from(nodeMap.values());
  if (nodes.length > MAX_NODES) throw new Error(`TOO_MANY_NODES: max ${MAX_NODES} nodes`);

  return { nodes, edges, direction };
}

// ---- Layout algorithm (simplified Sugiyama) ----

export function computeLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  direction: "TB" | "LR",
): DiagramLayout {
  if (nodes.length === 0) {
    return { nodes: [], bounds: { width: 0, height: 0 }, edges };
  }

  const nodeIds = nodes.map((n) => n.id);
  const inDegree = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const outEdges = new Map<string, string[]>(nodeIds.map((id) => [id, []]));
  const inEdges = new Map<string, string[]>(nodeIds.map((id) => [id, []]));

  for (const e of edges) {
    if (!inDegree.has(e.to) || !inDegree.has(e.from)) continue;
    inDegree.set(e.to, (inDegree.get(e.to) ?? 0) + 1);
    outEdges.get(e.from)?.push(e.to);
    inEdges.get(e.to)?.push(e.from);
  }

  // BFS layer assignment
  const layer = new Map<string, number>();
  const queue: string[] = [];

  for (const id of nodeIds) {
    if ((inDegree.get(id) ?? 0) === 0) {
      layer.set(id, 0);
      queue.push(id);
    }
  }
  // If no roots (fully cyclic), seed with first node
  if (queue.length === 0) {
    layer.set(nodeIds[0], 0);
    queue.push(nodeIds[0]);
  }

  let qi = 0;
  while (qi < queue.length) {
    const id = queue[qi++];
    const currentLayer = layer.get(id) ?? 0;
    for (const child of outEdges.get(id) ?? []) {
      if (!layer.has(child) || (layer.get(child) ?? 0) < currentLayer + 1) {
        layer.set(child, currentLayer + 1);
        queue.push(child);
      }
    }
  }

  // Assign unvisited nodes (disconnected) to last layer + 1
  const maxLayer = Math.max(...Array.from(layer.values()), 0);
  for (const id of nodeIds) {
    if (!layer.has(id)) layer.set(id, maxLayer + 1);
  }

  // Group by layer
  const layerCount = Math.max(...Array.from(layer.values())) + 1;
  const layers: string[][] = Array.from({ length: layerCount }, () => []);
  for (const id of nodeIds) {
    layers[layer.get(id) ?? 0].push(id);
  }

  // Barycentric ordering (4 iterations)
  for (let iter = 0; iter < 4; iter++) {
    // Forward pass
    for (let l = 1; l < layers.length; l++) {
      const prevPositions = new Map(layers[l - 1].map((id, pos) => [id, pos]));
      layers[l].sort((a, b) => {
        const avgA = average((inEdges.get(a) ?? []).map((p) => prevPositions.get(p) ?? 0));
        const avgB = average((inEdges.get(b) ?? []).map((p) => prevPositions.get(p) ?? 0));
        return avgA - avgB;
      });
    }
    // Backward pass
    for (let l = layers.length - 2; l >= 0; l--) {
      const nextPositions = new Map(layers[l + 1].map((id, pos) => [id, pos]));
      layers[l].sort((a, b) => {
        const avgA = average((outEdges.get(a) ?? []).map((s) => nextPositions.get(s) ?? 0));
        const avgB = average((outEdges.get(b) ?? []).map((s) => nextPositions.get(s) ?? 0));
        return avgA - avgB;
      });
    }
  }

  // Compute coordinates — center smaller layers relative to the widest
  const maxNodesInAnyLayer = Math.max(...layers.map((l) => l.length));
  const posMap = new Map<string, { x: number; y: number }>();
  for (let l = 0; l < layers.length; l++) {
    const layerSize = layers[l].length;
    for (let p = 0; p < layerSize; p++) {
      const id = layers[l][p];
      if (direction === "LR") {
        const maxLayerWidth = maxNodesInAnyLayer * (NODE_HEIGHT + VERTICAL_GAP);
        const thisLayerWidth = layerSize * (NODE_HEIGHT + VERTICAL_GAP);
        const offset = (maxLayerWidth - thisLayerWidth) / 2;
        posMap.set(id, {
          x: l * (NODE_WIDTH + VERTICAL_GAP),
          y: offset + p * (NODE_HEIGHT + HORIZONTAL_GAP),
        });
      } else {
        const maxLayerWidth = maxNodesInAnyLayer * (NODE_WIDTH + HORIZONTAL_GAP);
        const thisLayerWidth = layerSize * (NODE_WIDTH + HORIZONTAL_GAP);
        const offset = (maxLayerWidth - thisLayerWidth) / 2;
        posMap.set(id, {
          x: offset + p * (NODE_WIDTH + HORIZONTAL_GAP),
          y: l * (NODE_HEIGHT + VERTICAL_GAP),
        });
      }
    }
  }

  // Calculate bounds from actual positioned nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pos of posMap.values()) {
    if (pos.x < minX) minX = pos.x;
    if (pos.y < minY) minY = pos.y;
    if (pos.x + NODE_WIDTH > maxX) maxX = pos.x + NODE_WIDTH;
    if (pos.y + NODE_HEIGHT > maxY) maxY = pos.y + NODE_HEIGHT;
  }
  const bounds = { width: maxX - minX, height: maxY - minY };

  // Normalize positions so the top-left of the bounding box starts at (0,0)
  const positionedNodes: PositionedNode[] = nodes.map((n) => ({
    ...n,
    x: (posMap.get(n.id)?.x ?? 0) - minX,
    y: (posMap.get(n.id)?.y ?? 0) - minY,
  }));

  return { nodes: positionedNodes, bounds, edges };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ---- Shape and color mapping ----

export function miroShapeFor(nodeShape: DiagramNodeShape): MiroShapeType {
  switch (nodeShape) {
    case "process":      return "flow_chart_process";
    case "decision":     return "flow_chart_decision";
    case "terminator":   return "flow_chart_terminator";
    case "database":     return "flow_chart_database";
    case "parallelogram": return "parallelogram";
    default:             return "rectangle";
  }
}

export function fillColorFor(nodeShape: DiagramNodeShape): string {
  switch (nodeShape) {
    case "process":      return "#dbeafe";
    case "decision":     return "#fef9c3";
    case "terminator":   return "#dcfce7";
    case "database":     return "#e0e7ff";
    default:             return "#f3f4f6";
  }
}

export { NODE_WIDTH, NODE_HEIGHT };
