# Custom nodes

This folder is where **your own** custom nodes live. It starts empty.

Platform packages are **not** shipped here as source. Core packages (like the
component-node bridge that turns your `rx/` definitions into canvas nodes) and
marketplace nodes (OpenAI, AWS, and the rest) are published to the
`@unoverse-platform` npm scope and installed at runtime; the core set installs
itself on first boot. Your local source here always takes precedence over an
installed npm copy of the same package.

To author a custom node, create a folder here with a `package.json` named
`@unoverse-platform/<your-node>` that depends on `@unoverse-platform/plugin-base`,
build it with `./unoverse build`, and it is discovered on the next start.
