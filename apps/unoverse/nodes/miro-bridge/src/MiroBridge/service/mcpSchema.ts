export const MiroBridgeMCPSchema = {
  name: "MiroBridge",
  version: "2.0.0",
  description:
    "Read and write a live Miro board.\n\nWORKFLOW — follow this order strictly:\n1. Call get_board_state first to see what exists\n2. Create frames one at a time, sequentially — never in parallel\n3. After each create_frame call, use the returned id as parentId for all items inside it\n4. Create items inside frames — pass parentId from step 3\n5. Call zoom_to at the end\n\nNEVER create a frame and its child items in parallel — the server needs the frame id before placing items.\n\nFRAME LAYOUT:\n- Default size: 1600×900. Pass width/height to override (e.g. for large diagrams).\n- Server auto-positions frames horizontally with 200px gaps — do NOT pass x or y.\n\nITEM LAYOUT (inside frames):\n- Stickies, cards, text, images — do NOT pass x or y — server auto-grids into 3 columns\n- Grid: col0=x110, col1=x330, col2=x550; pitch=220px\n- Always pass parentId so items land inside the frame\n\nDIAGRAMS:\n- Use create_diagram for any flowchart, decision tree, or process flow\n- Pass Mermaid DSL — layout, sizing, shapes, and colours are all handled automatically",
  methods: {
    // ---- Read ----

    get_board_state: {
      description:
        "Fetches the current board state via the Miro REST API. Returns all items with id, type, content, x, y, width, height, and parentId. Always call this first in a session and after the user makes manual edits. Use the id of existing frames as parentId when adding items to them.",
      input: { type: "object", properties: {} },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          items: { type: "array" },
          count: { type: "integer" },
        },
      },
    },

    get_selection: {
      description: "Returns the items currently selected by the user on the board.",
      input: { type: "object", properties: {} },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          items: { type: "array" },
        },
      },
    },

    // ---- Writes ----

    create_sticky: {
      description: "Creates a sticky note inside a frame. The server auto-positions in a 4-column grid — do NOT pass x or y. Pass parentId to target a specific frame; if omitted the server assigns the most recent frame automatically.",
      input: {
        type: "object",
        properties: {
          text: { type: "string" },
          color: {
            type: "string",
            enum: ["gray", "light_yellow", "yellow", "orange", "light_green", "green", "dark_green", "cyan", "light_pink", "pink", "violet", "red", "light_blue", "blue", "dark_blue", "black"],
          },
          parentId: { type: "string", description: "Frame id to place this item inside" },
        },
        required: ["text"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    create_text: {
      description: "Creates a text item inside a frame. Server auto-positions — do NOT pass x or y. Pass parentId from create_frame.",
      input: {
        type: "object",
        properties: {
          text: { type: "string" },
          fontSize: { type: "number", description: "24 for body, 48 for headers" },
          parentId: { type: "string", description: "Frame id — required to place inside a frame" },
        },
        required: ["text"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    create_frame: {
      description: "Creates a named frame. Server auto-positions frames horizontally — do NOT pass x or y. Optionally pass width/height to override the 1600×900 default (useful for large diagrams). Returns id — use it as parentId for all items inside this frame.",
      input: {
        type: "object",
        properties: {
          title: { type: "string" },
          width: { type: "number", description: "Frame width. Default 1600." },
          height: { type: "number", description: "Frame height. Default 900." },
        },
        required: ["title"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    create_card: {
      description: "Creates a task card inside a frame. Server auto-positions — do NOT pass x or y. Pass parentId from create_frame.",
      input: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", description: "ISO date string e.g. 2026-05-10" },
          parentId: { type: "string", description: "Frame id — required to place inside a frame" },
        },
        required: ["title"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    create_app_card: {
      description:
        "Creates a structured app card inside a frame. Use instead of stickies for structured data (research findings, task breakdowns, scored items). Server auto-positions — do NOT pass x or y. Pass parentId from create_frame.",
      input: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["connected", "disconnected", "disabled"],
            description: "Default connected",
          },
          fields: {
            type: "array",
            description: "Up to 20 custom fields",
            items: {
              type: "object",
              properties: {
                value: { type: "string" },
                fillColor: { type: "string", description: "Hex colour for the field background" },
                textColor: { type: "string" },
                iconUrl: { type: "string" },
                iconShape: { type: "string", enum: ["round", "square"] },
                tooltip: { type: "string" },
              },
            },
          },
          parentId: { type: "string", description: "Frame id — required to place inside a frame" },
        },
        required: ["title"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    create_image: {
      description: "Places an image inside a frame from a URL. Server auto-positions — do NOT pass x or y. Pass parentId from create_frame.",
      input: {
        type: "object",
        properties: {
          url: { type: "string", description: "Public image URL" },
          width: { type: "number", description: "Default 300" },
          parentId: { type: "string", description: "Frame id — required to place inside a frame" },
        },
        required: ["url"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    update_item: {
      description:
        "Updates an existing item's content, position, or style by id. Obtain ids from get_board_state. Returns NOT_FOUND if the id is not in the cached state — call get_board_state to refresh. For app_cards, pass fields to update individual fields — they are merged with existing fields, not replaced.",
      input: {
        type: "object",
        properties: {
          id: { type: "string" },
          content: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
          style: { type: "object" },
          fields: {
            type: "array",
            description: "App card fields to merge (positional — index 0 updates first field, etc.)",
            items: {
              type: "object",
              properties: {
                value: { type: "string" },
                fillColor: { type: "string" },
                textColor: { type: "string" },
                tooltip: { type: "string" },
              },
            },
          },
        },
        required: ["id"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    delete_item: {
      description: "Deletes an item by id. Returns NOT_FOUND if the id is not in the cached state.",
      input: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" } } },
    },

    create_connector: {
      description: "Draws a connector (arrow) between two item ids.",
      input: {
        type: "object",
        properties: {
          startItemId: { type: "string" },
          endItemId: { type: "string" },
          label: { type: "string" },
          shape: {
            type: "string",
            enum: ["straight", "elbowed", "curved"],
            description: "Connector line style. Default elbowed.",
          },
          startCap: {
            type: "string",
            enum: ["none", "arrow", "filled_arrow", "circle", "filled_circle"],
            description: "Start cap style. Default none.",
          },
          endCap: {
            type: "string",
            enum: ["none", "arrow", "filled_arrow", "circle", "filled_circle"],
            description: "End cap style. Default filled_arrow.",
          },
        },
        required: ["startItemId", "endItemId"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    add_tag: {
      description:
        "Creates a colour-coded tag and attaches it to an item (typically a sticky note). Tags are a non-destructive categorisation layer — they don't modify item content. Use for status, priority, or theme labels.",
      input: {
        type: "object",
        properties: {
          title: { type: "string", description: "Tag label text" },
          itemId: { type: "string", description: "ID of the item to attach the tag to" },
          color: {
            type: "string",
            enum: ["red", "light_green", "cyan", "yellow", "magenta", "green", "blue", "gray", "violet", "orange", "pink"],
            description: "Default yellow",
          },
        },
        required: ["title", "itemId"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" }, id: { type: "string" } } },
    },

    zoom_to: {
      description: "Zooms the viewport to fit the specified items.",
      input: {
        type: "object",
        properties: {
          itemIds: { type: "array", items: { type: "string" } },
        },
        required: ["itemIds"],
      },
      output: { type: "object", properties: { ok: { type: "boolean" } } },
    },

    create_diagram: {
      description: "Creates a flowchart diagram from a Mermaid DSL string. Automatically handles all node layout, sizing, shape types, colours, and connector routing. Use for any process flow, decision tree, or system diagram. Creates its own auto-sized frame unless parentId is supplied.\n\nSupported syntax:\n  flowchart TD   (top-down) or flowchart LR   (left-right)\n  A[label]       rectangle / process\n  B{label}       diamond / decision\n  C((label))     circle / terminator\n  D[(label)]     database cylinder\n  E[/label/]     parallelogram\n  A --> B        edge\n  A -->|label| B edge with label\n\nMax 50 nodes. Recommended under 20 nodes for best performance.",
      input: {
        type: "object",
        properties: {
          dsl: {
            type: "string",
            description: "Mermaid flowchart string e.g. \"flowchart TD\\n  A[Start] --> B{Valid?}\\n  B -->|Yes| C[Done]\\n  B -->|No| A\"",
          },
          parentId: {
            type: "string",
            description: "Optional frame id to place the diagram inside. If omitted, a new auto-sized frame is created.",
          },
          title: {
            type: "string",
            description: "Frame title when auto-creating a frame. Default 'Diagram'.",
          },
        },
        required: ["dsl"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          itemIds: { type: "array", items: { type: "string" } },
          parentId: { type: "string" },
        },
      },
    },
  },
};
