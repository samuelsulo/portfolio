/**
 * Shapes for the data-driven content loaded from `src/data/*.json`.
 *
 * These files intentionally hold only non-translatable data (ids, icon
 * names, technology tags, image paths, URLs). All prose meant to be read in
 * both languages (titles, descriptions) lives in the i18n locale files under
 * `translationKey`, per the project's i18n content rule.
 */

export interface ServiceItem {
  id: string
  icon: ServiceIconName
  technologies: string[]
  translationKey: string
}

export type ServiceIconName = 'cloud' | 'code' | 'infrastructure' | 'security'

export interface ProjectItem {
  id: string
  image: string
  imageAlt: string
  technologies: string[]
  url: string | null
  translationKey: string
}

export interface SiteConfig {
  email: string
  phone: string | null
  location: string
  social: {
    github: string
    linkedin: string
  }
  availableForWork: boolean
}
