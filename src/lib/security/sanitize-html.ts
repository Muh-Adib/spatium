/**
 * HTML Sanitizer Contract (K-3)
 *
 * Utilizes `sanitize-html` to sanitize untrusted HTML from CMS imports,
 * studio blocks, and FAQs. Strips script execution, inline event handlers,
 * dangerous pseudo-protocols (javascript:), while preserving safe semantic formatting.
 */
import sanitize from 'sanitize-html'
import { validateVideoEmbedUrl } from '@/lib/media/embedValidator'

const ALLOWED_TAGS = [
  'iframe', 'video', 'audio', 'source', 'track',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'p',
  'a',
  'ul',
  'ol',
  'nl',
  'li',
  'b',
  'i',
  'strong',
  'em',
  'strike',
  'code',
  'hr',
  'br',
  'div',
  'table',
  'thead',
  'caption',
  'tbody',
  'tr',
  'th',
  'td',
  'pre',
  'span',
  'sup',
  'sub',
  'u',
  's',
  'img',
  'figure',
  'figcaption',
  'details',
  'summary',
  'svg',
  'path',
]

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  iframe: ['src', 'title', 'loading', 'sandbox', 'allow', 'allowfullscreen', 'referrerpolicy', 'class'],
  video: ['src', 'poster', 'controls', 'preload', 'width', 'height', 'playsinline', 'class'],
  audio: ['src', 'controls', 'preload', 'class'],
  source: ['src', 'type', 'srcset', 'sizes'],
  track: ['src', 'kind', 'srclang', 'label', 'default'],
  a: ['href', 'name', 'target', 'rel', 'title', 'class'],
  img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class', 'style'],
  svg: ['class', 'fill', 'stroke', 'viewbox', 'viewBox', 'stroke-width', 'strokeWidth', 'aria-hidden'],
  path: ['d', 'stroke-linecap', 'strokeLinecap', 'stroke-linejoin', 'strokeLinejoin'],
  '*': ['class', 'id', 'title', 'aria-label', 'aria-hidden'],
  th: ['scope', 'colspan', 'rowspan'],
  td: ['colspan', 'rowspan'],
}

const ALLOWED_SCHEMES = ['http', 'https', 'mailto', 'tel']

export function sanitizeHtmlContent(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return ''
  }

  return sanitize(dirtyHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowedSchemesByTag: {
      a: ALLOWED_SCHEMES,
    },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    exclusiveFilter: (frame) => frame.tag === 'iframe' && !validateVideoEmbedUrl(frame.attribs.src || '').isValid,
    transformTags: {
      iframe: (_tagName, attrs) => ({ tagName: 'iframe', attribs: { src: attrs.src || '', title: attrs.title || 'Video', loading: 'lazy', sandbox: 'allow-scripts allow-same-origin allow-presentation', allow: 'fullscreen; picture-in-picture', allowfullscreen: '', referrerpolicy: 'strict-origin-when-cross-origin' } }),
      video: (_tagName, attrs) => ({ tagName: 'video', attribs: { ...attrs, controls: '', preload: 'metadata', playsinline: '' } }),
      audio: (_tagName, attrs) => ({ tagName: 'audio', attribs: { ...attrs, controls: '', preload: 'metadata' } }),
      a: (tagName, attribs) => {
        // Enforce safe rel for external targets
        if (attribs.target === '_blank') {
          attribs.rel = 'noopener noreferrer'
        }
        return {
          tagName,
          attribs,
        }
      },
    },
  })
}
