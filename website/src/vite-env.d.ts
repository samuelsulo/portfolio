/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * URL of the contact form backend (AWS API Gateway endpoint), configured
   * once the Lambda + SES stack described in `contactService.ts` is
   * provisioned. Left unset in every environment until then.
   */
  readonly VITE_CONTACT_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
