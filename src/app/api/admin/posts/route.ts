import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '20', 10)))
    const status = searchParams.get('status') || 'all'
    const category = searchParams.get('category') || 'all'
    const search = (searchParams.get('search') || '').trim()

    let query = supabaseAdmin
      .from('posts')
      .select(
        'id, slug, title, status, category_name, author_name, featured_image_url, published_at, updated_at',
        { count: 'exact' }
      )

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (category !== 'all') {
      query = query.eq('category_name', category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data: posts, count, error } = await query
      .order('published_at', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      posts: posts || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      title,
      slug: customSlug,
      content,
      excerpt,
      status = 'publish',
      category_name = 'Artikel',
      author_name = 'UNIMASI',
      featured_image_url = '',
      yoast_title = '',
      yoast_description = '',
      yoast_canonical = '',
      published_at,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Determine unique slug
    let baseSlug = slugify(customSlug || title) || 'post'
    let uniqueSlug = baseSlug
    let counter = 1

    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('posts')
        .select('id')
        .eq('slug', uniqueSlug)
        .single()

      if (!existing) break
      uniqueSlug = `${baseSlug}-${counter++}`
    }

    // Get max ID to safely assign next integer ID
    const { data: maxRow } = await supabaseAdmin
      .from('posts')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    const newId = (maxRow?.id || 20000) + 1
    const now = new Date().toISOString()
    const pubDate = published_at ? new Date(published_at).toISOString() : now

    const newPost = {
      id: newId,
      slug: uniqueSlug,
      title,
      content: content || '',
      excerpt: excerpt || yoast_description || '',
      status,
      category_name,
      author_name,
      featured_image_url: featured_image_url || null,
      yoast_title: yoast_title || title,
      yoast_description: yoast_description || excerpt || '',
      yoast_canonical: yoast_canonical || `https://unimasi.studio/${uniqueSlug}/`,
      published_at: pubDate,
      modified_at: now,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert(newPost)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
