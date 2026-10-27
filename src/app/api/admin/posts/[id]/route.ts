import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

// GET /api/admin/posts/[id] -> Fetch single post by ID
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const postId = parseInt(id, 10)

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const { data: post, error } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/admin/posts/[id] -> Update post
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const postId = parseInt(id, 10)

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const body = await req.json()
    const {
      title,
      slug: customSlug,
      content,
      excerpt,
      status,
      category_name,
      author_name,
      featured_image_url,
      yoast_title,
      yoast_description,
      yoast_canonical,
      published_at,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Verify existing post
    const { data: existingPost, error: findError } = await supabaseAdmin
      .from('posts')
      .select('id, slug')
      .eq('id', postId)
      .single()

    if (findError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Check slug uniqueness if changed
    let finalSlug = existingPost.slug
    if (customSlug && customSlug !== existingPost.slug) {
      const cleanSlug = slugify(customSlug)
      let uniqueSlug = cleanSlug
      let counter = 1

      while (true) {
        const { data: duplicate } = await supabaseAdmin
          .from('posts')
          .select('id')
          .eq('slug', uniqueSlug)
          .neq('id', postId)
          .single()

        if (!duplicate) break
        uniqueSlug = `${cleanSlug}-${counter++}`
      }
      finalSlug = uniqueSlug
    }

    const now = new Date().toISOString()
    const updates: Record<string, any> = {
      title,
      slug: finalSlug,
      content: content ?? '',
      excerpt: excerpt ?? '',
      status: status || 'publish',
      category_name: category_name || 'Artikel',
      author_name: author_name || 'UNIMASI',
      featured_image_url: featured_image_url || null,
      yoast_title: yoast_title || title,
      yoast_description: yoast_description || excerpt || '',
      yoast_canonical: yoast_canonical || `https://unimasi.studio/${finalSlug}/`,
      modified_at: now,
      updated_at: now,
    }

    if (published_at) {
      updates.published_at = new Date(published_at).toISOString()
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/admin/posts/[id] -> Delete post
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const postId = parseInt(id, 10)

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedId: postId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
