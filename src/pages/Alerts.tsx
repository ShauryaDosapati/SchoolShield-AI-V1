import { useState } from 'react'
import { Filter, Search, TriangleAlert } from 'lucide-react'
import { useSafety } from '../store/SafetyStore'
import { sortAlerts } from '../lib/metrics'
import type { AlertStatus, Severity } from '../types'
import { PageHeader } from '../components/ui'
import { AlertCard } from '../components/AlertCard'

const selectCls = 'rounded-lg border border-line bg-panel-2 py-2 pl-8 pr-3 text-sm text-slate-200 outline-none focus:border-slate-500'

export function Alerts() {
  const { alerts } = useSafety()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<AlertStatus | 'all'>('all')
  const [severity, setSeverity] = useState<Severity | 'all'>('all')

  const active = alerts.filter((a) => a.status === 'active').length
  const investigating = alerts.filter((a) => a.status === 'investigating').length
  const needle = q.trim().toLowerCase()
  const shown = sortAlerts(
    alerts.filter(
      (a) =>
        (status === 'all' || a.status === status) &&
        (severity === 'all' || a.severity === severity) &&
        (!needle || [a.title, a.description, a.location, a.cameraId].some((s) => s.toLowerCase().includes(needle))),
    ),
  )

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Alert Management"
        subtitle="Review and manage security alerts"
        right={
          <div className="flex gap-2 text-xs font-semibold">
            <span className="rounded bg-red-600 px-2 py-0.5 text-white">{active} Active</span>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">{investigating} Investigating</span>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-line bg-panel p-3">
        <label className="relative min-w-48 flex-1">
          <span className="sr-only">Search alerts</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alerts..." className={`${selectCls} w-full`} />
        </label>
        <label className="relative">
          <span className="sr-only">Status</span>
          <Filter className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <select value={status} onChange={(e) => setStatus(e.target.value as AlertStatus | 'all')} className={selectCls}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="false_positive">False Positive</option>
          </select>
        </label>
        <label className="relative">
          <span className="sr-only">Severity</span>
          <TriangleAlert className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity | 'all')} className={selectCls}>
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
      <div className="space-y-3">
        {shown.map((a) => (
          <AlertCard key={a.id} alert={a} variant="full" />
        ))}
        {!shown.length && <p className="rounded-xl border border-line bg-panel p-6 text-center text-sm text-muted">No alerts match these filters.</p>}
      </div>
    </div>
  )
}
