import type { ComponentType, ReactNode } from 'react'
import {
  Clock,
  DoorOpen,
  Footprints,
  Hourglass,
  ShieldAlert,
  Swords,
  Users,
} from 'lucide-react'
import type { AlertStatus, AlertType, Severity } from '../types'
import { cx } from '../lib/format'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-xl border border-line bg-panel', className)}>{children}</div>
}

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'bg-red-500/15 text-red-400 ring-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  low: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset', SEVERITY_STYLE[severity])}>
      {severity}
    </span>
  )
}

const STATUS_STYLE: Record<AlertStatus, string> = {
  active: 'bg-red-600 text-white',
  investigating: 'bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/40',
  resolved: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30',
  false_positive: 'bg-slate-500/20 text-slate-300 ring-1 ring-inset ring-slate-500/40',
}

export const STATUS_LABEL: Record<AlertStatus, string> = {
  active: 'Active',
  investigating: 'Investigating',
  resolved: 'Resolved',
  false_positive: 'False Positive',
}

export function StatusBadge({ status }: { status: AlertStatus }) {
  return <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-semibold', STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
}

export const TYPE_ICON: Record<AlertType, ComponentType<{ className?: string }>> = {
  bullying: Users,
  fight: Swords,
  tailgating: DoorOpen,
  intruder: Footprints,
  loitering: Hourglass,
  weapon: ShieldAlert,
}

const ICON_TONE: Record<Severity, string> = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-amber-500/15 text-amber-300',
  low: 'bg-sky-500/15 text-sky-300',
}

export function AlertIcon({ type, severity, className }: { type: AlertType; severity: Severity; className?: string }) {
  const Icon = TYPE_ICON[type] ?? Clock
  return (
    <span className={cx('grid size-9 shrink-0 place-items-center rounded-lg', ICON_TONE[severity], className)}>
      <Icon className="size-4" />
    </span>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400',
        checked ? 'bg-emerald-500' : 'bg-slate-600',
      )}
    >
      <span className={cx('absolute left-0 top-0.5 size-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  )
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      {right}
    </div>
  )
}
