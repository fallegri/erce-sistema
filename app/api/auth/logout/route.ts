import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = cookies()
  cookieStore.delete('erce_session')
  return NextResponse.json({ ok: true })
}
