import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useSafety } from '../store/SafetyStore'
import type { Toast } from '../store/SafetyStore'
import { cx } from '../lib/format'
import { AlertIcon, SeverityBadge } from './ui'

function ToastItem({ toast }: { toast: Toast }) {
  const { alerts, dismissToast, openHud } = useSafety()
  const alert = alerts.find((a) => a.id === toast.alertId)

  useEffect(() => {
    const id = window.setTimeout(() => dismissToast(toast.id), 8000)
    return () => window.clearTimeout(id)
  }, [toast.id, dismissToast])

  if (!alert) return null
  return (
    <div
      role="status"
      className={cx(
        'animate-slide-in pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] gap-3 rounded-xl border bg-panel/95 p-3 shadow-2xl backdrop-blur',
        alert.severity === 'critical' || alert.severity === 'high' ? 'border-red-500/50' : 'border-amber-500/40',
      )}
    >
      <AlertIcon type={alert.type} severity={alert.severity} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{alert.title}</p>
          <SeverityBadge severity={alert.severity} />
        </div>
        <p className="truncate text-xs text-muted">
          {alert.cameraId} · {alert.location}
        </p>
        <button
          onClick={() => {
            openHud(alert.id)
            dismissToast(toast.id)
          }}
          className="mt-1.5 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
        >
          View live feed
        </button>
      </div>
      <button onClick={() => dismissToast(toast.id)} aria-label="Dismiss" className="self-start text-slate-400 hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  )
}

export function Toaster() {
  const { toasts } = useSafety()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
