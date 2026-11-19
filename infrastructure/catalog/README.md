# Catalog

What this project can deploy. `live/` decides where.

```
catalog/
├── modules/
│   ├── vendor/   # 1:1 copies from the module catalog, never modified
│   └── local/    # modules written for this project
├── units/        # one per AWS competency, a terragrunt.hcl wrapping a module
└── stacks/       # one per deployable, a terragrunt.stack.hcl wiring units
```

- [`modules/`](./modules): the OpenTofu code.
- [`units/`](./units): `website-hosting`, `contact-api`.
- [`stacks/`](./stacks): `website`.

Paths between them are built from `root.hcl`:
`${dirname(find_in_parent_folders("root.hcl"))}/../catalog/...`, so a unit or stack works
from any account folder of `live/`.
