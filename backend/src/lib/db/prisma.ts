import 'server-only'
import { db } from '../../../prisma/db'
export { db as prisma, db } from '../../../prisma/db'
export type DbClient = typeof db
