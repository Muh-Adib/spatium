'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TipTapLink from '@tiptap/extension-link'
import TipTapImage from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Save,
  ArrowLeft,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
  Sparkles,
  FileCode,
} from 'lucide-react'

export interface PostFormData {
  id?: number
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'publish' | 'draft'
  category_name: string
  author_name: string
  featured_image_url: string
  yoast_title: string
  yoast_description: string
  yoast_canonical: string
  published_at?: string
}

interface PostEditorProps {
  initialData?: PostFormData
  isEditing?: boolean
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export function PostEditor({ initialData, isEditing = false }: PostEditorProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inlineImageInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [isSlugCustom, setIsSlugCustom] = useState(!!initialData?.slug)
  const [status, setStatus] = useState<'publish' | 'draft'>(initialData?.status || 'publish')
  const [categoryName, setCategoryName] = useState(initialData?.category_name || 'Artikel')
  const [authorName, setAuthorName] = useState(initialData?.author_name || 'UNIMASI')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialData?.featured_image_url || '')
  
  // SEO fields
  const [yoastTitle, setYoastTitle] = useState(initialData?.yoast_title || '')
  const [yoastDesc, setYoastDesc] = useState(initialData?.yoast_description || '')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')

  // UI state
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingInline, setUploadingInline] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [htmlContent, setHtmlContent] = useState(initialData?.content || '')
  const [existingCategories, setExistingCategories] = useState<string[]>([])

  // Setup TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'article-link',
        },
      }),
      TipTapImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'article-img',
        },
      }),
    ],
    content: initialData?.content || '',
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML())
    },
    immediatelyRender: false,
  })

  // Load existing categories for autocomplete
  useEffect(() => {
    fetch('/api/admin/stats/')
      .then((res) => res.json())
      .then((data) => {
        if (data?.categories) setExistingCategories(data.categories)
      })
      .catch(() => {})
  }, [])

  // Auto-generate slug when title changes (unless manually customized)
  function handleTitleChange(val: string) {
    setTitle(val)
    if (!isSlugCustom) {
      setSlug(slugify(val))
    }
  }

  // Cover image upload
  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload/', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload cover image')
      }

      setFeaturedImageUrl(data.url)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setUploadingCover(false)
    }
  }

  // Inline TipTap image upload
  async function handleInlineImageUpload(file: File) {
    if (!editor) return
    setUploadingInline(true)
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload/', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      editor.chain().focus().setImage({ src: data.url }).run()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setUploadingInline(false)
    }
  }

  function handleAddLink() {
    if (!editor) return
    const prevUrl = editor.getAttributes('link').href || ''
    const url = window.prompt('Enter link URL:', prevUrl)

    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  // Submit Save or Update
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Article title is required.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    const currentContent = isHtmlMode ? htmlContent : (editor ? editor.getHTML() : htmlContent)

    const payload: Partial<PostFormData> = {
      title,
      slug: slug || slugify(title),
      content: currentContent,
      excerpt: excerpt || yoastDesc || '',
      status,
      category_name: categoryName || 'Artikel',
      author_name: authorName || 'UNIMASI',
      featured_image_url: featuredImageUrl,
      yoast_title: yoastTitle || title,
      yoast_description: yoastDesc || excerpt || '',
      yoast_canonical: `https://unimasi.studio/${slug || slugify(title)}/`,
    }

    try {
      let res: Response
      if (isEditing && initialData?.id) {
        res = await fetch(`/api/admin/posts/${initialData.id}/`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/posts/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save article')
      }

      setSuccessMsg(isEditing ? 'Article updated successfully!' : 'Article created successfully!')

      if (!isEditing && resData.post?.id) {
        setTimeout(() => {
          router.replace(`/admin/posts/${resData.post.id}/`)
        }, 800)
      }
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Live SERP Preview Title & Desc
  const previewTitle = yoastTitle || title || 'Your Article Title'
  const previewDesc = yoastDesc || excerpt || 'Enter a meta description or excerpt to preview how this article appears in Google search results.'
  const previewSlug = slug || 'article-slug'

  return (
    <div>
      {/* Top Action Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/" className="adm-btn adm-btn--secondary adm-btn--sm">
            <ArrowLeft size={14} />
            <span>Articles</span>
          </Link>
          <span style={{ color: 'var(--adm-text-muted)', fontSize: '0.85rem' }}>/</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--adm-text-primary)' }}>
            {isEditing ? `Edit: ${initialData?.title || 'Article'}` : 'New Article'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isEditing && slug && (
            <a
              href={`/${slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="adm-btn adm-btn--secondary adm-btn--sm"
            >
              <ExternalLink size={14} />
              <span>Preview Live</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="adm-btn adm-btn--primary"
            style={{ minWidth: '120px' }}
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>{isEditing ? 'Update Article' : 'Publish Article'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--adm-radius-md)',
            background: 'var(--adm-red-subtle)',
            border: '1px solid var(--adm-red-border)',
            color: '#fca5a5',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--adm-radius-md)',
            background: 'var(--adm-emerald-subtle)',
            border: '1px solid var(--adm-emerald-border)',
            color: 'var(--adm-emerald)',
            fontSize: '0.84rem',
            marginBottom: '1.25rem',
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Dual-Column Canvas */}
      <div className="adm-editor-layout">
        {/* Left Column: Title, Slug, TipTap Canvas */}
        <div className="adm-editor-main">
          {/* Title & Slug Box */}
          <div className="adm-card">
            <div className="adm-form-group" style={{ marginBottom: '0.75rem' }}>
              <input
                type="text"
                placeholder="Enter article title here..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--adm-text-primary)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Live Permalink / Slug Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: 'var(--adm-text-muted)',
                background: 'var(--adm-surface)',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--adm-radius-sm)',
                border: '1px solid var(--adm-border-subtle)',
                fontFamily: 'var(--font-dm-mono), monospace',
              }}
            >
              <span>https://unimasi.studio/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setIsSlugCustom(true)
                  setSlug(slugify(e.target.value))
                }}
                placeholder="article-slug"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--adm-emerald)',
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  outline: 'none',
                  flex: 1,
                  fontWeight: 600,
                }}
              />
              <span>/</span>
            </div>
          </div>

          {/* TipTap Rich Text Editor Container */}
          <div className="adm-tiptap-wrap">
            {/* Toolbar */}
            <div className="adm-tiptap-toolbar">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`adm-tool-btn ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                title="Heading 2"
              >
                <Heading2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`adm-tool-btn ${editor?.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                title="Heading 3"
              >
                <Heading3 size={16} />
              </button>

              <div className="adm-tool-divider" />

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`adm-tool-btn ${editor?.isActive('bold') ? 'active' : ''}`}
                title="Bold"
              >
                <Bold size={16} />
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`adm-tool-btn ${editor?.isActive('italic') ? 'active' : ''}`}
                title="Italic"
              >
                <Italic size={16} />
              </button>

              <div className="adm-tool-divider" />

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`adm-tool-btn ${editor?.isActive('bulletList') ? 'active' : ''}`}
                title="Bullet List"
              >
                <List size={16} />
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={`adm-tool-btn ${editor?.isActive('orderedList') ? 'active' : ''}`}
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={`adm-tool-btn ${editor?.isActive('blockquote') ? 'active' : ''}`}
                title="Blockquote"
              >
                <Quote size={16} />
              </button>

              <div className="adm-tool-divider" />

              <button
                type="button"
                onClick={handleAddLink}
                className={`adm-tool-btn ${editor?.isActive('link') ? 'active' : ''}`}
                title="Insert Link"
              >
                <LinkIcon size={16} />
              </button>

              <button
                type="button"
                onClick={() => inlineImageInputRef.current?.click()}
                className="adm-tool-btn"
                title="Upload & Insert Image"
                disabled={uploadingInline}
              >
                {uploadingInline ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              </button>
              <input
                ref={inlineImageInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleInlineImageUpload(file)
                  e.target.value = ''
                }}
              />

              <div className="adm-tool-divider" />

              <button
                type="button"
                onClick={() => editor?.chain().focus().undo().run()}
                className="adm-tool-btn"
                title="Undo"
              >
                <Undo size={16} />
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().redo().run()}
                className="adm-tool-btn"
                title="Redo"
              >
                <Redo size={16} />
              </button>

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isHtmlMode) {
                      editor?.commands.setContent(htmlContent)
                    } else {
                      setHtmlContent(editor?.getHTML() || '')
                    }
                    setIsHtmlMode(!isHtmlMode)
                  }}
                  className={`adm-btn adm-btn--sm ${isHtmlMode ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                  title="Toggle HTML Code View"
                >
                  <FileCode size={14} />
                  <span>{isHtmlMode ? 'Visual Editor' : 'HTML Code'}</span>
                </button>
              </div>
            </div>

            {/* Editor Canvas Body */}
            {isHtmlMode ? (
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '480px',
                  padding: '1.5rem',
                  background: 'var(--adm-surface)',
                  color: '#e4e4e7',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                }}
              />
            ) : (
              <div className="adm-tiptap-content">
                <EditorContent editor={editor} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Inspector Cards (Publish, Cover, Yoast SEO) */}
        <div className="adm-editor-sidebar">
          {/* Card 1: Publish & Status */}
          <div className="adm-card">
            <div className="adm-card__header">
              <span className="adm-card__title">Publishing</span>
              {status === 'publish' ? (
                <span className="adm-badge adm-badge--published">Live</span>
              ) : (
                <span className="adm-badge adm-badge--draft">Draft</span>
              )}
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Status</label>
              <select
                className="adm-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="publish">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Category</label>
              <input
                type="text"
                list="category-suggestions"
                className="adm-input"
                placeholder="e.g. 3D Animation"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <datalist id="category-suggestions">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Author Name</label>
              <input
                type="text"
                className="adm-input"
                placeholder="UNIMASI"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: Featured Image */}
          <div className="adm-card">
            <div className="adm-card__header">
              <span className="adm-card__title">Featured Cover Image</span>
            </div>

            {featuredImageUrl ? (
              <div>
                <img
                  src={featuredImageUrl}
                  alt="Featured cover"
                  className="adm-dropzone__preview"
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCover}
                    className="adm-btn adm-btn--secondary adm-btn--sm"
                    style={{ flex: 1 }}
                  >
                    {uploadingCover ? <Loader2 size={13} className="animate-spin" /> : 'Change Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeaturedImageUrl('')}
                    className="adm-btn adm-btn--danger adm-btn--sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="adm-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingCover ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--adm-emerald)' }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontSize: '0.8rem' }}>Uploading to Supabase Storage...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={24} style={{ color: 'var(--adm-emerald)', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--adm-text-primary)' }}>
                      Click to upload cover image
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)', marginTop: '0.2rem' }}>
                      PNG, JPG, or WEBP (16:9 recommended)
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleCoverUpload(file)
                e.target.value = ''
              }}
            />
          </div>

          {/* Card 3: Yoast SEO & Google SERP Preview */}
          <div className="adm-card">
            <div className="adm-card__header">
              <span className="adm-card__title">
                <Sparkles size={16} style={{ color: 'var(--adm-emerald)' }} />
                <span>Yoast SEO</span>
              </span>
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Focus Keyword</label>
              <input
                type="text"
                className="adm-input"
                placeholder="e.g. 3d animation australia"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
              />
            </div>

            <div className="adm-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="adm-label">SEO Title</label>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: (yoastTitle || title).length > 65 ? 'var(--adm-amber)' : 'var(--adm-text-muted)',
                  }}
                >
                  {(yoastTitle || title).length} / 60
                </span>
              </div>
              <input
                type="text"
                className="adm-input"
                placeholder="Title tag for search engines"
                value={yoastTitle}
                onChange={(e) => setYoastTitle(e.target.value)}
              />
            </div>

            <div className="adm-form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="adm-label">Meta Description</label>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: (yoastDesc || excerpt).length > 160 ? 'var(--adm-amber)' : 'var(--adm-text-muted)',
                  }}
                >
                  {(yoastDesc || excerpt).length} / 160
                </span>
              </div>
              <textarea
                rows={3}
                className="adm-textarea"
                placeholder="Brief summary appearing in Google search results..."
                value={yoastDesc}
                onChange={(e) => setYoastDesc(e.target.value)}
              />
            </div>

            {/* Google SERP Live Preview Card */}
            <div style={{ marginTop: '1rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--adm-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Google Search Preview
              </span>
              <div className="adm-serp-card">
                <div className="adm-serp-card__site">
                  <div className="adm-serp-card__favicon">U</div>
                  <div className="adm-serp-card__url">https://unimasi.studio › {previewSlug}</div>
                </div>
                <div className="adm-serp-card__title">{previewTitle}</div>
                <div className="adm-serp-card__desc">{previewDesc}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
