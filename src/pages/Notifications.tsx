import { Bell, CircleCheck, Clock, Trash2, TriangleAlert } from 'lucide-react'
import { useNow, useSafety } from '../store/SafetyStore'
import { cx, timeAgo } from '../lib/format'
import type { NotificationKind } from '../types'
import { PageHeader } from '../components/ui'

const ICON: Record<NotificationKind, { icon: typeof Bell; tone: string }> = {
  alert: { icon: TriangleAlert, tone: 'text-red-400' },
  warning: { icon: TriangleAlert, tone: 'text-orange-400' },
  resolved: { icon: CircleCheck, tone: 'text-emerald-400' },
  info: { icon: Bell, tone: 'text-indigo-300' },
}

export function Notifications() {
  const { notifications, markAllRead, markRead, deleteNotification } = useSafety()
  const now = useNow()
  const unread = notifications.filter((n) => !n.read).length
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle="Stay updated on security events and system alerts"
        right={
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md bg-panel-2 px-2 py-1 font-medium">{unread} unread</span>
            <button onClick={markAllRead} disabled={!unread} className="rounded-md border border-line px-2.5 py-1 font-medium hover:bg-white/5 disabled:opacity-40">
              Mark all as read
            </button>
          </div>
        }
      />
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <h2 className="border-b border-line px-5 py-4 font-semibold text-white">Recent Notifications</h2>
        <ul>
          {notifications.map((n) => {
            const { icon: Icon, tone } = ICON[n.kind]
            return (
              <li key={n.id} className={cx('flex gap-3 border-b border-line/60 px-5 py-4 last:border-0', !n.read && 'bg-white/[0.025]')}>
                <Icon className={cx('mt-0.5 size-4 shrink-0', tone)} />
                <button onClick={() => markRead(n.id)} className="min-w-0 flex-1 text-left">
                  <p className={cx('font-medium', n.read ? 'text-slate-300' : 'text-white')}>{n.title}</p>
                  <p className="text-sm text-muted">{n.body}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock className="size-3" /> {timeAgo(n.at, now)}</p>
                </button>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-400" aria-label="Unread" />}
                <button onClick={() => deleteNotification(n.id)} aria-label="Delete notification" className="self-start rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white">
                  <Trash2 className="size-4" />
                </button>
              </li>
            )
          })}
          {!notifications.length && <li className="p-8 text-center text-sm text-muted">You're all caught up.</li>}
        </ul>
      </div>
    </div>
  )
}
