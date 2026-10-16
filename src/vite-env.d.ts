/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional POST endpoint for project inquiries. When unset, the form falls back to a prefilled email draft. */
  readonly VITE_INQUIRY_ENDPOINT?: string
  /** Public studio contact address used by the inquiry form fallback and footer. */
  readonly VITE_STUDIO_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
