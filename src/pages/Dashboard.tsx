import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Activity, Camera, CircleCheck, Clock, DoorOpen, ShieldCheck, ShieldAlert, TrendingUp, TriangleAlert, Users } from 'lucide-react'
import { useNow, useSafety } from '../store/SafetyStore'
import { CAMERAS, SCHOOL_NAME } from '../data/mock'
import {
  avgResponseMs,
  camerasOnline,
  createdWithin,
  isOpen,
  ofTypes,
  precision,
  resolvedRecently,
  safetyScore,
  scoreLabel,
  sortAlerts,
} from '../lib/metrics'
import { cx, formatDuration } from '../lib/format'
import type { DetectionModule } from '../types'
import { Card, Toggle } from '../components/ui'
import { AlertCard } from '../components/AlertCard'
import { CameraGrid } from '../components/CameraGrid'

function Stat({ label, value, sub, icon: Icon, dot, highlight, children }: {
  label: string
  value: ReactNode
  sub: ReactNode
  icon: ComponentType<{ className?: string }>
  dot?: string
  highlight?: boolean
  children?: ReactNode
}) {
  return (
    <Card className={cx('p-4', highlight && 'border-teal-500/30 bg-gradient-to-br from-teal-500/15 to-panel')}>
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="flex items-center gap-1.5">
          {dot && <span className={cx('size-1.5 rounded-full', dot)} />}
          {label}
        </span>
        <Icon className={cx('size-4', highlight ? 'text-teal-300' : 'text-slate-500')} />
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
      {children}
    </Card>
  )
}

function Capability({ module, title, description, icon: Icon, tone, stats }: {
  module: DetectionModule
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  tone: string
  stats: [string, string][]
}) {
  const { settings, toggleModule } = useSafety()
  const on = settings.modules[module]
  return (
    <Card className={cx('p-4 transition-opacity', !on && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', tone)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{title}</h3>
            <span className={cx('flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold', on ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/20 text-slate-400')}>
              <CircleCheck className="size-3" /> {on ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="text-xs text-muted">{description}</p>
        </div>
        <Toggle label={`${title} ${on ? 'on' : 'off'}`} checked={on} onChange={() => toggleModule(module)} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
        {stats.map(([v, l]) => (
          <div key={l}>
            <div className="text-lg font-bold text-white">{v}</div>
            <div className="text-[11px] text-muted">{l}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

type Filter = 'all' | 'active' | 'resolved'

export function Dashboard() {
  const { alerts } = useSafety()
  const now = useNow()
  const [filter, setFilter] = useState<Filter>('all')

  const open = alerts.filter(isOpen)
  const score = safetyScore(alerts)
  const { label, tone } = scoreLabel(score)
  const avg = avgResponseMs(alerts)
  const online = camerasOnline(CAMERAS)

  const behavior = ofTypes(alerts, ['bullying', 'fight'])
  const weapon = ofTypes(alerts, ['weapon'])
  const access = ofTypes(alerts, ['tailgating', 'intruder'])
  const pct = (p: number | null) => (p === null ? '—' : `${(p * 100).toFixed(0)}%`)
  const dur = (ms: number | null) => (ms === null ? '—' : formatDuration(ms))

  const shown = sortAlerts(
    alerts.filter((a) => (filter === 'all' ? true : filter === 'active' ? isOpen(a) : !isOpen(a))),
  ).slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security Dashboard</h1>
          <p className="text-sm text-muted">{SCHOOL_NAME} - Real-time AI-powered safety monitoring</p>
        </div>
        <span className="flex items-center gap-1.5 text-sm text-emerald-400">
          <span className="size-2 animate-pulse rounded-full bg-emerald-400" /> Live Monitoring
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat
          highlight
          label="Safety Score"
          icon={ShieldCheck}
          value={
            <span>
              <span className={tone === 'green' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-300' : 'text-red-400'}>{score}</span>
              <span className="text-base font-medium text-muted"> /100</span>
            </span>
          }
          sub={
            <span className="flex items-center gap-1">
              <span className={tone === 'green' ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-300' : 'text-red-400'}>{label}</span>
              <TrendingUp className="size-3" /> 2.5% vs last week
            </span>
          }
        />
        <Stat label="Active Alerts" dot="bg-orange-400" icon={TriangleAlert} value={open.length} sub="Requiring attention" />
        <Stat label="Resolved Today" dot="bg-emerald-400" icon={CircleCheck} value={resolvedRecently(alerts, now)} sub="Issues addressed" />
        <Stat label="Cameras Online" dot="bg-sky-400" icon={Camera} value={`${online}/${CAMERAS.length}`} sub="AI-enabled monitoring" />
        <Stat label="Avg Response" icon={Clock} value={dur(avg)} sub="Detection → staff action" />
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
          <ShieldCheck className="size-4 text-emerald-400" /> AI Detection Capabilities
        </h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <Capability
            module="behavior"
            title="Bullying Detection"
            description="Real-time behavioral analysis for bullying, fights and aggressive behavior"
            icon={Users}
            tone="bg-orange-500/15 text-orange-400"
            stats={[
              [String(createdWithin(behavior, now).length), 'Today'],
              [String(createdWithin(behavior, now, 7 * 86_400_000).length), 'This Week'],
              [dur(avgResponseMs(behavior)), 'Avg Response'],
            ]}
          />
          <Capability
            module="weapon"
            title="Weapon Detection"
            description="Continuous scanning for firearms, knives, and other threats"
            icon={ShieldAlert}
            tone="bg-red-500/15 text-red-400"
            stats={[
              [String(weapon.length), 'Detected'],
              [String(weapon.filter((a) => a.status === 'resolved').length), 'Resolved'],
              [pct(precision(weapon)), 'Confirmed by staff'],
            ]}
          />
          <Capability
            module="access"
            title="Access Control"
            description="Monitor doors, gates, and perimeter for unauthorized access"
            icon={DoorOpen}
            tone="bg-indigo-500/15 text-indigo-300"
            stats={[
              [String(ofTypes(access, ['intruder']).length), 'Intrusions'],
              [String(ofTypes(access, ['tailgating']).length), 'Tailgating'],
              [String(access.filter(isOpen).length), 'Open now'],
            ]}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <TriangleAlert className="size-4 text-orange-400" /> Live Alerts
              {open.length > 0 && <span className="rounded-md bg-red-600 px-1.5 text-xs font-semibold text-white">{open.length}</span>}
            </h2>
            <div className="flex rounded-lg bg-panel-2 p-0.5 text-xs">
              {(['all', 'active', 'resolved'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cx('rounded-md px-2.5 py-1 capitalize', filter === f ? 'bg-white/10 text-white' : 'text-muted hover:text-white')}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {shown.length ? (
              shown.map((a) => <AlertCard key={a.id} alert={a} />)
            ) : (
              <p className="flex items-center gap-2 rounded-lg bg-panel-2 p-4 text-sm text-muted">
                <Activity className="size-4" /> No alerts in this view.
              </p>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <Camera className="size-4 text-sky-400" /> Camera Feeds
            <span className="text-xs font-normal text-muted">({online}/{CAMERAS.length} online)</span>
          </h2>
          <CameraGrid cameras={CAMERAS} />
        </Card>
      </div>
    </div>
  )
}
