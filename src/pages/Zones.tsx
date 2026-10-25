import { Camera, CircleCheck, Shield, TriangleAlert, Building2 } from 'lucide-react'
import { useSafety } from '../store/SafetyStore'
import { CAMERAS, ZONES } from '../data/mock'
import { isOpen, zoneRisk } from '../lib/metrics'
import type { RiskLevel } from '../lib/metrics'
import { cx } from '../lib/format'
import { Card, PageHeader } from '../components/ui'

const RISK: Record<RiskLevel, { label: string; pill: string; bar: string; pct: number }> = {
  safe: { label: 'Safe', pill: 'bg-emerald-500/15 text-emerald-400', bar: 'bg-emerald-500', pct: 15 },
  moderate: { label: 'Moderate', pill: 'bg-sky-500/15 text-sky-300', bar: 'bg-sky-400', pct: 45 },
  elevated: { label: 'Elevated', pill: 'bg-amber-500/15 text-amber-300', bar: 'bg-amber-400', pct: 75 },
  critical: { label: 'Critical', pill: 'bg-red-500/15 text-red-400', bar: 'bg-red-500', pct: 100 },
}

export function Zones() {
  const { alerts } = useSafety()
  const zones = ZONES.map((z) => {
    const za = alerts.filter((a) => a.zoneId === z.id)
    return { ...z, risk: zoneRisk(za), open: za.filter(isOpen).length, cameras: CAMERAS.filter((c) => c.zoneId === z.id).length }
  })
  const safe = zones.filter((z) => z.risk === 'safe').length

  return (
    <div>
      <PageHeader title="Zone Management" subtitle="Monitor security zones across campus. Risk updates live from open alerts." />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">Safe Zones <Shield className="size-4 text-emerald-400" /></div>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{safe}</p>
          <p className="text-xs text-muted">Operating normally</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">Elevated Risk <TriangleAlert className="size-4 text-amber-300" /></div>
          <p className="mt-1 text-2xl font-bold text-amber-300">{zones.length - safe}</p>
          <p className="text-xs text-muted">Require attention</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-muted">Total Cameras <Camera className="size-4 text-sky-400" /></div>
          <p className="mt-1 text-2xl font-bold text-white">{CAMERAS.length}</p>
          <p className="text-xs text-muted">Across all zones</p>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {zones.map((z) => {
          const r = RISK[z.risk]
          return (
            <Card key={z.id} className="p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-panel-2 text-slate-300">
                  <Building2 className="size-4" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{z.name}</p>
                  <p className="text-xs text-muted">{z.kind}</p>
                </div>
                <span className={cx('rounded px-2 py-0.5 text-[11px] font-semibold', r.pill)}>{r.label}</span>
              </div>
              <div className="mt-4 flex justify-between text-xs text-muted">
                <span>Risk Level</span>
                <span className="lowercase">{r.label}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className={cx('h-full rounded-full transition-all duration-700', r.bar)} style={{ width: `${r.pct}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Camera className="size-3.5" /> {z.cameras} camera{z.cameras === 1 ? '' : 's'}</span>
                {z.open ? (
                  <span className="flex items-center gap-1 text-orange-400"><TriangleAlert className="size-3.5" /> {z.open} active alert{z.open === 1 ? '' : 's'}</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400"><CircleCheck className="size-3.5" /> All clear</span>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
