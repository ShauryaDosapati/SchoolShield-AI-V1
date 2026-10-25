import { useEffect, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import type { Alert, Camera } from '../types'
import { useSafety } from '../store/SafetyStore'
import { isOpen, SEVERITY_RANK } from '../lib/metrics'
import { cx } from '../lib/format'
import { CameraFeed } from './CameraFeed'

const STATUS_PILL = {
  online: 'bg-emerald-500/15 text-emerald-400',
  offline: 'bg-red-500/15 text-red-400',
  maintenance: 'bg-amber-500/15 text-amber-300',
}

/** Most severe open alert on a camera (what its feed should visualise). */
export function cameraAlert(alerts: Alert[], cameraId: string): Alert | null {
  return (
    alerts
      .filter((a) => a.cameraId === cameraId && isOpen(a))
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.createdAt - a.createdAt)[0] ?? null
  )
}

function CameraModal({ camera, onClose }: { camera: Camera; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={camera.name} className="w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-panel" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <CameraFeed camera={camera} variant="hud" />
          <button autoFocus onClick={onClose} aria-label="Close" className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80">
            <X className="size-4" />
          </button>
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold text-white">{camera.name}</p>
            <p className="text-sm text-muted">{camera.location} · AI monitoring: no incidents detected</p>
          </div>
          <span className={cx('rounded px-2 py-0.5 text-xs font-medium capitalize', STATUS_PILL[camera.status])}>{camera.status}</span>
        </div>
      </div>
    </div>
  )
}

export function CameraGrid({ cameras, size = 'sm' }: { cameras: Camera[]; size?: 'sm' | 'md' }) {
  const { alerts, openHud } = useSafety()
  const [viewing, setViewing] = useState<Camera | null>(null)

  return (
    <>
      <div className={cx('grid gap-3', size === 'md' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
        {cameras.map((cam) => {
          const alert = cameraAlert(alerts, cam.id)
          const detections = alerts.filter((a) => a.cameraId === cam.id && Date.now() - a.createdAt < 86_400_000).length
          return (
            <button
              key={cam.id}
              disabled={cam.status !== 'online'}
              onClick={() => (alert ? openHud(alert.id) : setViewing(cam))}
              className="group overflow-hidden rounded-lg border border-line bg-panel-2 text-left transition hover:border-slate-500 disabled:cursor-default disabled:hover:border-line"
            >
              <CameraFeed camera={cam} alert={alert} />
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <div className="min-w-0">
                  <p className={cx('truncate font-medium text-white', size === 'md' ? 'text-sm' : 'text-xs')}>{cam.name}</p>
                  <p className="flex items-center gap-1 truncate text-[11px] text-muted">
                    {size === 'md' && <MapPin className="size-3" />}
                    {cam.location}
                    {size === 'md' && ` · ${detections} detection${detections === 1 ? '' : 's'} today`}
                  </p>
                </div>
                <span className={cx('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', STATUS_PILL[cam.status])}>{cam.status}</span>
              </div>
            </button>
          )
        })}
      </div>
      {viewing && <CameraModal camera={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
