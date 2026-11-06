# Live

Terragrunt stacks: the environment-specific wiring that instantiates
units from [`../units/`](../units) for a given account/region/environment.
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
    │   └── <stack>/terragrunt.stack.hcl
    └── <region>/                        # e.g. eu-south-1
        ├── region.hcl                   # aws_region(_short)
        └── <stack>/                     # e.g. website-hosting
            └── terragrunt.stack.hcl
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
  from `project` and `path_relative_to_include()`, so every stack
  gets its own state file without repeating backend config anywhere.

### State bucket

The state of every stack is kept in the state bucket of the organization,
`awslz-tfstate-<devops account id>-<region>-an`, which the landing zone
creates. The key is `portfolio/<account name>/<region>/<stack>/terraform.tfstate`.
The backend assumes the role `awslz-tfstate-access` of the target account, which
can only reach the keys of that account.

### Name prefix

`root.hcl` sets `name_prefix` to the project (`portfolio`), the base of every
resource name. Units read it from `include.root.locals` and build each resource
name from it, adding their own suffix where the scope requires it (e.g. an S3
bucket with the `-an` suffix, which requires account and region). It is not
passed to modules as an `input`.

## Stacks

A stack (`terragrunt.stack.hcl`) wires up a set of units for its
account and region via `unit` blocks, each pointing its `source`
at a unit under [`../units/`](../units) and supplying the environment-specific
`values` the unit expects (see that unit's `README.md`).

## Adding a Stack

Copy [`../templates/stack/terragrunt.stack.hcl`](../templates/stack/terragrunt.stack.hcl)
to `<environment>/<region>/<stack-name>/terragrunt.stack.hcl`, with a
`unit` block per unit it wires up, each `source` pointing at the unit
under `../units/` and `values` filled in per that unit's `README.md`.
Add `account.hcl`/`region.hcl` first if the environment/region doesn't
exist yet under `live/`, copying them from
[`../templates/`](../templates).

## Usage

Run from the stack's own directory:

```
cd live/<environment>/<region>/<stack>
terragrunt stack run plan
terragrunt stack run apply
```

`mise.toml` pins the `opentofu` and `terragrunt` versions used across the
project and sets `TG_OUT_DIR`, so `plan` saves its plan files under `.plans/`
in the stack directory and `apply` runs only those saved plans (with
`-auto-approve`): review the plan before applying, and run `plan` again if
the state changed in the meantime.

`plan` and `apply` initialize the unit on their own. Running
`terragrunt init` directly with `TG_OUT_DIR` set fails, because the plan
path is passed to `tofu init` as well: unset it for that command
(`env -u TG_OUT_DIR terragrunt init`).
