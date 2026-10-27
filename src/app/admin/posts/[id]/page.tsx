'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PostEditor } from '@/components/admin/PostEditor'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

export default function EditPostPage() {
  const params = useParams()
  const id = params?.id as string

  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!id) return

    async function loadPost() {
      try {
        const res = await fetch(`/api/admin/posts/${id}/`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load article')
        }

        setPost(data.post)
      } catch (err: any) {
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '0.75rem', color: 'var(--adm-text-muted)' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--adm-emerald)' }} />
        <span>Loading article #{id}...</span>
      </div>
    )
  }

  if (errorMsg || !post) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--adm-radius-md)',
            background: 'var(--adm-red-subtle)',
            border: '1px solid var(--adm-red-border)',
            color: '#fca5a5',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMsg || 'Article not found.'}</span>
        </div>
        <div>
          <Link href="/admin/" className="adm-btn adm-btn--secondary">
            <ArrowLeft size={15} />
            <span>Return to Articles</span>
          </Link>
        </div>
      </div>
    )
  }

  return <PostEditor initialData={post} isEditing={true} />
}
