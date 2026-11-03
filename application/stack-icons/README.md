# Stack logos

The SVGs of the logos shown in the stack section, built into `public/images/stack/sprite.svg`
with `npm run stack-sprite` (how it works: [`docs/technical/application.md`](../../docs/technical/application.md#stack-logos-and-badges)).
The file name is the `icon` of an item in `public/content/data/stack.json`.

Sources, so that a new logo looks like the others:

- Brands and tools: [Simple Icons](https://simpleicons.org) (CC0), one color, kept as they are.
- Concepts with no logo of their own (CI/CD, APIs, hooks, ...): [Lucide](https://lucide.dev) (ISC), the stroke icons.
- `terragrunt` keeps its own colors (`colored` in `stack.json`).

Every item of the stack has a logo: when a tool has none, use a Lucide icon that stands for it.
