# CLAUDE.md: Project Guardrails

AWS, Terragrunt and OpenTofu rules live in the `aws-terragrunt-standard` skill. If a request seems
to require deviating from these rules, stop and flag it instead of proceeding autonomously.

## How we work

Plan with the AI agent, turn the plan into issues, solve each issue with its own pull request that
closes it, and commit with Conventional Commits (scope from `cog.toml`). The method and the git
strategy are in [`docs/working-method.md`](./docs/working-method.md).

## Rules

- Write code, comments, configuration, commit messages and Markdown in English. Content delivered
  in another language (site copy, i18n files) is the exception.
- Prefer kebab-case for file and folder names, unless the language or framework has its own
  convention, which is then followed.
- Put a `README.md` in every structural folder.
- Never put credentials in the repository or in CI.
- Never use the em dash. Use a comma, period, colon, semicolon, parentheses or ` - `.
- Never mention the AI tool used for development, in code, comments, configuration, commit messages
  or any content delivered, unless the owner explicitly asks for it in a specific case. The only exception is the name of
  this file. No `Co-Authored-By` trailers.
- Never push, tag, force-push or change repository settings without the owner's confirmation.

## Structure

Top-level folders are fixed and are not renamed or moved: `apps/`, `infrastructure/`, `brand/`, `docs/`, `.github/`. The structure of `docs/`
follows the needs of the project. Provider and Terraform rules are in
`infrastructure/CLAUDE.md`, application conventions in [`apps/web/README.md`](./apps/web/README.md).

`brand/` holds the brand assets (palette, logo, business card, fonts, the brand manual); it is not documentation, which is why it lives outside `docs/`.

## Changes that require manual review

Stop and flag before proceeding if a request implies any of the following:

- Introducing user authentication, restricted areas, e-commerce or payments, where not already part
  of the agreed project scope.
- Anything that moves the project closer to a SaaS or multi-tenant model, with centralized
  management of multiple clients in the same account or stack.

In these cases: propose the solution, explain why it falls outside the standard scope, and wait for
explicit confirmation before implementing.

## Versioning

`apps/web`, `infrastructure` and `brand` (as a whole) are versioned independently, each with its own tags (`web/vX.Y.Z`, `infrastructure/vX.Y.Z` and `brand/vX.Y.Z`), managed with
cocogitto (see [`cog.toml`](./cog.toml) and [`README.md`](./README.md)). Tags `application/vX.Y.Z`
were made before the app moved to `apps/web`.
