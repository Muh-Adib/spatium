import { hashPasswordScrypt } from '../src/lib/auth/crypto'
import readline from 'readline'

async function main() {
  let password = process.argv[2]

  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    password = await new Promise<string>((resolve) => {
      rl.question('Enter password to hash (scrypt): ', (ans) => {
        rl.close()
        resolve(ans.trim())
      })
    })
  }

  if (!password) {
    console.error('Error: Password cannot be empty.')
    process.exit(1)
  }

  const hash = await hashPasswordScrypt(password)
  console.log('\n=============================================')
  console.log('Generated scrypt password hash:')
  console.log(hash)
  console.log('=============================================\n')
  console.log('Set this in your environment or .env file:')
  console.log(`BOOTSTRAP_ADMIN_PASSWORD_HASH="${hash}"`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
