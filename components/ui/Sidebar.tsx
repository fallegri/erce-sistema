'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SessionUser } from '@/types'
import { useAuthStore } from '@/lib/store'
import clsx from 'clsx'

const navItems = [
  {
    href: '/recepcion',
    label: 'Recepción',
    roles: ['ADMIN', 'ERCE'],
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    href: '/reportes',
    label: 'Reportes',
    roles: ['ADMIN', 'ERCE'],
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    href: '/parametros',
    label: 'Parámetros',
    roles: ['ADMIN', 'ERCE'],
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  },
  {
    href: '/aprobacion',
    label: 'Aprobación',
    roles: ['ADMIN'],
    badge: true,
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    href: '/usuarios',
    label: 'Usuarios',
    roles: ['ADMIN'],
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  },
]

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname()
  const logout = useAuthStore((s) => s.logout)
  const [pendientes, setPendientes] = useState(0)

  // Poll pending approvals every 60s for the badge
  useEffect(() => {
    if (user.rol !== 'ADMIN') return
    const load = () => {
      fetch('/api/aprobacion').then((r) => r.json()).then((d) => {
        if (d.ok) setPendientes(d.data.pendientes)
      }).catch(() => {})
    }
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [user.rol])

  return (
    <aside
      className="flex flex-col shrink-0 h-full border-r border-sidebar-border"
      style={{ width: 'var(--sidebar-width)', backgroundColor: '#0F1623' }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="font-display text-base font-bold text-white leading-tight">ERCE</p>
            <p className="text-[9px] text-sidebar-text font-mono uppercase tracking-widest">Sistema Pericial</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-sidebar-text opacity-60">Módulos</p>
        {navItems
          .filter((item) => item.roles.includes(user.rol))
          .map((item) => {
            const active = pathname.startsWith(item.href)
            const showBadge = item.badge && pendientes > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  active
                    ? 'bg-sidebar-active text-sidebar-textActive font-medium'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-textActive'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-bold">
                    {pendientes > 9 ? '9+' : pendientes}
                  </span>
                )}
                {active && !showBadge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                )}
              </Link>
            )
          })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 bg-sidebar-hover">
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">{user.nombre.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-textActive truncate">{user.nombre}</p>
            <p className="text-[10px] text-sidebar-text font-mono">{user.rol} · {user.ciudad}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-text hover:text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir del sistema
        </button>
      </div>
    </aside>
  )
}
