# Custom nodes

This folder is where **your own** custom nodes live. It ships with exactly one
package: **`components/` — the definition-backed component-node package.** One
universal executor turns every definition in `rx/components/` into a canvas node
at boot (no code generation; edit a definition, restart, it's a node). Don't edit
it — author components in `rx/`.

First-party marketplace nodes (OpenAI, AWS, Pinecone, Slack, …) are **not**
shipped here as source — they are published to the `@unoverse-platform` npm
scope and installed at runtime from **Studio → Nodes**. Your local source always
takes precedence over the installed npm copy.

To author a custom node, create a folder here with a `package.json` named
`@unoverse-platform/<your-node>` that depends on `@unoverse-platform/plugin-base`,
build it, and it will be discovered on the next server start.
