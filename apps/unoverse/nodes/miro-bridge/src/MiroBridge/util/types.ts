export interface MiroBridgeConfig {
  defaultX?: number;
  defaultY?: number;
}

export type MiroColor =
  | "yellow" | "orange" | "red" | "pink" | "violet"
  | "blue" | "cyan" | "green" | "light_green" | "gray" | "black" | "white";

export type MiroShapeType =
  | "rectangle" | "circle" | "triangle" | "rhombus"
  | "parallelogram" | "star" | "arrow" | "cross"
  | "flow_chart_process" | "flow_chart_decision" | "flow_chart_terminator"
  | "flow_chart_database" | "flow_chart_document" | "flow_chart_predefined_process";

export type DiagramNodeShape = "process" | "decision" | "terminator" | "database" | "parallelogram" | "default";

export interface DiagramNode {
  id: string;
  label: string;
  shape: DiagramNodeShape;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface PositionedNode extends DiagramNode {
  x: number;
  y: number;
}

export interface DiagramLayout {
  nodes: PositionedNode[];
  bounds: { width: number; height: number };
  edges: DiagramEdge[];
}

// ---- Board state (Redis) ----

export interface AppCardField {
  value?: string;
  fillColor?: string;
  textColor?: string;
  iconUrl?: string;
  iconShape?: "round" | "square";
  tooltip?: string;
}

export interface BoardItem {
  id: string;
  type: string;
  content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  parentId?: string;
  style?: Record<string, any>;
}

export interface BoardConnector {
  id: string;
  startItemId: string;
  endItemId: string;
  caption?: string;
}

export interface BoardTag {
  id: string;
  title: string;
  color?: string;
  itemIds: string[];
}

export interface BoardState {
  items: BoardItem[];
  connectors: BoardConnector[];
  tags: BoardTag[];
  version: number;
  updatedAt: string;
}

// ---- Round-trip types ----

export interface MiroToolResult {
  requestId: string;
  result?: any;
  error?: string;
}

// ---- Node output ----

export interface MiroBridgeOutput {
  __outputs: {
    boardState: BoardState;
  };
}

