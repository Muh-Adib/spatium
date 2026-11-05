import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireCan } from '@/lib/auth/capabilities'
import { getActiveThemeTokens, getAllThemeTokens } from '@/lib/theme/tokens'
import { revalidatePath } from 'next/cache'

export async function GET() {
  try {
    const active = await getActiveThemeTokens()
    const all = await getAllThemeTokens()
    return NextResponse.json({
      success: true,
      data: {
        active,
        presets: all,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'theme:manage')
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { presetId, name, tokens, makeActive } = body

    if (presetId && makeActive) {
      // Set all to inactive then activate target
      const allTokens = await prisma.orm.public.ThemeToken.all()
      for (const t of allTokens) {
        await prisma.orm.public.ThemeToken.where({ id: t.id }).update({ active: t.id === Number(presetId) })
      }
    } else if (name && tokens) {
      const tokensJson = typeof tokens === 'string' ? tokens : JSON.stringify(tokens)
      if (makeActive) {
        const allTokens = await prisma.orm.public.ThemeToken.all()
        for (const t of allTokens) {
          await prisma.orm.public.ThemeToken.where({ id: t.id }).update({ active: false })
        }
      }
      await prisma.orm.public.ThemeToken.create({
          name,
          tokens: tokensJson,
          active: Boolean(makeActive),
        })
    }

    try {
      revalidatePath('/', 'layout')
    } catch (err) { console.warn("[API observable error]:", err) }

    const updatedActive = await getActiveThemeTokens()
    const all = await getAllThemeTokens()

    return NextResponse.json({
      success: true,
      message: 'Token tema berhasil diperbarui.',
      data: {
        active: updatedActive,
        presets: all,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
