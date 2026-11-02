/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the `contact_api` module's custom domain (e.g.
   * "https://contact.samuelsulo.it"), injected at build time by
   * `scripts/deploy.sh` from the outputs of the website stack in
   * `infrastructure/live`. See `contactService.ts` for the operation path
   * appended to it. Left unset if the module hasn't been applied yet in the
   * target environment.
   */
  readonly VITE_CONTACT_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
