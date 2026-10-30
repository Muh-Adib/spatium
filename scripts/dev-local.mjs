// Local development follows the private project database selection, including
// when a preview launcher has inherited an older DATABASE_URL in its environment.
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import dotenv from 'dotenv'
const local = fs.existsSync('.env.local') ? dotenv.parse(fs.readFileSync('.env.local')) : {}
const env = { ...process.env }
if (local.DATABASE_URL) env.DATABASE_URL = local.DATABASE_URL
const args = process.argv.slice(2)
if (!args.some((arg) => arg === '--hostname' || arg === '-H' || arg.startsWith('--hostname='))) args.push('--hostname', '127.0.0.1')
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', ...args], { env, stdio: ['pipe', 'inherit', 'inherit'] })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.on('error', () => { console.error('Local Next.js process could not start.'); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code || 0 })
