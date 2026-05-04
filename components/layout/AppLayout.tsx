'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  // Estado mobile: sidebar sobreposta (overlay)
  const [sidebarOpen,      setSidebarOpen]      = useState(false)
  // Estado desktop: sidebar recolhida (icon-only)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted">

      {/* ── Overlay (mobile apenas) ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-overlay bg-ink/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      {/*
        Mobile:   posição fixa, desliza com translate-x, z-modal
        Desktop:  posição estática, sempre visível, largura varia via collapsed
      */}
      <div
        className={cn(
          // Base: fixa em mobile
          'fixed inset-y-0 left-0 z-modal shrink-0',
          'transition-transform duration-250',
          // Desktop: estática (saí do fluxo fixo)
          'lg:static lg:inset-y-auto lg:left-auto lg:z-auto',
          'lg:translate-x-0',
          // Mobile: oculta/visível via translate
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Área principal ───────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  )
}
