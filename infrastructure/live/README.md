# Live

Where things are deployed: one folder per AWS account, and in each region one
`terragrunt.stack.hcl` that instantiates the stacks of [`../catalog/stacks/`](../catalog/stacks)
with the values of that account.
[`root.hcl`](./root.hcl) is included by every stack and stays identical
across all of them; everything that differs lives in the folder
hierarchy below.

## Structure

```
live/
├── root.hcl                             # shared provider + backend config, included by every stack
└── <account name>/                      # workload-prod, sandbox
    ├── account.hcl                      # aws_account_id, aws_profile, account_name
    ├── _global/                         # account-wide services (budgets, route53, ...)
    │   ├── region.hcl                   # fixed to us-east-1
    │   └── terragrunt.stack.hcl         # one `stack` block per catalog stack, when there is one
    └── <region>/                        # e.g. eu-south-1
        ├── region.hcl                   # aws_region(_short)
        └── terragrunt.stack.hcl         # one `stack` block per catalog stack
```

### `_global`

Resources that exist once per account (AWS Budgets, Route53, IAM, ...)
live in `<account name>/_global/` instead of under a region. They still
need a provider region, so `_global/region.hcl` pins `us-east-1`, the
canonical API region for these services. `find_in_parent_folders()`
picks the closest `region.hcl`, so `root.hcl` needs no special case and
the state key gets its own `_global` segment.

Each account of the landing zone has its own top-level folder, named after the
account (`workload-prod`, `sandbox`), and `account.hcl` defines it. The IDs of
the accounts are not in the repository, which is public: `account.hcl` reads them
from the environment (see [`../README.md`](../README.md#prerequisites)). `account.hcl` and `region.hcl` each declare a single
`locals` block; `root.hcl` reads both via `find_in_parent_folders()`
and exposes them (plus the values it derives from them, like the state
bucket name and `default_tags`) to every unit instantiated below.

## `root.hcl`

Generated once per stack, included by every `terragrunt.stack.hcl` below
it. Responsible for what units must not configure themselves:

- Generates the AWS `provider` block for the region in `region.hcl`
  and the profile in `account.hcl`, with `allowed_account_ids` set as a
  guard against applying to the wrong account, and the mandatory
  `default_tags` applied to every resource automatically. There is one
  provider per stack: resources that must live in `us-east-1` (e.g. the
  ACM certificate for CloudFront) go in a `_global` stack.
- Configures the S3 `remote_state` backend, with a state key derived
  from the account ID, `project` and the stack path, so every unit
  gets its own state file without repeating backend config anywhere.

### State bucket

The state of every stack is kept in the state bucket of the organization,
`awslz-tfstate-<devops account id>-<region>-an`, which the landing zone
creates. The key is `<account id>/portfolio/<region>/<stack>/terraform.tfstate`.
The bucket policy lets an account write only the keys that start with its own ID, so the
backend needs no role.

### Name prefix

`root.hcl` sets `name_prefix` to the project (`portfolio`), the base of every
resource name. Units read it from `include.root.locals` and build each resource
name from it, adding their own suffix where the scope requires it (e.g. an S3
bucket with the `-an` suffix, which requires account and region). It is not
passed to modules as an `input`.

## Stacks

`live/<account>/<region>/terragrunt.stack.hcl` has one `stack` block per deployable,
pointing at a stack of [`../catalog/stacks/`](../catalog/stacks) and giving the values
listed in its README:

```hcl
stack "website" {
  source = "${dirname(find_in_parent_folders("root.hcl"))}/../catalog/stacks/website"
  path   = "website"

  values = { ... }
}
```

`path` becomes a segment of the state key, `<account id>/portfolio/<region>/<path>/<unit>/`.
Never rename it: a different key makes OpenTofu see an empty state.

## Adding a Stack

Write it in [`../catalog/stacks/`](../catalog/stacks), then add a `stack` block for it to
`<account>/<region>/terragrunt.stack.hcl`. A new account or region gets its `account.hcl` or
`region.hcl` by copying an existing one.

## Usage

Run from the account and region folder that holds the `terragrunt.stack.hcl`:

```
cd live/<account>/<region>
terragrunt stack run plan
terragrunt stack run apply
```

`mise.toml` pins the `opentofu` and `terragrunt` versions used across the
project and sets `TG_OUT_DIR`, so `plan` saves its plan files under `.plans/`
in that folder and `apply` runs only those saved plans (with
`-auto-approve`): review the plan before applying, and run `plan` again if
the state changed in the meantime.

`plan` and `apply` initialize the unit on their own. Running
`terragrunt init` directly with `TG_OUT_DIR` set fails, because the plan
path is passed to `tofu init` as well: unset it for that command
(`env -u TG_OUT_DIR terragrunt init`).
