import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { requireCan } from '@/lib/auth/capabilities'
import { getActiveThemeTokens, getAllThemeTokens } from '@/lib/theme/tokens'
import { revalidatePath } from 'next/cache'
import { errorResponse } from '@/lib/http/errors'

const themeTokenMutationSchema = z
  .object({
    presetId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    tokens: z.union([z.string().max(100_000), z.record(z.string(), z.unknown())]).optional(),
    makeActive: z.boolean().optional(),
  })
  .refine((v) => (v.presetId !== undefined && v.makeActive) || (v.name && v.tokens !== undefined), {
    message: 'Kirim presetId + makeActive untuk mengaktifkan preset, atau name + tokens untuk membuat preset.',
  })

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
  } catch (err) {
    return errorResponse('theme/tokens', err, 'Token tema tidak dapat dimuat.')
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCan(request, 'theme:manage')
  if (auth.error) return auth.error

  const raw = await request.json().catch(() => null)
  const parsed = themeTokenMutationSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Input tidak valid.' },
      { status: 400 }
    )
  }
  const { presetId, name, tokens, makeActive } = parsed.data

  try {
    await prisma.transaction(async (tx) => {
      if (presetId !== undefined && makeActive) {
        // Set all to inactive then activate target
        const allTokens = await tx.orm.public.ThemeToken.all()
        for (const t of allTokens) {
          await tx.orm.public.ThemeToken.where({ id: t.id }).update({ active: t.id === presetId })
        }
      } else if (name && tokens !== undefined) {
        const tokensJson = typeof tokens === 'string' ? tokens : JSON.stringify(tokens)
        if (makeActive) {
          const allTokens = await tx.orm.public.ThemeToken.all()
          for (const t of allTokens) {
            await tx.orm.public.ThemeToken.where({ id: t.id }).update({ active: false })
          }
        }
        await tx.orm.public.ThemeToken.create({
          name,
          tokens: tokensJson,
          active: Boolean(makeActive),
        })
      }
    })

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
  } catch (err) {
    return errorResponse('theme/tokens', err, 'Token tema gagal diperbarui.')
  }
}
