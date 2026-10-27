import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate mime type
    const validMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/avif',
    ]

    if (!validMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WEBP, GIF, AVIF, and SVG images are allowed.' },
        { status: 400 }
      )
    }

    // Clean filename
    const origName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-')
    const ext = origName.split('.').pop() || 'jpg'
    const baseName = origName.substring(0, origName.lastIndexOf('.')) || 'image'
    const timestamp = Date.now()
    const finalFilename = `${timestamp}-${baseName}.${ext}`

    // Convert file to ArrayBuffer then Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabaseAdmin.storage
      .from('article-images')
      .upload(finalFilename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('article-images')
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: data.path,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
