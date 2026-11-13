# Scripts

Helpers behind the git hooks and the CI. Every script in this folder is listed here, in the same
change that adds, removes or renames it.

| Script | Purpose |
|---|---|
| [`check-style.sh`](./check-style.sh) | Fails on an em dash in a text file and on a new file or folder that is not kebab-case. `--staged` for the git hook, `--all` for audits. Copied from `template-project`: change it there |
