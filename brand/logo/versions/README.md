# Version history

This tracks the history of the Kitsune mark **as implemented in code**: when
it was created, when it changed name, and where it has been adopted. It is
reconstructed entirely from `git log` on this repository; every date and
commit hash below can be verified with:

```
git log --follow -- website/src/components/ui/Kitsune.vue
```

**The graphic design itself has one version.** The polygon geometry, the
`viewBox`, and the badge have not changed since the component was created on
2026-09-03. Nothing below describes a redesign; it describes naming and
adoption changes around that one unchanged graphic. See
[../README.md](../README.md) for why a color retint is likewise not treated
as a new design.

## 2026-09-10 - Renamed to Kitsune, documentation added

- The component and its file were renamed from `SignatureFox.vue` to
  `Kitsune.vue` (`website/src/components/ui/Kitsune.vue`), along with its
  internal CSS class names and custom properties (`.signature-fox` →
  `.kitsune`, `--signature-fox-size` → `--kitsune-size`, etc.). The default
  `label` prop was already `"Kitsune"` before this change; the rename makes
  the file and component name match the name the mark was already given.
- No geometry, color, or behavior change. Consumers (`NavBar.vue`,
  `AppFooter.vue`) were updated to import the renamed component.
- The equivalent template component shipped by the `vue-webapp-standard`
  skill (used to seed every new client project) was renamed the same way,
  so the company-wide standard and this portfolio stay aligned.
- This `docs/logo/` documentation folder, its SVG assets, and
  `logo-design.pdf` were added.
- Not committed as part of this pass (left for the project's own release
  process): a `website/CHANGELOG.md` entry and a tagged release. The
  historical entries in `website/CHANGELOG.md` and
  `docs/business-card/CHANGELOG.md` that refer to `SignatureFox` were left
  untouched, since they correctly describe what the mark was called at the
  time those changes shipped.

## 2026-09-09 - Adopted as the navbar brand mark

- Commit `75f161f` - `feat(website): use SignatureFox mark as navbar brand
  logo`.
- The component itself did not change. `NavBar.vue` replaced a plain "SS"
  text initials mark with this component (`size 44`, `rest-opacity 1`,
  retinted to the portfolio's own dark-theme tokens), so the mark now reads
  as the site's actual logo in the header, not only a quiet footer
  signature.

## 2026-09-03 - Created

- Commit `bd996a1a` - `feat(website): add version and signature components`.
- Original creation of the component (then named `SignatureFox.vue`), with
  the geometry, the optional badge, and the default "reference" colorway
  documented in [../README.md](../README.md). Introduced already wired into
  `AppFooter.vue`.
