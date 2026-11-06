/**
 * Article editor state model (client side).
 *
 * One reducer holds the whole editable document so the editor page does not juggle
 * ~60 independent `useState` hooks. UI-only state (modals, panels) stays in the page.
 * Everything here is pure and unit-tested in `tests/article-editor-state.test.ts`.
 */
import { z } from 'zod'
import type { Locale } from '@/lib/seo/schema'
import { contentToBlocks, type ContentBlock } from './blockEditor'

export type ArticleEditorStatus = 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published'
export type ArticleSchemaType = 'Article' | 'BlogPosting' | 'TechArticle' | 'NewsArticle'

export interface ArticleRobots {
  index: boolean
  follow: boolean
  noarchive?: boolean
  nosnippet?: boolean
}

export interface ArticleSocialOg {
  title?: string
  description?: string
  image?: string
  imageAlt?: string
}

export interface ArticleSocialTwitter extends ArticleSocialOg {
  card?: 'summary' | 'summary_large_image'
}

export interface ArticleDoc {
  title: string
  slug: string
  tagInput: string
  category: string
  author: string
  coverUrl: string
  coverAlt: string
  excerpt: string
  targetKeyword: string
  status: ArticleEditorStatus
  scheduleLocal: string
  publicationDate: string
  locale: Locale
  translationGroupId: string
  isCornerstone: boolean
  focusKeyphrase: string
  relatedKeyphrases: string[]
  seoTitle: string
  metaDescription: string
  canonicalUrl: string
  breadcrumbTitle: string
  schemaType: ArticleSchemaType
  schemaChanged: boolean
  robots: ArticleRobots
  socialOg: ArticleSocialOg
  socialTwitter: ArticleSocialTwitter
  /** Untouched seoData from the server, merged back on save so unknown keys survive. */
  baseSeoData: Record<string, unknown>
  blocks: ContentBlock[]
  rawContent: string
  editorStyle: 'blocks' | 'raw'
}

export interface ArticleEditorState {
  doc: ArticleDoc
  isDirty: boolean
  /** True once the user edited the slug by hand; stops auto-derivation from the title. */
  slugTouched: boolean
}

/** Empty until the editor picks a real category; the API falls back to "Artikel". */
export const DEFAULT_CATEGORY = ''

export function createEmptyDoc(author = ''): ArticleDoc {
  return {
    title: '',
    slug: '',
    tagInput: '',
    category: DEFAULT_CATEGORY,
    author,
    coverUrl: '',
    coverAlt: '',
    excerpt: '',
    targetKeyword: '',
    status: 'draft',
    scheduleLocal: '',
    publicationDate: '',
    locale: 'id',
    translationGroupId: '',
    isCornerstone: false,
    focusKeyphrase: '',
    relatedKeyphrases: [],
    seoTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    breadcrumbTitle: '',
    schemaType: 'Article',
    schemaChanged: false,
    robots: { index: true, follow: true },
    socialOg: {},
    socialTwitter: { card: 'summary_large_image' },
    baseSeoData: {},
    blocks: [{ id: 'b1', type: 'paragraph', text: '' }],
    rawContent: '',
    editorStyle: 'blocks',
  }
}

export type ArticleEditorAction =
  | { type: 'set'; field: keyof ArticleDoc; value: ArticleDoc[keyof ArticleDoc] }
  | { type: 'patch'; patch: Partial<ArticleDoc>; dirty?: boolean }
  | { type: 'setSlug'; slug: string }
  | { type: 'autoSlug'; slug: string }
  | { type: 'updateBlocks'; update: (prev: ContentBlock[]) => ContentBlock[] }
  | { type: 'load'; doc: ArticleDoc }
  | { type: 'restoreLocal'; doc: ArticleDoc }
  | { type: 'markSaved'; patch?: Partial<ArticleDoc> }
  | { type: 'markClean' }

/** Type-safe single-field setter used by the editor's stable `setField` callback. */
export function setFieldAction<K extends keyof ArticleDoc>(field: K, value: ArticleDoc[K]): ArticleEditorAction {
  return { type: 'set', field, value }
}

export function articleEditorReducer(state: ArticleEditorState, action: ArticleEditorAction): ArticleEditorState {
  switch (action.type) {
    case 'set': {
      if (state.doc[action.field] === action.value) return state
      const doc = { ...state.doc, [action.field]: action.value }
      // Changing the schema type must be remembered so the server's schema graph is replaced.
      if (action.field === 'schemaType') doc.schemaChanged = true
      return { ...state, doc, isDirty: true }
    }
    case 'patch':
      return { ...state, doc: { ...state.doc, ...action.patch }, isDirty: action.dirty === false ? state.isDirty : true }
    case 'setSlug':
      return { ...state, doc: { ...state.doc, slug: action.slug }, isDirty: true, slugTouched: true }
    case 'autoSlug':
      if (state.slugTouched || state.doc.slug === action.slug) return state
      return { ...state, doc: { ...state.doc, slug: action.slug } }
    case 'updateBlocks': {
      const blocks = action.update(state.doc.blocks)
      if (blocks === state.doc.blocks) return state
      return { ...state, doc: { ...state.doc, blocks }, isDirty: true }
    }
    case 'load':
      return { doc: action.doc, isDirty: false, slugTouched: true }
    case 'restoreLocal':
      return { doc: action.doc, isDirty: true, slugTouched: true }
    case 'markSaved':
      return { ...state, doc: action.patch ? { ...state.doc, ...action.patch } : state.doc, isDirty: false }
    case 'markClean':
      return { ...state, isDirty: false }
    default: {
      const unreachable: never = action
      return unreachable
    }
  }
}

