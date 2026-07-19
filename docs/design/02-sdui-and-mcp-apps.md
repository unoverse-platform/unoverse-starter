# 02 — SDUI & MCP Apps

**UI is data. MCP is the transport. This is the standard — not one option among several.**

---

## 🏗️ The model in one picture

```
  YOU WRITE (data)                 THE PLATFORM PROVIDES (code)
┌──────────────────────┐        ┌─────────────────────────────────┐
│ rx/ definitions      │        │ SDK renderer (per platform)     │
│  components/ atoms/  │  MCP   │  web · Flutter · iOS · Android  │
│  orgs/<org>/         │ ─────► │  — dumb, generic, style-free    │
│    templates/ styles/│ stream │                                 │
│    components/       │        │                                 │
└──────────────────────┘        │ Engine: workflows stream data   │
   JSON + tokens only           │ into your components            │
                                └─────────────────────────────────┘
```

- **You** author neutral JSON definitions and token files.
- **The SDK** on each platform renders them natively. It hardcodes **no feature, no style, no UI concept** — it resolves tokens and moves your state keys, nothing else.
- **The engine** runs workflows whose agents pick your components (by `whenToUse`) and stream data into them.

### Why SDUI

| Benefit | How you feel it |
|---|---|
| **Zero-release UI changes** | Edit a definition or a token → every channel updates on refresh. No app-store release, no rebuild per platform. |
| **One definition, every platform** | The same JSON renders as React on web and native views elsewhere. You never fork per platform. |
| **Agents can drive UI** | Because UI is data, a workflow/agent can select, stream, and update it at runtime — the whole point of the platform. |
| **Rebrand = data** | All styling is tokens; a theme swap touches `styles/` only ([06](./06-styles-and-tokens.md)). |
| **Provable dev loop** | Studio renders through the exact production path — what you preview is what ships ([07](./07-studio.md)). |

---

## 🧱 The closed primitive set

Definitions compose ONLY these. The set is frozen — adding to it is an SDK change, and a build-failing guard test enforces that.

| Group | Primitives |
|---|---|
| **Structure** | `Box`, `Stack`, `Row`, `Column`, `Each`, `Switch`, `ComponentSlot`, `Timeline` |
| **Leaves** | `Text`, `Image`, `Button`, `Input`, `Markdown`, `Skeleton`, `Icon` |
| **Helpers** | `Ref` (use an atom), `$include` (pull in a sibling file) |
| **Conditions** | `eq`, `ne`, `in`, truthy — used by `visibleWhen`, `Switch`, `style.when` |

❌ **Wrong instinct:** "I need a `Chart` / `Accordion` / `Carousel` primitive."
✅ **Right instinct:** compose it — bars are `Box` + `Each` over data; an accordion is `visibleWhen` on a dev-named state key. If it genuinely cannot be composed, that's a platform conversation, not a definition.

---

## 🔌 MCP Apps — the standard

**A template is an MCP App.** This is not an integration detail; it is the contract every client and every tool in the ecosystem shares:

| Concern | The MCP-standard answer |
|---|---|
| **How definitions reach clients** | Served as **MCP resources** (`unoverse://` URIs). Clients subscribe; `resources/updated` notifications ARE hot reload — in dev *and* prod. |
| **How the app binds to logic** | The template's `manifest.json` names its **workflow**. The app owns its workflow — clients pull the app; nothing is pushed by name. |
| **How a user message is sent** | `tools/call` on the app's trigger tool. Fire-and-forget — results come back over the component stream, never the call result. |
| **How a form/wizard answers** | Native MCP **elicitation** resolving the held `tools/call` — the agent is literally waiting on the user's answer. |
| **How UI state arrives** | Run-scoped messages (`COMPONENT_INIT/DATA`, `TEMPLATE_DATA`, `WORKFLOW_STATE`) on the MCP **`/stream`**. |
| **How themes arrive** | Served live as MCP resources (`unoverse://theme/<name>`) — never baked into an SDK bundle. |

