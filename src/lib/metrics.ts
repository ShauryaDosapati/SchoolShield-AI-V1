import type { Alert, AlertType, Camera, Severity } from '../types'

const DAY = 24 * 60 * 60 * 1000
const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 20, high: 6, medium: 3, low: 1 }
export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export const isOpen = (a: Alert) => a.status === 'active' || a.status === 'investigating'

/** Time from detection until a person first acted on the alert. */
export function responseTime(a: Alert): number | null {
  const first = a.history.find((h) => h.status !== 'active')
  return first ? first.at - a.createdAt : null
}

export function avgResponseMs(alerts: Alert[]): number | null {
  const times = alerts.map(responseTime).filter((t): t is number => t !== null)
  if (!times.length) return null
  return times.reduce((a, b) => a + b, 0) / times.length
}

export function safetyScore(alerts: Alert[]): number {
  const penalty = alerts.filter(isOpen).reduce((sum, a) => sum + SEVERITY_WEIGHT[a.severity], 0)
  return Math.max(0, Math.min(100, 92 - penalty))
}

export function scoreLabel(score: number): { label: string; tone: 'green' | 'amber' | 'red' } {
  if (score >= 85) return { label: 'Excellent', tone: 'green' }
  if (score >= 70) return { label: 'Good', tone: 'green' }
  if (score >= 50) return { label: 'Fair', tone: 'amber' }
  return { label: 'At Risk', tone: 'red' }
}

export function resolvedRecently(alerts: Alert[], now: number): number {
  return alerts.filter((a) => {
    if (a.status !== 'resolved') return false
    const last = a.history[a.history.length - 1]
    return now - last.at < DAY
  }).length
}

export function ofTypes(alerts: Alert[], types: AlertType[]) {
  return alerts.filter((a) => types.includes(a.type))
}

export function createdWithin(alerts: Alert[], now: number, ms = DAY) {
  return alerts.filter((a) => now - a.createdAt < ms)
}

/** Share of closed alerts that staff confirmed as real (vs. marked false positive). */
export function precision(alerts: Alert[]): number | null {
  const confirmed = alerts.filter((a) => a.status === 'resolved').length
  const fp = alerts.filter((a) => a.status === 'false_positive').length
  if (confirmed + fp === 0) return null
  return confirmed / (confirmed + fp)
}

export type RiskLevel = 'safe' | 'moderate' | 'elevated' | 'critical'

export function zoneRisk(alerts: Alert[]): RiskLevel {
  const open = alerts.filter(isOpen)
  if (open.some((a) => a.severity === 'critical')) return 'critical'
  if (open.some((a) => a.severity === 'high')) return 'elevated'
  if (open.length) return 'moderate'
  return 'safe'
}

export const camerasOnline = (cams: Camera[]) => cams.filter((c) => c.status === 'online').length

export const sortAlerts = (alerts: Alert[]) =>
  [...alerts].sort((a, b) => {
    const oa = isOpen(a) ? 0 : 1
    const ob = isOpen(b) ? 0 : 1
    if (oa !== ob) return oa - ob
    if (oa === 0 && a.severity !== b.severity) return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    return b.createdAt - a.createdAt
  })