/** URL slug derived from a title (lowercase, ASCII word chars, hyphen separated). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Resolve `%title%`-style SEO template variables (shared by the page analysis and the SEO inspector). */
export function resolveSeoTemplate(
  text: string,
  vars: { title: string; siteName: string; category: string; now?: Date },
): string {
  if (!text) return ''
  const now = vars.now ?? new Date()
  return text
    .replace(/%{1,2}title%{1,2}/g, vars.title || 'Judul Konten')
    .replace(/%{1,2}sitename%{1,2}/g, vars.siteName)
    .replace(/%{1,2}sep%{1,2}/g, '—')
    .replace(/%{1,2}category%{1,2}/g, vars.category || 'Artikel')
    .replace(/%{1,2}date%{1,2}/g, now.getFullYear().toString())
}

// ---------------------------------------------------------------------------
// Server article -> editor document
// ---------------------------------------------------------------------------

const looseRecord = z.record(z.string(), z.unknown())
const optionalString = z.string().nullish()

/** Shape of `GET /api/articles?slug=` → `article` that the editor reads. Unknown keys pass through. */
export const EditorArticleSchema = z
  .object({
    id: z.union([z.number(), z.string()]).nullish(),
    title: optionalString,
    slug: optionalString,
    updatedAt: optionalString,
    tags: z.array(z.object({ name: z.string() }).passthrough()).nullish(),
    category: z.union([z.string(), z.object({ name: z.string() }).passthrough()]).nullish(),
    author: z.union([z.string(), z.object({ name: z.string().nullish() }).passthrough()]).nullish(),
    coverUrl: optionalString,
    coverAlt: optionalString,
    featuredImage: z.object({ url: optionalString, alternativeText: optionalString }).passthrough().nullish(),
    excerpt: optionalString,
    status: optionalString,
    scheduledAt: optionalString,
    publishedAt: optionalString,
    locale: optionalString,
    translationGroupId: optionalString,
    isCornerstone: z.boolean().nullish(),
    focusKeyphrase: optionalString,
    targetKeyword: optionalString,
    primaryKeyword: optionalString,
    relatedKeyphrases: z.array(z.string()).nullish(),
    metaTitle: optionalString,
    metaDescription: optionalString,
    seoData: looseRecord.nullish(),
    seo: looseRecord.nullish(),
    content: optionalString,
  })
  .passthrough()

export type EditorArticle = z.infer<typeof EditorArticleSchema>

const STATUSES: readonly ArticleEditorStatus[] = ['draft', 'in_review', 'approved', 'scheduled', 'published']
const SCHEMA_TYPES: readonly ArticleSchemaType[] = ['Article', 'BlogPosting', 'TechArticle', 'NewsArticle']

const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const rec = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

