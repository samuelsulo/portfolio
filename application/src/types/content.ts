/**
 * Shapes for the data-driven content loaded from `src/data/*.json`.
 *
 * These files intentionally hold only non-translatable data (ids, icon
 * names, technology tags, image paths, URLs). All prose meant to be read in
 * both languages (titles, descriptions) lives in the i18n locale files under
 * `translationKey`, per the project's i18n content rule.
 */

/** Whether a work was made for a real client or is a demonstration project. */
export type WorkKind = 'client' | 'demo'

/** The kinds of material a work can show, each labelled in `projects.materials.<id>`. */
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
  imageAlt: string
  materials: MaterialId[]
  technologies: string[]
  url: string | null
  translationKey: string
}

export interface StackGroup {
  id: string
  items: string[]
  translationKey: string
}

export interface HudRow {
  id: 'region' | 'infrastructure' | 'applications'
  value: string
}

export interface SiteConfig {
  email: string
  phone: string | null
  location: string
  social: {
    github: string
    linkedin: string
  }
  /** Public link to the CV (for example on Google Drive); the CV button is hidden when null. */
  cvUrl: string | null
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
