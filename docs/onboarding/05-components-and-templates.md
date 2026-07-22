---
sidebarTitle: "5. Components and Templates"
title: "Components and Templates"
---

Design the interfaces your Agents speak through. UI on unoverse is **data, not code**: a component is a JSON definition, rendered natively on every platform by the SDK. No React, no CSS, no rebuild.

This challenge is a build, not a theory tour:

| | |
| --- | --- |
| **What you'll build** | Your org and its theme, plus a price card component your Agent can stream data into |
| **Where it lives** | `apps/unoverse/rx/orgs/<your-org>/components/pricecard/` |
| **Where you'll see it** | Live in **Studio** while you design; in the conversation once wired to a workflow |

This approach is called **SDUI**, server-driven UI. The interface is served as data, and each channel's native SDK renders it. One definition renders on your website, in your mobile apps, and on every channel you connect; publish a change and it is live on all of them at once, with no release cycle. [This introduction to SDUI](https://medium.com/digia-studio/server-driven-ui-sdui-the-necessary-evil-for-scalable-mobile-apps-80c650a2c8de) covers the pattern and why it scales; [SDUI and MCP Apps](../design/02-sdui-and-mcp-apps.md) explains how it works here.

Definitions are composed from a [small closed set of primitives](../design/02-sdui-and-mcp-apps.md#the-closed-primitive-set), and every visual value is a token name resolved by the theme. That's all the theory this page needs; the **Design** tab of these docs is the full journey, from [Quick Start](../design/01-quick-start.md) through components, state, templates, and tokens.

<Note>
**MCP Apps are the future, and you are designing for it now.** [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview) are interactive apps that run inside AI clients like ChatGPT and Claude. unoverse is native MCP, so every interface you design here is served as an MCP app. As new channels adopt the standard, your designs already work there.
</Note>

## Build it

<Steps>
<Step title="Open Studio">

**Studio** runs with the platform at http://localhost:3002. Open **Components**: every definition renders from its prop defaults, and the controls walk its layouts and states. This is where you'll live while designing.

</Step>
<Step title="Create your org">

Your own work lives in your org: its components, its apps, its brand. One command sets it up:

```bash Create your org
unoverse new org acme
```

You get `rx/orgs/acme/` with `components/`, `templates/`, and a complete copy of the default token set in `styles/`, self-contained and ready to rebrand.

</Step>
<Step title="Make your theme">

The first design work in a new org is the brand. It lives in `rx/orgs/acme/styles/`:

| Folder | What you set there |
| --- | --- |
| `base/` | The raw scales: color palettes, typography and fonts, spacing, radius |
| `semantic/` | The names components use, mapped onto your scales |
| `themes/` | `light` and `dark`: the values each theme resolves to |

Start with `base/color.json` and `base/typography.json`: your palette and your fonts. In **Studio**, switch to your org and change a value. Every component re-renders in your brand, live, with no build step. That loop, edit JSON and watch it render, is the whole design workflow.

Change token values freely; keep every token name, and the theme contract stays green.

</Step>
<Step title="Create your own component">

Author your component in your org, at `rx/orgs/acme/components/pricecard/`. Start from the closest existing component's shape. Declare every field the workflow will fill in `props` with a realistic `default`; those defaults are what **Studio** renders in mock mode. Compose the layout from the closed set of primitives.

</Step>
<Step title="Lint it">

```bash Check your definition
unoverse lint
```

The linter enforces the design rules with doc-cited messages: token names only (no raw px or hex), every bound field declared in `props`, one home for every piece of state. **Studio** and the platform apply the same rules, so a clean lint means it ships.

</Step>
<Step title="Put it in a workflow">

New components register as nodes at boot:

```bash Load the new node
docker compose restart unoverse
```

Then, exactly as in [Create Your First Agent](./02-create-your-first-agent.md): open your component in **Studio**, click **Copy for Canvas**, and paste it into a workflow. Wire data into it and your design renders live in the conversation.

</Step>
</Steps>

<Note>
Restarts are only for **new** components, because the platform synthesizes a node per definition at boot. Edits to existing components apply live.
</Note>

## Have Claude Code build it

<div className="skill-callout">
<img className="skill-logo" src="/images/onboarding/claude-logo.png" alt="Claude" />
<div className="skill-eyebrow">Claude Code skill · ships with your repo</div>
<div className="skill-title">/unoverse-create</div>

The same skill that builds nodes designs components. Open your repo in Claude Code and describe what you want:

> Create a pricing card component with a title, three feature lines, and a call to action.

The skill follows the authoring rules, builds the definition in layers, lints it, and walks the deploy loop, so what it produces passes the same checks your own work does.

</div>

## Next steps

<Card title="The Design journey" icon="palette" href="../design/01-quick-start.md" horizontal>
Components, state, templates, and tokens, in full depth.
</Card>

<Card title="Create an MCP" icon="plug" href="./06-create-a-mcp.md" horizontal>
Expose your Agent to ChatGPT and every MCP client.
</Card>
