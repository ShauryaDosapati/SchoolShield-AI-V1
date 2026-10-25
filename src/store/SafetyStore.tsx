import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Alert, AlertStatus, AppNotification, DetectionModule, Settings } from '../types'
import {
  CAMERAS,
  CURRENT_USER,
  DEFAULT_SETTINGS,
  MODULE_FOR_TYPE,
  SCENARIOS,
  newId,
  seedAlerts,
  seedNotifications,
} from '../data/mock'
import type { Scenario } from '../data/mock'
import { playAlertTone } from '../lib/sound'

export interface Toast {
  id: string
  alertId: string
}

interface State {
  alerts: Alert[]
  notifications: AppNotification[]
  settings: Settings
  toasts: Toast[]
  hudAlertId: string | null
}

type Action =
  | { type: 'add_alert'; alert: Alert; notification: AppNotification; toast: Toast }
  | { type: 'set_status'; id: string; status: AlertStatus; note?: string; notification?: AppNotification }
  | { type: 'toggle_module'; module: DetectionModule }
  | { type: 'update_settings'; patch: Partial<Settings> }
  | { type: 'dismiss_toast'; id: string }
  | { type: 'open_hud'; id: string | null }
  | { type: 'mark_read'; id: string }
  | { type: 'mark_all_read' }
  | { type: 'delete_notification'; id: string }
  | { type: 'reset' }

const initialState = (): State => ({
  alerts: seedAlerts(),
  notifications: seedNotifications(),
  settings: DEFAULT_SETTINGS,
  toasts: [],
  hudAlertId: null,
})

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add_alert':
      return {
        ...state,
        alerts: [action.alert, ...state.alerts],
        notifications: [action.notification, ...state.notifications],
        toasts: [...state.toasts, action.toast].slice(-4),
      }
    case 'set_status':
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.id
            ? {
                ...a,
                status: action.status,
                history: [...a.history, { status: action.status, at: Date.now(), by: CURRENT_USER, note: action.note }],
              }
            : a,
        ),
        notifications: action.notification ? [action.notification, ...state.notifications] : state.notifications,
      }
    case 'toggle_module':
      return {
        ...state,
        settings: {
          ...state.settings,
          modules: { ...state.settings.modules, [action.module]: !state.settings.modules[action.module] },
        },
      }
    case 'update_settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'dismiss_toast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    case 'open_hud':
      return { ...state, hudAlertId: action.id }
    case 'mark_read':
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) }
    case 'mark_all_read':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }
    case 'delete_notification':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) }
    case 'reset':
      return initialState()
  }
}

const STATUS_VERB: Partial<Record<AlertStatus, string>> = {
  resolved: 'marked as resolved',
  false_positive: 'marked as a false positive',
}

interface Store extends State {
  trigger: (scenario?: Scenario) => Alert | null
  setStatus: (id: string, status: AlertStatus, note?: string) => void
  toggleModule: (module: DetectionModule) => void
  updateSettings: (patch: Partial<Settings>) => void
  dismissToast: (id: string) => void
  openHud: (id: string | null) => void
  markRead: (id: string) => void
  markAllRead: () => void
  deleteNotification: (id: string) => void
  reset: () => void
}

const SafetyContext = createContext<Store | null>(null)

export function SafetyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  const trigger = useCallback((scenario?: Scenario): Alert | null => {
    const { settings, alerts } = stateRef.current
    const enabled = SCENARIOS.filter((s) => settings.modules[MODULE_FOR_TYPE[s.type]])
    // Auto-simulation rarely produces weapon alerts; an explicit trigger always honors the choice.
    const pool = scenario ? [scenario] : enabled.filter((s) => s.type !== 'weapon' || Math.random() < 0.15)
    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (!pick || !settings.modules[MODULE_FOR_TYPE[pick.type]]) return null
    // Don't stack a second open alert of the same type on the same camera.
    if (alerts.some((a) => a.cameraId === pick.cameraId && a.type === pick.type && a.status === 'active')) return null

    const cam = CAMERAS.find((c) => c.id === pick.cameraId)!
    const now = Date.now()
    const alert: Alert = {
      id: newId('ALT'),
      type: pick.type,
      title: pick.title,
      description: pick.description,
      severity: pick.severity,
      status: 'active',
      cameraId: cam.id,
      location: cam.location,
      zoneId: cam.zoneId,
      confidence: 0.78 + Math.random() * 0.19,
      createdAt: now,
      history: [{ status: 'active', at: now, by: 'SchoolShield AI' }],
    }
    dispatch({
      type: 'add_alert',
      alert,
      notification: {
        id: newId('N'),
        kind: pick.severity === 'low' ? 'info' : 'alert',
        title: `${pick.title} - ${cam.location}`,
        body: pick.description,
        at: now,
        read: false,
      },
      toast: { id: newId('T'), alertId: alert.id },
    })
    if (settings.sound) playAlertTone(alert.severity)
    if (alert.severity === 'critical') dispatch({ type: 'open_hud', id: alert.id })
    return alert
  }, [])

  const setStatus = useCallback((id: string, status: AlertStatus, note?: string) => {
    const alert = stateRef.current.alerts.find((a) => a.id === id)
    if (!alert) return
    const verb = STATUS_VERB[status]
    dispatch({
      type: 'set_status',
      id,
      status,
      note,
      notification: verb
        ? {
            id: newId('N'),
            kind: 'resolved',
            title: status === 'resolved' ? 'Incident Resolved' : 'False Positive Recorded',
            body: `The ${alert.title.replace(' Detected', '').toLowerCase()} incident at ${alert.location} has been ${verb} by ${CURRENT_USER}.`,
            at: Date.now(),
            read: false,
          }
        : undefined,
    })
  }, [])

  // Auto-simulation: periodically raise a random incident while enabled.
  const { autoSimulate, simulateEverySec } = state.settings
  useEffect(() => {
    if (!autoSimulate) return
    const id = window.setInterval(() => trigger(), simulateEverySec * 1000)
    return () => window.clearInterval(id)
  }, [autoSimulate, simulateEverySec, trigger])

  const store = useMemo<Store>(
    () => ({
      ...state,
      trigger,
      setStatus,
      toggleModule: (module) => dispatch({ type: 'toggle_module', module }),
      updateSettings: (patch) => dispatch({ type: 'update_settings', patch }),
      dismissToast: (id) => dispatch({ type: 'dismiss_toast', id }),
      openHud: (id) => dispatch({ type: 'open_hud', id }),
      markRead: (id) => dispatch({ type: 'mark_read', id }),
      markAllRead: () => dispatch({ type: 'mark_all_read' }),
      deleteNotification: (id) => dispatch({ type: 'delete_notification', id }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state, trigger, setStatus],
  )

  return <SafetyContext.Provider value={store}>{children}</SafetyContext.Provider>
}

export function useSafety(): Store {
  const ctx = useContext(SafetyContext)
  if (!ctx) throw new Error('useSafety must be used inside <SafetyProvider>')
  return ctx
}

/** Re-renders every `intervalMs` so relative timestamps ("16m ago") stay fresh. */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
