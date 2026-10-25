export type Severity = 'critical' | 'high' | 'medium' | 'low'

export type AlertStatus = 'active' | 'investigating' | 'resolved' | 'false_positive'

export type AlertType = 'bullying' | 'fight' | 'tailgating' | 'intruder' | 'loitering' | 'weapon'

/** Which detection module produces each alert type (toggled in Settings / Dashboard). */
export type DetectionModule = 'behavior' | 'weapon' | 'access' | 'loitering'

export type SceneKind = 'hallway' | 'entrance' | 'cafeteria' | 'parking' | 'gym' | 'outdoor' | 'classroom'

export interface StatusChange {
  status: AlertStatus
  at: number
  by: string
  note?: string
}

export interface Alert {
  id: string
  type: AlertType
  title: string
  description: string
  severity: Severity
  status: AlertStatus
  cameraId: string
  location: string
  zoneId: string
  confidence: number
  createdAt: number
  history: StatusChange[]
}

export type CameraStatus = 'online' | 'offline' | 'maintenance'

export interface Camera {
  id: string
  name: string
  location: string
  zoneId: string
  status: CameraStatus
  scene: SceneKind
  /** Optional real clip/image (e.g. /clips/cam-003.mp4). Falls back to the simulated feed. */
  clipUrl?: string
}

export interface Zone {
  id: string
  name: string
  kind: string
}

export type NotificationKind = 'alert' | 'resolved' | 'info' | 'warning'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  at: number
  read: boolean
}

export interface Settings {
  modules: Record<DetectionModule, boolean>
  sound: boolean
  email: boolean
  push: boolean
  autoSimulate: boolean
  simulateEverySec: number
}