**The rule:** a host must NEVER hand-roll its own transport — no bespoke REST send, no custom `user_action` message, no side-channel state push. The SDK owns the one interaction path; every consumer (Studio, a native app, an external MCP client) shares it. If your channel needs something the path doesn't do, that's a platform gap to raise — not a workaround to build.

### The two lanes (know which carries what)

| Lane | Carries | Scope |
|---|---|---|
| **MCP `/stream`** | components, template data, workflow lifecycle — everything that renders | **run-scoped** (this conversation, this app) |
| **SDK WebSocket** | audio frames (voice) + global cross-app state | global / native I/O |

Everything you author reads from the first lane. The second lane belongs to native **services** (like voice) — covered in [04 — State](./04-state.md), because it's where "locked" state comes from.

---

## 🎨 The four ways a component renders

Every design component reaches the chat by one of **four paths** — two in the workflow world, two discovered natively from spatial. **Every path ends identically:** the SDK renders your definition into the conversation. Knowing which path you're on tells you *where the data comes from* and *whether a workflow is involved*. (Canonical: `docs/unoverse/UNOVERSE_MCP_TEMPLATE_PROTOCOL.md` §"The four ways UI reaches the chat".)

| # | Way to render | Where the data comes from | Workflow? |
|---|---|---|---|
| **A** | **Template app** — you bind a workflow to a template; the workflow drives the whole surface (the app shell — `binding` in the manifest, [05](./05-templates.md)). | the bound workflow | ✅ |
| **B** | **Self-contained component app** — the component **is its own MCP app** (a tool + `ui://`); spatial surfaces it, the agent reacts natively, and the SDK renders it **as-is**. It carries its own `state`. | the component itself | ❌ |
| **C** | **Node-hydrated component** — a spatial **data node** carries an assigned component **URI** (a card shell); on discovery the node **hydrates** that component with its data and the SDK renders the filled card. | a spatial data node | ❌ |
| **D** | **Streamed component** — a workflow node emits `COMPONENT_INIT`/`DATA` mid-run and the component **streams in** (the classic runtime paint path for **A**). | the running workflow | ✅ |

**Two worlds:**
- **A + D — the workflow world.** Assign a workflow; it drives the surface (A) and streams its pieces in (D). Streaming is the standard runtime paint path, not a legacy one.
- **B + C — the native-MCP-from-spatial world.** The component is **discovered**, not pushed. **B** carries its own data; **C** is a reusable card shell a spatial node fills.

**The one rule that keeps B + C pure:** a component is never a callable primitive. The discovered unit is a standard **MCP app** (a tool with a `ui://` resource); the agent does an ordinary `tools/call`, the result carries the UI, and the **SDK** renders it. Nothing component-specific is invented.

**This axis is orthogonal to *presentation*.** The four ways are only *how the data arrives*. Once a component is in the store — by **any** of the four — how it's **shown** is the **reaction contract**: the component carries its **own `defaultState`** and owns its faces (`inline`, `focused`, `product`, …); a **template reacts** to that state via a `ComponentSlot.select.where` surface and frames the matching face — it never reaches into the component. So a **streamed (D)** product card can write `defaultState: "product"` and a chat template's `product` surface frames it, exactly the same way a **self-contained (B)** one would. Which of the four delivered it, and how a template presents it, are independent choices — see [04 — State](./04-state.md).

---

## 🔁 One path, dev and prod

Studio is **not a special harness**. It is just another MCP client: it subscribes to the same definition resources, receives the same component stream, and runs the same native renderers as production channels. That's why:

- "Works in Studio" provably means "works in production."
- Hot reload in Studio is the same `resources/subscribe` mechanism that live-updates production channels.
- Live mode in Studio is literally production, pointed at local renderers.

---

**Next:** coming from React or Flutter? Read the [02a translation table](./02a-coming-from-react.md) first. Then [03 — Components](./03-components.md) — composition, props, and reuse.
