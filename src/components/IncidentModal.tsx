import { useEffect } from 'react'
import { Brain, Clock, History, Lock, LockOpen, MapPin, ShieldCheck, TriangleAlert, Video, X } from 'lucide-react'
import { useSafety } from '../store/SafetyStore'
import { CAMERAS, MODULE_FOR_TYPE } from '../data/mock'
import { cx, formatDateTime, formatDuration } from '../lib/format'
import { responseTime } from '../lib/metrics'
import type { Alert } from '../types'
import { CameraFeed } from './CameraFeed'
import { AlertActions } from './AlertCard'
import { SeverityBadge, STATUS_LABEL, StatusBadge } from './ui'

const MODULE_NAME = { behavior: 'Behavior analysis', weapon: 'Weapon detection', access: 'Access control', loitering: 'Zone dwell-time' }

function banner(alert: Alert): { headline: string; sub?: string; tone: 'red' | 'amber' | 'blue' } {
  const open = alert.status === 'active' || alert.status === 'investigating'
  switch (alert.type) {
    case 'weapon':
      return { headline: 'HIGH THREAT WEAPON ALERT – Possible Armed Individual', sub: open ? 'Lockdown Initiated' : 'Lockdown Lifted', tone: 'red' }
    case 'fight':
      return { headline: 'Fight Detected – Physical altercation in progress', tone: 'red' }
    case 'bullying':
      return { headline: 'Bullying Detected – Aggressive group behavior', tone: 'red' }
    case 'intruder':
      return { headline: 'Intruder Detected – Unauthorized individual on campus', tone: 'red' }
    case 'tailgating':
      return { headline: 'Tailgating Detected – Multiple individuals on a single badge scan', tone: 'amber' }
    case 'loitering':
      return { headline: 'Loitering Detected – Extended presence in restricted area', tone: 'blue' }
  }
}

export function IncidentModal() {
  const { alerts, hudAlertId, openHud } = useSafety()
  const alert = alerts.find((a) => a.id === hudAlertId)

  useEffect(() => {
    if (!alert) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && openHud(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [alert, openHud])

  if (!alert) return null
  const camera = CAMERAS.find((c) => c.id === alert.cameraId)!
  const b = banner(alert)
  const open = alert.status === 'active' || alert.status === 'investigating'
  const critical = alert.severity === 'critical' && alert.status === 'active'
  const rt = responseTime(alert)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => openHud(null)}>
      {critical && <div className="animate-flash-red pointer-events-none fixed inset-0 border-[6px] border-red-600 bg-red-600/10" />}
      <div role="dialog" aria-modal="true" aria-label={`${alert.title} live feed`} className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
          <div className="relative">
            <CameraFeed camera={camera} alert={alert} variant="hud" />
            <div className="pointer-events-none absolute left-3 top-10 flex max-w-[85%] flex-col items-start gap-1 sm:top-16">
              <div
                className={cx(
                  'rounded px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg sm:text-base',
                  b.tone === 'red' ? 'bg-red-600/90' : b.tone === 'amber' ? 'bg-amber-500/90 text-black' : 'bg-sky-600/90',
                )}
              >
                {b.headline}
              </div>
              {b.sub && (
                <div className={cx('flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-semibold text-white sm:text-sm', open ? 'bg-red-700/90' : 'bg-emerald-700/90')}>
                  {open ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />} {b.sub}
                </div>
              )}
            </div>
            <button
              autoFocus
              onClick={() => openHud(null)}
              aria-label="Close"
              className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="size-4" />
            </button>
            <div className="absolute inset-x-3 bottom-3 hidden rounded-xl border border-white/10 bg-black/65 p-4 backdrop-blur-md sm:block">
              <div className="flex flex-wrap items-center gap-2">
                <TriangleAlert className="size-5 text-orange-400" />
                <h2 className="text-lg font-bold text-white">{alert.title}</h2>
                <SeverityBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
              </div>
              <p className="mt-1 text-sm text-slate-300">{alert.description}</p>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Video className="size-3.5" />{alert.cameraId}</span>
                <span className="flex items-center gap-1"><MapPin className="size-3.5" />{alert.location}</span>
                <span className="flex items-center gap-1"><Clock className="size-3.5" />{formatDateTime(alert.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Mobile: details below the feed instead of overlaid */}
          <div className="border-b border-line p-4 sm:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">{alert.title}</h2>
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
            <p className="mt-1 text-sm text-slate-300">{alert.description}</p>
            <p className="mt-1 text-xs text-slate-400">{alert.cameraId} · {alert.location} · {formatDateTime(alert.createdAt)}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <ShieldCheck className="size-4 text-emerald-400" /> Human-in-the-loop: AI flags, staff decide.
            </p>
            <AlertActions alert={alert} size="md" />
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white"><Brain className="size-4 text-cyan-300" /> AI detection details</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-panel-2 p-2.5">
                  <dt className="text-xs text-muted">Model confidence</dt>
                  <dd className="font-semibold text-white">{(alert.confidence * 100).toFixed(1)}%</dd>
                </div>
                <div className="rounded-lg bg-panel-2 p-2.5">
                  <dt className="text-xs text-muted">Detection module</dt>
                  <dd className="font-semibold text-white">{MODULE_NAME[MODULE_FOR_TYPE[alert.type]]}</dd>
                </div>
                <div className="rounded-lg bg-panel-2 p-2.5">
                  <dt className="text-xs text-muted">Staff response time</dt>
                  <dd className="font-semibold text-white">{rt === null ? 'Awaiting response' : formatDuration(rt)}</dd>
                </div>
                <div className="rounded-lg bg-panel-2 p-2.5">
                  <dt className="text-xs text-muted">Identity data</dt>
                  <dd className="font-semibold text-white">None stored</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white"><History className="size-4 text-slate-300" /> Audit trail</h3>
              <ol className="space-y-2 border-l border-line pl-4">
                {alert.history.map((h, i) => (
                  <li key={i} className="relative text-sm">
                    <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-slate-400" />
                    <span className="font-medium text-white">{STATUS_LABEL[h.status]}</span>
                    <span className="text-muted"> · {h.by}</span>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(h.at)}
                      {h.note && ` — ${h.note}`}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
