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
└── <environment>/                       # production: one AWS account per environment
    ├── account.hcl                      # aws_account_id, aws_profile, environment(_short)
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
live in `<environment>/_global/` instead of under a region. They still
need a provider region, so `_global/region.hcl` pins `us-east-1`, the
canonical API region for these services. `find_in_parent_folders()`
picks the closest `region.hcl`, so `root.hcl` needs no special case and
the state key gets its own `_global` segment.

Each environment lives in its own AWS account, so the top-level folder is
named after the environment and `account.hcl` defines both the account
and the environment. `account.hcl` and `region.hcl` each declare a single
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

The S3 bucket named in `root.hcl` (`tfstate-<account-id>-<region>-an`, in
the account-regional namespace) holds the state of every project in the
account and must exist before the first `init`. Create it once per account
with [`state-create-bucket.sh`](../scripts/state-create-bucket.sh):

```
mise run state:create-bucket <aws-profile> [region]
```

The script does nothing if the bucket already exists. See
[`../scripts/`](../scripts) for what it configures.

### Name prefix

`root.hcl` derives `environment_name_prefix` (`<project_short>-<environment_short>`)
from `project_short` and the environment, so names follow one convention
across every unit. Units read it from `include.root.locals` and build each
resource name from it, adding their own suffix where the scope requires it
(e.g. an S3 bucket with the `-an` suffix, which requires account and
region). It is not passed to modules as an `input`.

## Stacks

A stack (`terragrunt.stack.hcl`) wires up a set of units for its
account/region/environment via `unit` blocks, each pointing its `source`
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
