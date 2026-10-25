import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  Camera,
  ChevronDown,
  Info,
  LayoutDashboard,
  MapPin,
  PanelLeft,
  Settings,
  Shield,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import { useSafety } from '../store/SafetyStore'
import { MODULE_FOR_TYPE, SCENARIOS, SCHOOL_NAME } from '../data/mock'
import { isOpen } from '../lib/metrics'
import { cx } from '../lib/format'
import { IncidentModal } from './IncidentModal'
import { Toaster } from './Toaster'
import { AlertIcon, Toggle } from './ui'

function SimulateMenu() {
  const { trigger, settings, updateSettings } = useSafety()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
      >
        <Zap className="size-4" /> <span className="hidden sm:inline">Simulate incident</span>
        <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
          <p className="border-b border-line px-3 py-2 text-xs text-muted">Demo mode: raise a detection on a simulated camera feed.</p>
          <ul className="p-1">
            {SCENARIOS.map((s) => {
              const enabled = settings.modules[MODULE_FOR_TYPE[s.type]]
              return (
                <li key={s.type}>
                  <button
                    disabled={!enabled}
                    onClick={() => {
                      trigger(s)
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <AlertIcon type={s.type} severity={s.severity} className="size-8" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{s.label}</span>
                      <span className="block text-xs text-muted">
                        {enabled ? `${s.cameraId} · ${s.severity}` : 'Detection module is off'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-line px-3 py-2.5">
            <span className="text-sm">
              <span className="block font-medium text-white">Auto-generate alerts</span>
              <span className="block text-xs text-muted">Random incident every {settings.simulateEverySec}s</span>
            </span>
            <Toggle label="Auto-generate alerts" checked={settings.autoSimulate} onChange={() => updateSettings({ autoSimulate: !settings.autoSimulate })} />
          </div>
        </div>
      )}
    </div>
  )
}

export function Layout() {
  const { alerts, notifications, settings } = useSafety()
  const [mobileNav, setMobileNav] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const openCount = alerts.filter(isOpen).length
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => setMobileNav(false), [location.pathname])

  const nav = [
    { section: 'Monitoring', items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/cameras', label: 'Cameras', icon: Camera },
      { to: '/alerts', label: 'Alerts', icon: TriangleAlert, badge: openCount },
      { to: '/zones', label: 'Zones', icon: MapPin },
    ] },
    { section: 'System', items: [
      { to: '/notifications', label: 'Notifications', icon: Bell, badge: unread },
      { to: '/settings', label: 'Settings', icon: Settings },
    ] },
  ]

  return (
    <div className="flex min-h-screen">
      {mobileNav && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileNav(false)} />}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-[#0a0f17] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileNav ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:hidden',
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 px-4 py-4">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-teal-400/30 to-cyan-600/20 ring-1 ring-teal-400/40">
            <Shield className="size-5 text-teal-300" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-white">Security Dashboard</span>
            <span className="block text-[11px] text-muted">{SCHOOL_NAME}</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {nav.map((group) => (
            <div key={group.section}>
              <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">{group.section}</p>
              <ul className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, badge }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        cx(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                          isActive ? 'bg-white/[0.07] font-medium text-white ring-1 ring-emerald-500/40' : 'text-slate-300 hover:bg-white/5',
                        )
                      }
                    >
                      <Icon className="size-4" />
                      <span className="flex-1">{label}</span>
                      {!!badge && <span className="rounded-md bg-red-600 px-1.5 text-[11px] font-semibold text-white">{badge}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Project</p>
            <Link to="/" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-300 hover:bg-white/5">
              <Info className="size-4" /> About SchoolShield AI
            </Link>
          </div>
        </nav>
        <div className="m-3 rounded-lg bg-panel-2 p-3 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-white">
            <span className="size-2 rounded-full bg-emerald-400" /> System Active
          </p>
          <p className="mt-0.5 text-muted">
            {Object.values(settings.modules).filter(Boolean).length}/4 AI detection modules operational
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-ink/85 px-4 py-2.5 backdrop-blur">
          <button
            onClick={() => (window.innerWidth >= 1024 ? setCollapsed((c) => !c) : setMobileNav(true))}
            aria-label="Toggle sidebar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <PanelLeft className="size-4" />
          </button>
          <div className="flex-1" />
          {settings.autoSimulate && (
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 sm:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> Auto demo on
            </span>
          )}
          <SimulateMenu />
          <Link to="/notifications" aria-label="Notifications" className="relative rounded-md p-2 text-slate-300 hover:bg-white/5">
            <Bell className="size-4" />
            {unread > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />}
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <IncidentModal />
      <Toaster />
    </div>
  )
}
