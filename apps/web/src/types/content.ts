import type { IconName } from '@/components/ui/AppIcon.vue'

/**
 * Shapes for the data-driven content loaded from `public/content/data/*.json`.
 *
 * These files intentionally hold only non-translatable data (ids, icon
 * names, technology tags, image paths, URLs). All prose meant to be read in
 * both languages (titles, descriptions) lives in the i18n locale files under
 * `translationKey`, per the project's i18n content rule.
 */

/** Whether a work was made for a real client or is a demonstration project. */
export type WorkKind = 'client' | 'demo'

/** The kinds of material a work can show on its card, each labelled in `projects.materials.<id>`. */
export type MaterialId =
  | 'logo'
  | 'businessCard'
  | 'reviewSign'
  | 'website'
  | 'webapp'
  | 'ecommerce'
  | 'design'
  | 'onlinePresence'
  | 'architecture'

export interface ProjectItem {
  id: string
  kind: WorkKind
  image: string
  /** The screenshot of the site of the work, shown by the 3D gallery. */
  screenshot: string
  imageAlt: string
  materials: MaterialId[]
  technologies: string[]
  url: string | null
  translationKey: string
}

export type CaseGroupId =
  'brand' | 'print' | 'application' | 'design' | 'quality' | 'infrastructure' | 'visibility'

/** An image of a case. `alt` is an i18n key, never literal text. */
export interface CaseImage {
  src: string
  alt: string
}

/** A file the viewer links to. `label` is an i18n key, never literal text. */
export interface CaseDocument {
  src: string
  label: string
}

export type SwatchId = 'background' | 'surface' | 'text' | 'brand' | 'accent' | 'accentAlt'

export type CaseBlock =
  | { type: 'images'; images: CaseImage[]; tone?: 'warm' | 'dark' }
  | { type: 'devices'; desktop: CaseImage; tablet: CaseImage; phone: CaseImage; url: string }
  | {
      type: 'design'
      swatches: { id: SwatchId; color: string }[]
      fonts: { role: 'headings' | 'body' | 'data'; family: string }[]
    }
  | { type: 'facts' }
  | { type: 'diagram'; owner: 'client' | 'own' }
  | {
      type: 'cards'
      cards: { id: string; icon: IconName; image: CaseImage | null }[]
    }

/**
 * One material of a case, shown as a tab of the viewer. Its label is
 * `cases.tabs.<id>`, its group label `cases.groups.<group>` and each fact is
 * `cases.items.<case>.materials.<id>.facts.<fact>` with a `label` and a `value`.
 * An optional `document` adds a download button under the facts.
 */
export type CaseMaterial = {
  id: string
  icon: IconName
  group: CaseGroupId
  facts: string[]
  document?: CaseDocument
} & CaseBlock

export interface CaseData {
  /** Header facts, each `cases.items.<case>.meta.<id>` with a `label` and a `value`. */
  meta: string[]
  materials: CaseMaterial[]
}

export interface StackItem {
  label: string
  /** Name of an SVG in `stack-icons/` (without extension, see `npm run stack-sprite`), when the item has a logo. */
  icon?: string
  /** Keeps the original colors of the SVG instead of tinting it with the text color. */
  colored?: boolean
}

export interface StackGroup {
  id: string
  items: StackItem[]
  translationKey: string
}

export interface CertificationItem {
  id: string
  /** The body that issued the certification (a proper name, not translated). */
  issuer: string
  /** Whether the certification is still valid, shown as a labelled pill on the card. */
  status: 'active' | 'expired'
  /** The badge image. */
  image: string
  /** i18n key of the badge's alt text. */
  imageAlt: string
  /** Public verification page, e.g. on Credly. */
  url: string
  translationKey: string
}

export interface HudRow {
  id: 'region' | 'infrastructure' | 'applications'
  value: string
}

export interface SiteConfig {
  /** Version of the content shape, checked against `CONTENT_SCHEMA_VERSION` when the content is loaded. */
  schemaVersion: number
  email: string
  phone: string | null
  location: string
  social: {
    github: string
    linkedin: string
  }
  /** CV PDFs published with the site, one per language; the CV button is hidden when null. */
  cvUrl: { it: string; en: string } | null
  /** Technical readouts shown next to the portrait in the hero; labels live in `hero.hud.<id>`. */
  hud: HudRow[]
  availableForWork: boolean
  legal: SiteLegalConfig
}

/**
 * Data referenced by the Privacy Policy (see LegalPolicyView.vue and the
 * `legal.privacyPolicy.content` i18n message, which interpolates these as
 * named params), kept here rather than hardcoded in the translation files
 * since it's identical in every language, per the project's i18n content
 * rule. Legal specifics that aren't yet confirmed are stored as explicit
 * `{{TODO: ...}}` placeholder strings, never invented.
 *
 * `contactFormRetentionMonths` is a plain number rather than a sentence
 * (unlike the other fields here) so it stays language-neutral: the actual
 * wording ("retained for N months" / "conservati per N mesi") lives in the
 * translated `legal.privacyPolicy.retentionPeriodKnown` message in each
 * locale, not in this data file. `0` is a real, meaningful value here (not
 * a placeholder): it states that submissions aren't stored in any
 * database/archive by the site at all, which `LegalPolicyView.vue` renders
 * via the `retentionPeriodNone` message instead of `retentionPeriodKnown`.
 * Confirm this figure against how the contact form backend actually works
 * (e.g. `infrastructure/modules/vendor/contact-api`) rather than assuming;
 * for this project, API Gateway calls SES directly with no Lambda/database
 * in between, so 0 is accurate for the site's own application-level
 * storage. It doesn't cover retention by AWS's own infrastructure logging
 * (e.g. CloudTrail management events), which is a separate consideration
 * (see the Privacy Policy's own discussion of this, if present).
 */
export interface SiteLegalConfig {
  privacyContactEmail: string
  businessDetails: string
  dataProcessingRegion: string
  contactFormRetentionMonths: number
  privacyPolicyLastUpdated: string
}