/** Map a server article into the editor document. Pure; never throws on missing fields. */
export function articleToDoc(art: EditorArticle, fallbackSlug: string, fallbackAuthor: string): ArticleDoc {
  const seo = rec(art.seo)
  const seoData = rec(art.seoData)
  const keyphrase =
    str(art.focusKeyphrase) || str(art.targetKeyword) || str(seo.focusTopic) || str(art.primaryKeyword) || str(seoData.focusKeyphrase)
  const metaTitle = str(seo.metaTitle)
  const status = STATUSES.find((s) => s === art.status) ?? 'draft'
  const schemaTypeRaw = str(rec(seo.schema).type)
  const schemaType = SCHEMA_TYPES.find((t) => t === schemaTypeRaw) ?? 'Article'
  const robots = rec(seo.robots)
  const content = str(art.content)
  const parsedBlocks = content ? contentToBlocks(content) : []
  const empty = createEmptyDoc(fallbackAuthor)

  return {
    ...empty,
    title: str(art.title),
    slug: str(art.slug) || fallbackSlug,
    tagInput: (art.tags ?? []).map((t) => t.name).join(', '),
    category: (typeof art.category === 'string' ? art.category : art.category?.name) || DEFAULT_CATEGORY,
    author: (typeof art.author === 'string' ? art.author : art.author?.name) || fallbackAuthor,
    coverUrl: str(art.coverUrl) || str(art.featuredImage?.url),
    coverAlt: str(art.featuredImage?.alternativeText) || str(art.coverAlt),
    excerpt: str(art.excerpt),
    targetKeyword: keyphrase || (metaTitle ? (metaTitle.split('—')[0] ?? '').trim().split(' ').slice(0, 3).join(' ') : ''),
    status,
    scheduleLocal: art.scheduledAt ? toLocalDateTimeInput(art.scheduledAt) : '',
    publicationDate: str(art.publishedAt),
    locale: art.locale === 'en' ? 'en' : 'id',
    translationGroupId: str(art.translationGroupId),
    isCornerstone: Boolean(art.isCornerstone),
    focusKeyphrase: keyphrase,
    relatedKeyphrases: art.relatedKeyphrases
      ?? (Array.isArray(seoData.relatedKeyphrases) ? seoData.relatedKeyphrases.filter((k): k is string => typeof k === 'string') : []),
    seoTitle: str(art.metaTitle) || metaTitle,
    metaDescription: str(art.metaDescription) || str(seo.metaDescription),
    canonicalUrl: str(seo.canonicalUrl),
    breadcrumbTitle: str(seo.breadcrumbTitle) || str(seoData.breadcrumbTitle),
    schemaType,
    schemaChanged: false,
    robots:
      typeof robots.index === 'boolean' && typeof robots.follow === 'boolean'
        ? {
            index: robots.index,
            follow: robots.follow,
            noarchive: typeof robots.noarchive === 'boolean' ? robots.noarchive : undefined,
            nosnippet: typeof robots.nosnippet === 'boolean' ? robots.nosnippet : undefined,
          }
        : empty.robots,
    socialOg: Object.keys(rec(seo.openGraph)).length ? (rec(seo.openGraph) as ArticleSocialOg) : {},
    socialTwitter: Object.keys(rec(seo.twitter)).length ? (rec(seo.twitter) as ArticleSocialTwitter) : empty.socialTwitter,
    baseSeoData: seoData,
    blocks:
      parsedBlocks.length > 0
        ? parsedBlocks
        : content
        ? [{ id: 'b1', type: 'paragraph', text: content.replace(/<[^>]*>/g, ' ').slice(0, 500) }]
        : empty.blocks,
    rawContent: content,
    editorStyle: 'blocks',
  }
}

// ---------------------------------------------------------------------------
// Local (browser) draft autosave
// ---------------------------------------------------------------------------

export const LOCAL_DRAFT_PREFIX = 'spatium:article-draft:'
export const localDraftKey = (persistedSlug: string | null) => `${LOCAL_DRAFT_PREFIX}${persistedSlug || 'new'}`

/**
 * localStorage is a trust boundary (other tabs, older app versions, manual edits), so the
 * envelope is validated before it is offered for restore. The doc itself is checked for the
 * fields the editor cannot work without; the rest is merged over an empty doc.
 */
const LocalDraftSchema = z.object({
  v: z.literal(1),
  savedAt: z.string(),
  serverUpdatedAt: z.string().nullable(),
  doc: z
    .object({
      title: z.string(),
      slug: z.string(),
      blocks: z.array(z.object({ id: z.string(), type: z.string() }).passthrough()),
      rawContent: z.string(),
      editorStyle: z.enum(['blocks', 'raw']),
    })
    .passthrough(),
})

export interface LocalDraft {
  savedAt: string
  serverUpdatedAt: string | null
  doc: ArticleDoc
}

export function serializeLocalDraft(doc: ArticleDoc, serverUpdatedAt: string | null, now = new Date()): string {
  return JSON.stringify({ v: 1, savedAt: now.toISOString(), serverUpdatedAt, doc })
}

export function parseLocalDraft(raw: string | null): LocalDraft | null {
  if (!raw) return null
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch (err) {
    console.warn('[ArticleEditor] Ignoring unreadable local draft:', err)
    return null
  }
  const parsed = LocalDraftSchema.safeParse(json)
  if (!parsed.success) {
    console.warn('[ArticleEditor] Ignoring local draft with unexpected shape:', parsed.error.issues[0]?.message)
    return null
  }
  const doc = { ...createEmptyDoc(), ...(parsed.data.doc as Partial<ArticleDoc>) }
  return { savedAt: parsed.data.savedAt, serverUpdatedAt: parsed.data.serverUpdatedAt, doc }
}

/** True when the local draft differs from the document currently shown (ignores volatile fields). */
export function localDraftDiffers(local: ArticleDoc, current: ArticleDoc): boolean {
  const pick = (d: ArticleDoc) =>
    JSON.stringify([d.title, d.slug, d.excerpt, d.blocks, d.editorStyle === 'raw' ? d.rawContent : '', d.seoTitle, d.metaDescription, d.coverUrl, d.coverAlt, d.tagInput, d.category])
  return pick(local) !== pick(current)
}
