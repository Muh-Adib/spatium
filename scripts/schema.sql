-- UNIMASI Blog Posts Table Schema for Supabase
CREATE TABLE IF NOT EXISTS public.posts (
  id BIGINT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  status TEXT DEFAULT 'publish',
  published_at TIMESTAMPTZ,
  modified_at TIMESTAMPTZ,
  author_name TEXT DEFAULT 'UNIMASI',
  featured_image_url TEXT,
  category_name TEXT DEFAULT 'Articles',
  tags TEXT[] DEFAULT '{}',
  yoast_title TEXT,
  yoast_description TEXT,
  yoast_og_title TEXT,
  yoast_og_description TEXT,
  yoast_og_image TEXT,
  yoast_canonical TEXT,
  yoast_schema JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists then recreate
DROP POLICY IF EXISTS "Allow public read access for published posts" ON public.posts;
CREATE POLICY "Allow public read access for published posts"
  ON public.posts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access" ON public.posts;
CREATE POLICY "Allow service role full access"
  ON public.posts
  FOR ALL
  USING (true)
  WITH CHECK (true);
