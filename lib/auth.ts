import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { SessionUser } from '@/types'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '8h' })
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('erce_session')?.value
  if (!token) return null
  return verifyToken(token)
}

export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
