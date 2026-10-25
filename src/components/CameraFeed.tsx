import { useEffect, useRef, useState } from 'react'
import { CameraOff, Wrench } from 'lucide-react'
import type { Alert, Camera } from '../types'
import { SceneSim } from '../sim/scene'
import type { SceneConfig } from '../sim/scene'
import { cx } from '../lib/format'

interface Props {
  camera: Camera
  /** The incident to visualise on this feed, if any. */
  alert?: Alert | null
  variant?: 'tile' | 'hud'
  className?: string
}

function useClock(enabled: boolean) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [enabled])
  return now
}

export function CameraFeed({ camera, alert, variant = 'tile', className }: Props) {
  const hud = variant === 'hud'
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<SceneSim | null>(null)
  const now = useClock(hud)

  const incidentShown = alert && (alert.status === 'active' || alert.status === 'investigating' || hud)
  const config: SceneConfig = {
    scene: camera.scene,
    seed: parseInt(camera.id.replace(/\D/g, ''), 10) || 1,
    incident: incidentShown ? alert.type : null,
    severity: incidentShown ? alert.severity : null,
    confidence: alert?.confidence ?? 0.9,
    showTracking: hud,
  }
  const configRef = useRef(config)
  configRef.current = config
  simRef.current?.update(config)

  useEffect(() => {
    if (camera.status !== 'online' || camera.clipUrl) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    simRef.current = new SceneSim(configRef.current)

    const dpr = hud ? Math.min(2, window.devicePixelRatio || 1) : 1
    const fps = hud ? 30 : 12
    let visible = true
    let raf = 0
    let last = 0

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(wrap)

    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || ms - last < 1000 / fps) return
      last = ms
      simRef.current?.draw(ctx, canvas.width, canvas.height, ms / 1000)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [camera.id, camera.status, camera.clipUrl, hud])

  const open = alert && (alert.status === 'active' || alert.status === 'investigating')
  const ring = open
    ? alert.severity === 'critical' || alert.severity === 'high'
      ? 'ring-2 ring-red-500/80'
      : 'ring-2 ring-amber-400/70'
    : ''

  return (
    <div ref={wrapRef} className={cx('relative aspect-video overflow-hidden bg-black', ring, className)}>
      {camera.status === 'online' ? (
        camera.clipUrl ? (
          /\.(mp4|webm|mov)$/i.test(camera.clipUrl) ? (
            <video src={camera.clipUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <img src={camera.clipUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-800/60 text-slate-400">
          {camera.status === 'maintenance' ? <Wrench className="size-5" /> : <CameraOff className="size-5" />}
          <span className="text-[11px]">{camera.status === 'maintenance' ? 'Under Maintenance' : 'Offline'}</span>
        </div>
      )}

      {camera.status === 'online' && (
        <>
          <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5">
            <span className={cx('flex items-center gap-1 rounded px-1.5 py-0.5 font-bold text-white', hud ? 'bg-red-600 text-xs' : 'bg-red-600/90 text-[9px]')}>
              <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </span>
            <span className={cx('rounded bg-black/60 px-1.5 py-0.5 font-mono text-white/90', hud ? 'text-xs' : 'text-[9px]')}>{camera.id}</span>
          </div>
          {hud && (
            <div className="pointer-events-none absolute right-12 top-2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white/90">
              {now.toLocaleDateString()} {now.toLocaleTimeString()}
            </div>
          )}
          {hud && (
            <div className="pointer-events-none absolute right-2 top-9 rounded bg-black/60 px-2 py-0.5 text-[10px] text-cyan-200/90">
              Pose-only analysis · no facial recognition
            </div>
          )}
        </>
      )}
    </div>
  )
}
