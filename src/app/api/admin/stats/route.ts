import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Total count
    const { count: totalCount } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })

    // Published count
    const { count: publishedCount } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'publish')

    // Draft count
    const { count: draftCount } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'draft')

    // Recent 50 categories sample
    const { data: catRows } = await supabaseAdmin
      .from('posts')
      .select('category_name')
      .not('category_name', 'is', null)
      .limit(500)

    const categoriesSet = new Set<string>()
    catRows?.forEach((r) => {
      if (r.category_name) categoriesSet.add(r.category_name)
    })

    return NextResponse.json({
      total: totalCount || 0,
      published: publishedCount || 0,
      drafts: draftCount || 0,
      categories: Array.from(categoriesSet).sort(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
