import { CircleCheck, CircleX, Clock, Eye, MapPin, Play, RotateCcw, Video } from 'lucide-react'
import type { Alert } from '../types'
import { useNow, useSafety } from '../store/SafetyStore'
import { cx, formatDateTime, timeAgo } from '../lib/format'
import { AlertIcon, SeverityBadge, StatusBadge } from './ui'

export function AlertActions({ alert, size = 'sm' }: { alert: Alert; size?: 'sm' | 'md' }) {
  const { setStatus } = useSafety()
  const open = alert.status === 'active' || alert.status === 'investigating'
  const btn = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'
  if (!open) {
    return (
      <button onClick={() => setStatus(alert.id, 'active', 'Reopened')} className={cx('flex items-center gap-1.5 rounded-md text-muted hover:bg-white/5 hover:text-white', btn)}>
        <RotateCcw className="size-3.5" /> Reopen
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        disabled={alert.status === 'investigating'}
        onClick={() => setStatus(alert.id, 'investigating')}
        className={cx('flex items-center gap-1.5 rounded-md font-medium text-slate-200 hover:bg-white/5 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-transparent', btn)}
      >
        <Eye className="size-3.5" /> {alert.status === 'investigating' ? 'Investigating…' : 'Investigate'}
      </button>
      <button onClick={() => setStatus(alert.id, 'resolved')} className={cx('flex items-center gap-1.5 rounded-md bg-emerald-500 font-semibold text-emerald-950 hover:bg-emerald-400', btn)}>
        <CircleCheck className="size-3.5" /> Mark Resolved
      </button>
      <button onClick={() => setStatus(alert.id, 'false_positive')} className={cx('flex items-center gap-1.5 rounded-md text-slate-300 hover:bg-white/5', btn)}>
        <CircleX className="size-3.5" /> False Positive
      </button>
    </div>
  )
}

export function AlertCard({ alert, variant = 'compact' }: { alert: Alert; variant?: 'compact' | 'full' }) {
  const { openHud } = useSafety()
  const now = useNow()
  const open = alert.status === 'active' || alert.status === 'investigating'
  const fresh = now - alert.createdAt < 60_000 && alert.status === 'active'

  return (
    <div
      className={cx(
        'rounded-xl border p-4 transition-colors',
        open && (alert.severity === 'critical' || alert.severity === 'high')
          ? 'border-red-500/25 bg-red-950/20'
          : open
            ? 'border-amber-500/20 bg-amber-950/10'
            : 'border-line bg-panel-2/50',
        fresh && 'animate-fade-up',
      )}
    >
      <div className="flex items-start gap-3">
        <AlertIcon type={alert.type} severity={alert.severity} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{alert.title}</h3>
            {variant === 'full' && <SeverityBadge severity={alert.severity} />}
            <StatusBadge status={alert.status} />
            {fresh && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">NEW</span>}
          </div>
          <p className="mt-1 text-sm text-muted">{alert.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Video className="size-3.5" /> {alert.cameraId}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {alert.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {variant === 'full' ? formatDateTime(alert.createdAt) : timeAgo(alert.createdAt, now)}
            </span>
          </div>
        </div>
        {variant === 'compact' && (
          <button onClick={() => openHud(alert.id)} aria-label="View live feed" className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white">
            <Play className="size-4" />
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
        {variant === 'full' && (
          <button onClick={() => openHud(alert.id)} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-200 hover:bg-white/5">
            <Play className="size-3.5" /> View HUD
          </button>
        )}
        <AlertActions alert={alert} />
      </div>
    </div>
  )
}
