import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const hasAdmin = (data?.users?.length || 0) > 0
    return NextResponse.json({ hasAdmin })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })
    const hasAdmin = (usersData?.users?.length || 0) > 0

    const { email, password } = await req.json()

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Email and password (min 6 characters) are required.' },
        { status: 400 }
      )
    }

    if (hasAdmin) {
      return NextResponse.json(
        { error: 'An admin account already exists. Please login.' },
        { status: 400 }
      )
    }

    // Create the first admin user with auto-confirmed email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin' },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
