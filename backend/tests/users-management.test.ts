import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

let currentUser: any = {
  id: 'usr_superadmin_1',
  name: 'Super Admin',
  email: 'superadmin@segiatech.com',
  role: 'SUPER_ADMIN',
}

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(async () => currentUser),
}))

// In-memory mock database for User model
let mockDbUsers: any[] = []

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    orm: {
      public: {
        User: {
          all: vi.fn(async () => [...mockDbUsers]),
          where: vi.fn((filter: { email?: string; id?: string }) => ({
            first: vi.fn(async () => {
              if (filter.email) {
                return mockDbUsers.find((u) => u.email.toLowerCase() === filter.email!.toLowerCase()) || null
              }
              if (filter.id) {
                return mockDbUsers.find((u) => u.id === filter.id) || null
              }
              return null
            }),
            update: vi.fn(async (data: any) => {
              const idx = mockDbUsers.findIndex((u) => (filter.id ? u.id === filter.id : false))
              if (idx !== -1) {
                mockDbUsers[idx] = { ...mockDbUsers[idx], ...data }
                return mockDbUsers[idx]
              }
              return null
            }),
            delete: vi.fn(async () => {
              const idx = mockDbUsers.findIndex((u) => (filter.id ? u.id === filter.id : false))
              if (idx !== -1) {
                const deleted = mockDbUsers.splice(idx, 1)
                return deleted[0]
              }
              return null
            }),
          })),
          create: vi.fn(async (data: any) => {
            const newUser = {
              ...data,
              createdAt: new Date().toISOString(),
            }
            mockDbUsers.push(newUser)
            return newUser
          }),
        },
      },
    },
  },
}))

describe('User Management API & RBAC (/api/users)', () => {
  beforeEach(() => {
    currentUser = {
      id: 'usr_superadmin_1',
      name: 'Super Admin',
      email: 'superadmin@segiatech.com',
      role: 'SUPER_ADMIN',
    }
    mockDbUsers = [
      {
        id: 'usr_editor_1',
        name: 'Editor Satu',
        email: 'editor1@segiatech.com',
        role: 'editor',
        passwordHash: 'scrypt:salt:key',
        createdAt: new Date().toISOString(),
      },
    ]
  })

  it('rejects unauthenticated requests on GET /api/users with 401', async () => {
    currentUser = null
    const { GET } = await import('../src/app/api/users/route')
    const req = new NextRequest('http://localhost:3000/api/users')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('rejects non-authorized role (AUTHOR) on POST /api/users with 403', async () => {
    currentUser = {
      id: 'usr_author_1',
      name: 'Author User',
      email: 'author@segiatech.com',
      role: 'AUTHOR',
    }
    const { POST } = await import('../src/app/api/users/route')
    const req = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Hacker',
        email: 'hacker@segiatech.com',
        role: 'SUPER_ADMIN',
        password: 'Password123!',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('allows SUPER_ADMIN to list users on GET /api/users', async () => {
    const { GET } = await import('../src/app/api/users/route')
    const req = new NextRequest('http://localhost:3000/api/users')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.users).toBeInstanceOf(Array)
    expect(json.users.length).toBeGreaterThanOrEqual(1)
    expect(json.users[0].passwordHash).toBeUndefined()
  })

  it('validates required fields on POST /api/users', async () => {
    const { POST } = await import('../src/app/api/users/route')
    // Missing password
    const req = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Budi',
        email: 'budi@segiatech.com',
        role: 'EDITOR',
        password: 'short', // less than 8 chars
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('minimal 8 karakter')
  })

  it('successfully creates a new user with scrypt password hashing', async () => {
    const { POST } = await import('../src/app/api/users/route')
    const req = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ahmad Editor',
        email: 'ahmad@segiatech.com',
        role: 'EDITOR',
        password: 'VerySecurePass2026!',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.user.email).toBe('ahmad@segiatech.com')
    expect(json.user.role).toBe('EDITOR')

    // Verify stored in DB with scrypt format
    const stored = mockDbUsers.find((u) => u.email === 'ahmad@segiatech.com')
    expect(stored).toBeDefined()
    expect(stored.passwordHash).toMatch(/^scrypt:[0-9a-f]+:[0-9a-f]+$/)
  })

  it('rejects duplicate email on POST /api/users', async () => {
    const { POST } = await import('../src/app/api/users/route')
    const req = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Editor Duplicate',
        email: 'editor1@segiatech.com', // already exists
        role: 'EDITOR',
        password: 'AnotherPassword123!',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error).toContain('sudah terdaftar')
  })

  it('allows SUPER_ADMIN to update user role and name via PATCH /api/users', async () => {
    const { PATCH } = await import('../src/app/api/users/route')
    const req = new NextRequest('http://localhost:3000/api/users', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'usr_editor_1',
        name: 'Editor Baru',
        role: 'CONTENT_ADMIN',
      }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)

    const updated = mockDbUsers.find((u) => u.id === 'usr_editor_1')
    expect(updated.name).toBe('Editor Baru')
    expect(updated.role).toBe('content_admin')
  })

  it('prevents self-deletion of the active logged in SUPER_ADMIN account', async () => {
    const { DELETE } = await import('../src/app/api/users/route')
    const req = new NextRequest(`http://localhost:3000/api/users?id=${currentUser.id}`)
    const res = await DELETE(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('tidak dapat menghapus akun Anda sendiri')
  })

  it('allows SUPER_ADMIN to delete other user via DELETE /api/users', async () => {
    const { DELETE } = await import('../src/app/api/users/route')
    const req = new NextRequest('http://localhost:3000/api/users?id=usr_editor_1')
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)

    const exists = mockDbUsers.find((u) => u.id === 'usr_editor_1')
    expect(exists).toBeUndefined()
  })

  it('allows CONTENT_ADMIN to create an EDITOR but blocks creating a SUPER_ADMIN', async () => {
    currentUser = {
      id: 'usr_content_admin_1',
      name: 'Content Admin',
      email: 'contentadmin@segiatech.com',
      role: 'CONTENT_ADMIN',
    }
    const { POST } = await import('../src/app/api/users/route')

    // 1. Can create EDITOR
    const reqEditor = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Staff Editor',
        email: 'staff.editor@segiatech.com',
        role: 'EDITOR',
        password: 'EditorPassword123!',
      }),
    })
    const resEditor = await POST(reqEditor)
    expect(resEditor.status).toBe(201)

    // 2. Blocked from creating SUPER_ADMIN (403)
    const reqSuper = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Rogue Super',
        email: 'rogue.super@segiatech.com',
        role: 'SUPER_ADMIN',
        password: 'RoguePassword123!',
      }),
    })
    const resSuper = await POST(reqSuper)
    expect(resSuper.status).toBe(403)
    const jsonSuper = await resSuper.json()
    expect(jsonSuper.error).toContain('Hanya Super Admin yang dapat menunjuk Super Admin baru')
  })
})

