# Stacks

One reusable set of units per deployable, in `<name>/terragrunt.stack.hcl` with a README that
lists its `values`. A stack wires units with `unit` blocks, passes its own `values` through and
holds no account, region or literal identifier: those come from the `stack` block in
`live/<account>/<region>/terragrunt.stack.hcl` that instantiates it.

| Stack | Units |
|---|---|
| [`website`](./website) | `website-hosting`, `contact-api` |

To add one, copy `website/`, change its units and values, then add a `stack` block for it in
the account and region that use it. The block's `path` becomes a segment of the state key.
