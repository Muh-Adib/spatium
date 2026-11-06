/**
 * Create Superadmin CLI Script (L6-T4)
 * Securely prompts for superadmin credentials via stdin (never via CLI arguments)
 * and upserts the user in the PostgreSQL database with scrypt hashing.
 *
 * Usage:
 *   npm run user:create-superadmin
 */
import readline from 'node:readline'
import { Writable } from 'node:stream'
import crypto from 'node:crypto'
import { prisma } from '../src/lib/db/prisma'
import { hashPasswordScrypt } from '../src/lib/auth/crypto'

function askQuestion(query: string, hidden = false): Promise<string> {
  if (!process.stdin.isTTY) throw new Error('Jalankan helper ini di terminal interaktif. Jangan berikan kata sandi lewat argumen atau pipe.')
  const muted = new Writable({ write(_chunk, _encoding, callback) { callback() } })
  const rl = readline.createInterface({ input: process.stdin, output: hidden ? muted : process.stdout, terminal: true })
  if (hidden) process.stdout.write(query)
  return new Promise((resolve) => {
    rl.question(hidden ? '' : query, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(hidden ? answer : answer.trim())
    })
    rl.on('SIGINT', () => { rl.close(); process.stdout.write('\nDibatalkan.\n'); process.exit(130) })
  })
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║       SPATIUM Studio — Create Superadmin CLI                ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  const email = await askQuestion('Superadmin Email: ')
  if (!email || !email.includes('@')) {
    console.error('Error: Masukkan alamat email yang valid.')
    process.exit(1)
  }

  const name = await askQuestion('Nama Lengkap: ')
  if (!name) {
    console.error('Error: Nama tidak boleh kosong.')
    process.exit(1)
  }

  const password = await askQuestion('Kata sandi baru (minimal 12 karakter, input disembunyikan): ', true)
  if (!password || password.length < 12) {
    console.error('Error: Kata sandi minimal harus 12 karakter.')
    process.exit(1)
  }

  const confirmation = await askQuestion('Ulangi kata sandi baru: ', true)
  if (password !== confirmation) throw new Error('Konfirmasi kata sandi tidak sama. Tidak ada perubahan disimpan.')

  console.log('\n[AUTH] Mengenkripsi password dengan scrypt hashing...')
  const passwordHash = await hashPasswordScrypt(password)

  // Check if user already exists
  const existing = await prisma.orm.public.User.where({ email }).first()

  if (existing) {
    await prisma.orm.public.User.where({ id: existing.id })
      .update({
        name,
        role: 'super_admin',
        passwordHash,
      })
    console.log(`[AUTH] Sukses: Akun superadmin (${email}) berhasil diperbarui!`)
  } else {
    const id = `usr_${crypto.randomBytes(6).toString('hex')}`
    await prisma.orm.public.User.create({
      id,
      email,
      name,
      role: 'super_admin',
      passwordHash,
    })
    console.log(`[AUTH] Sukses: Akun superadmin baru (${email}) dengan ID ${id} berhasil dibuat!`)
  }

  console.log('[AUTH] Akun kini aktif dan dapat digunakan untuk login ke /admin/login.\n')
}

main().finally(() => prisma.close()).catch((err) => {
  console.error('[AUTH] Gagal membuat superadmin:', err)
  process.exit(1)
})
