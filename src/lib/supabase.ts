import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
})

export type Post = {
  id: number
  slug: string
  title: string
  content: string
  excerpt: string
  status: string
  published_at: string
  modified_at: string
  author_name: string
  featured_image_url: string
  category_name: string
  tags: string[]
  yoast_title: string
  yoast_description: string
  yoast_og_title: string
  yoast_og_description: string
  yoast_og_image: string
  yoast_canonical: string
  yoast_schema: any
}
