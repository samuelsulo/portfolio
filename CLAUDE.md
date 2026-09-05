# CLAUDE.md: Project guardrails

This file instructs whoever works on this repository (human or AI assistant)
on how to operate within this project. It applies to **every client**: the
structure, conventions and rules are standard and must not be reinvented
project by project. If a client request seems to require deviating from
these rules, stop and flag the deviation instead of proceeding on your own
(see "Changes that require manual review").

## 1. What this project is

The AWS infrastructure template for my client projects, managed with
Terraform: typically a small local client (restaurant, bar, shop, service
business) who needs an online presence or basic AWS infrastructure,
regardless of what runs on top of that infrastructure. This repository
contains, by default, Terraform infrastructure and documentation, with
automation handled by the [kitsu](https://github.com/samuelsulo/kitsu)
CLI: any client application code (website, app, other) must be
added based on the client's project type. The project is **single-delivery**:
at the end, the client receives complete infrastructure and documentation
and becomes autonomous. It is not a SaaS platform, has no multi-tenancy, no
client-management dashboard, and no permanent hosting in my AWS account.

Model: `client -> project -> development -> testing -> delivery -> closure`.

## 2. Architecture

```
MY AWS ACCOUNT (development/sandbox)
      |
      | AssumeRole (cross-account, time-limited/revocable)
      v
CLIENT AWS ACCOUNT (production, owned by the client)
      |
      +-- AWS infrastructure release
      +-- release of the application requested by the client (e.g. website)
```

Fixed architectural rules:

- Production lives **exclusively** in the client's AWS account, never in
  mine.
- Development and testing happen in my account, in a sandbox environment
  isolated per client, deletable after delivery.
- Access to the client happens only via a cross-account role
  (`AssumeRole`), never with root or permanent IAM credentials.
- The client must be able to revoke my access autonomously at any time
  (removal/modification of the cross-account role).
- The infrastructure stack depends on the type of application requested by
  the client.

## 3. Technology stack

- **Infrastructure**: Terraform (latest stable version, official AWS
  provider). No CloudFormation, CDK or Pulumi: a single tool, for
  consistency across all client projects.
- **Frontend**: Vue 3 + TypeScript + Vite. Composition API (`<script setup>`), no Options API in new code.
- **Internationalization**: vue-i18n (Composition API, `useI18n`), the only translation management tool in every project. Default language: Italian (`it`); second language: English (`en`). Do not introduce other languages or other translation management tools without an explicit client request.
- **Styling**: CSS scoped in components or shared CSS variables in `src/styles/`. Avoid introducing heavy CSS frameworks (Tailwind, Bootstrap...) unless explicitly requested: most of these sites are a handful of pages and don't justify the dependency.
- **Package manager**: npm (consistency across projects, avoid mixing yarn/pnpm between different clients without reason).

## 4. Repository structure

```
client-project/
├── infrastructure/
│   ├── modules/
│   │   ├── vendor/           # 1:1 copies from terraform-aws-catalog, never modified
│   │   └── local/            # modules written for this project
│   ├── live/                 # root module: composes the modules
│   └── environments/
│       ├── sandbox/          # backend + variables for the development environment
│       └── production/       # backend + variables for the production environment
├── docs/
│   ├── architecture/         # diagrams and architectural decisions
│   └── functional/           # functional documentation
│   └── technical/            # technical documentation
├── .githooks/                # versioned git hooks (commit-msg, pre-commit)
├── README.md                 # project README
└── CLAUDE.md                 # directives for claude
└── mise.toml                 # mise manages the project's tools, including kitsu
├── website/                  # Vue.js/TypeScript/Vite source
├── tests/
│   ├── unit/
│   └── e2e/
```

Do not move or rename these top-level folders: the documentation and
infrastructure assume this structure. The Terraform workflow, module
vendoring, environment scaffolding, git hooks installation and website
deployment that used to live in `scripts/` and `infrastructure/Makefile`
are handled by [kitsu](https://github.com/samuelsulo/kitsu), a personal
CLI tool installed via `mise` (see `mise.toml`): see its README for the
full command reference.

## 5. Terraform rules

- Every AWS resource goes through a module in `infrastructure/modules/`. Do
  not write "inline" resources in `live/` or `environments/` if a module
  already exists (or it makes sense to create one).
- `infrastructure/modules/` has two subfolders, one for each allowed source
  of a module:
  - `modules/vendor/`: copied from `terraform-aws-catalog`, when a catalog
    module covers the needed scope. Its code is copied into the project the
    moment it's needed. Never a remote Git `source` pointing at the
    catalog, not even in development: the project must be self-sufficient
    from the first commit, not only at delivery.
  - `modules/local/`: a new module, written for this project, when no
    catalog module covers the scope and the need isn't generic enough to
    justify adding a module to the catalog.
- A module in `modules/vendor/` **must never be modified** in the client
  project: it stays a 1:1, byte-for-byte copy, to remain traceable and
  aligned with the catalog version. In `terraform-aws-catalog` each module
  is tagged individually (`<module-name>/vX.Y.Z`, never a single tag for
  the whole repo), so a breaking change in one module doesn't bump the
  version of unrelated modules too. The catalog is explored and copied with
  `kitsu terraform catalog list`, `kitsu terraform catalog versions <name>`
  and `kitsu terraform catalog vendor <name> <tag>` (see the
  [kitsu README](https://github.com/samuelsulo/kitsu)), which also
  generates `VENDORED.md` next to the module's files with source, module
  name, tag, commit and copy date: provenance lives there, never in a
  comment inside the module's code. If a catalog module doesn't cover exactly the requested
  scope, it must not be adapted in `modules/vendor/`: multiple catalog
  modules are combined in `live/`, or (if the scope is generic) a new
  module is added to the catalog itself; only if the need is truly
  specific to this client is a new module written in `modules/local/`.
- `environments/sandbox` and `environments/production` must remain
  symmetric: same variables, same modules (through the same `live/`),
  different values. If production diverges structurally from sandbox, it's
  a change that requires manual review.
- **Never** commit: AWS credentials, access keys, secrets, `.env` files
  with real values, `terraform.tfstate` or `.tfvars` with sensitive data.
- The Terraform state backend must be configured separately for each
  project (e.g. S3 backend in my account for sandbox, S3 backend in the
  client's account for production) and never left local in a delivered
  repo.
- Every resource must have at least the tags: `Project`, `Environment`, 
  `ManagedBy = "terraform"`.
- AWS Budgets is mandatory in every production environment, with an alert
  threshold agreed with the client.
- Before every `apply` in production, there must have been a `plan`
  reviewed by me, not just by the AI assistant: see section 9.
- `terraform validate` and a clean `terraform plan` are a mandatory part of
  the deploy process, not optional, for every environment before the
  apply.

## 6. Security

- No credential, key or secret in plain text in the repository, in any
  commit, not even in the history.
- The cross-account role must be used for access to the client's account.
- MFA is mandatory on the client's root account (verified during the setup
  call) and on my AWS account.
- HTTPS is mandatory everywhere, no public endpoint over plain HTTP.
- Hosting S3 buckets are never made public directly: access only through
  CloudFront (Origin Access Control).
- No personal data of the client (email, contact form) is stored or
  processed outside the client's own infrastructure without their explicit
  consent.

## 7. Deployment rules

- Mandatory flow: development in sandbox -> testing -> internal review ->
  `AssumeRole` into the client account -> deploy to production ->
  validation -> handover.
- No direct deploy to production without sandbox having been validated.
- Every deploy to production is tracked (log of what was applied, when,
  with which code/Terraform state version).
- After delivery, the sandbox environment for that client must be torn
  down (avoid residual costs on my side).

## 8. Mandatory documentation

Every project, before closure, must have in `docs/`:

- Functional documentation (what the project does, for whom, contents)
- Technical documentation (stack, how to develop/extend the code)
- Architectural documentation with pictures of the diagrams
- Deployment guide (how to deploy from scratch)
- Operational guide (how to update content, monitor costs, manage the
  domain)
- Handover documentation (in `docs/handover/`): delivery checklist,
  transferred accesses, what the client now owns

The documentation must be updated **on every relevant change** to the code
or infrastructure, not only at the end. If you generate or modify code that
makes part of the documentation outdated, update that documentation in the
same change.

## 9. Changes that require manual review

Stop the work and explicitly flag it before proceeding if a request implies
any of the following:

- Modifying the cross-account role's permissions (widening them)
- Any direct `terraform apply` on `environments/production`
- Introducing user authentication, restricted areas, e-commerce/payments
- Changing the hosting model (e.g. moving from static to server-rendered)
- Anything that moves the project closer to a SaaS/multi-tenant model with
  centralized management of multiple clients in the same account or stack

In these cases: propose the solution, explain why it falls outside the
standard scope, and wait for explicit confirmation before implementing.

## 10. General conventions

- **No reference to the generative AI tool used to develop.** Source code,
  comments, variable/resource names, configuration files, Markdown content
  (README, `docs/`), commit messages and any content published for the
  client must never name the AI tool (or vendor) used, nor otherwise
  signal that part of the project was AI-generated. The repository is
  delivered to the client as ordinary development work: whoever receives
  it must not be able to infer which tools were used internally. The only
  technical exception is the name of this file (`CLAUDE.md`), imposed by
  the development tool itself and not renameable without losing its
  automatic recognition.
- **Language**: source code, comments, `description` of variables/outputs,
  error messages, configuration files (Terraform, CI, etc.), commit
  messages, scripts, and every `.md` file in the repository (README,
  `docs/`) are always in English. The one exception is the website's own
  content, which stays bilingual per section 3: Italian as the default
  language, with an English switch. In every case, technical terms without
  a natural translation (AWS, S3, Terraform, CloudFront, deploy, etc.) stay
  in English regardless.
- **Punctuation**: never use the em dash (`—`) in any text in the
  repository, including code, comments, commit messages, content published
  for the client and `.md` files. Always prefer correct punctuation for the
  context: comma, period, colon, semicolon, or a short hyphen with spaces
  (` - `) for asides.
- Commit messages in English, imperative, conforming to
  [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat(infrastructure): add contact form validation`, not `added stuff`),
  checked by a local git hook (`.githooks/commit-msg`). After every clone,
  run `kitsu hooks install` once, which also installs
  `.githooks/pre-commit` (formats only the Terraform files already staged,
  via `kitsu terraform fmt-staged`, never the whole tree) and `.githooks/post-commit`
  (restores any unstaged changes temporarily set aside during formatting),
  so a commit never goes in with unformatted Terraform.
- File/folder names in kebab-case.
- Terraform variables and outputs always documented with a `description`.
- Every Terraform module has its own `README.md` with the main
  inputs/outputs.
- No TODOs left in delivered code: either resolve them, or document them
  in `docs/` as separately billable future work.

## 11. Frontend rules

- Small, focused components: one page section = one component when it
  makes sense, not hundred-line monoliths.
- TypeScript strict mode enabled (the template's `tsconfig.json` should not
  be loosened without reason).
- Basic accessibility is mandatory: semantic markup, `alt` on images,
  adequate color contrast, keyboard-navigable forms.
- Performance: optimized/responsive images, no heavy libraries for effects
  that can be done in CSS.
- Basic SEO is mandatory for showcase sites: meta title/description per
  page, Open Graph, sitemap, local structured data (LocalBusiness
  schema.org) when relevant.
- The client's real content (text, images, hours, contacts) lives in a
  single place (e.g. configuration file/lite-CMS), not scattered and
  duplicated across components.
- No interface string (navigation entries, buttons, form labels, status
  messages, section titles) is written directly in component templates or
  scripts: it always goes through `useI18n()` and the `t()` function, with
  the key defined in the translation files (`src/i18n/locales/it.json` as
  the source of truth, `en.json` kept in parallel with the same keys).
- The client's real content that is prose text meant to be read in both
  languages (business name, tagline, descriptions, day/hour labels) also
  lives in the translation files, not in the configuration file: the
  latter only contains non-translatable data or data identical in every
  language (phone, email, address, hours as a numeric range, social URLs).
- The language switcher is always present in the main navigation bar,
  keyboard-accessible, and the user's choice is remembered across visits
  (e.g. `localStorage`).
- Adding a language not covered by this file is a **change that requires
  manual review** (see section 9): as a rule, the project stays limited to
  Italian and English.

## 12. Testing

- **Unit tests** are mandatory for non-trivial logic (composables,
  utilities, form validation). Framework: Vitest.
- **E2E tests**, at a minimum, are mandatory before delivery: homepage
  load, main navigation, contact form submission (if present), basic
  responsive check. Framework: Playwright.
- No delivery to the client without the test suite, however minimal,
  passing.
- Infrastructure tests (Terraform validation: `terraform validate`, clean
  `terraform plan`) are part of the deploy process, not optional.
