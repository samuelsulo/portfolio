# Component snapshot

`Kitsune.vue` in this folder is a **read-only, byte-for-byte snapshot** of the
live component, kept here so the graphic design documented in
[../README.md](../README.md) is traceable to an exact copy of the source it
was extracted from, without requiring anyone reading `docs/` to also check
out the website source.

- **Source of truth**: [`website/src/components/ui/Kitsune.vue`](../../../website/src/components/ui/Kitsune.vue).
  If the two ever diverge, the website copy wins; refresh this snapshot to
  match it rather than editing this one directly.
- **Not imported anywhere.** This file is not part of the Vite build, has no
  effect on the running site, and is excluded from `website/`'s TypeScript
  and ESLint project by virtue of living outside `website/`.
- **Design history**: the component was introduced in a single commit
  (`feat(website): add version and signature components`, 2026-09-03) and its
  visual design (geometry, proportions, facets) has not changed since. It was
  renamed from `SignatureFox.vue` to `Kitsune.vue` during this documentation
  pass (see [../versions/](../versions/README.md)); the rename only touched
  identifiers (file name, component name, internal CSS class names), not the
  SVG markup, the `viewBox`, the polygon geometry, or any color value.
