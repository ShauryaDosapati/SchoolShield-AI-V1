import type {
  Alert,
  AlertType,
  AppNotification,
  Camera,
  DetectionModule,
  Severity,
  Settings,
  Zone,
} from '../types'

export const SCHOOL_NAME = 'WWP North High School'
export const CURRENT_USER = 'You (Security Lead)'

export const ZONES: Zone[] = [
  { id: 'main-entrance', name: 'Main Entrance', kind: 'Entrance Zone' },
  { id: 'east-wing', name: 'East Wing Hallway', kind: 'Hallway Zone' },
  { id: 'cafeteria', name: 'Cafeteria', kind: 'Cafeteria Zone' },
  { id: 'west-classrooms', name: 'West Classrooms', kind: 'Classroom Zone' },
  { id: 'parking', name: 'Parking Lot', kind: 'Parking Zone' },
  { id: 'perimeter', name: 'Perimeter Fence', kind: 'Perimeter Zone' },
  { id: 'gym', name: 'Gymnasium', kind: 'Gym Zone' },
  { id: 'playground', name: 'Playground', kind: 'Playground Zone' },
]

export const CAMERAS: Camera[] = [
  { id: 'CAM-001', name: 'Main Entrance - Front', location: 'Main Entrance', zoneId: 'main-entrance', status: 'online', scene: 'entrance' },
  { id: 'CAM-002', name: 'Main Entrance - Side', location: 'Main Entrance', zoneId: 'main-entrance', status: 'online', scene: 'entrance' },
  { id: 'CAM-003', name: 'East Wing - North', location: 'East Wing Hallway', zoneId: 'east-wing', status: 'online', scene: 'hallway' },
  { id: 'CAM-004', name: 'East Wing - South', location: 'East Wing Hallway', zoneId: 'east-wing', status: 'online', scene: 'hallway' },
  { id: 'CAM-005', name: 'Cafeteria - Main Hall', location: 'Cafeteria', zoneId: 'cafeteria', status: 'online', scene: 'cafeteria' },
  { id: 'CAM-006', name: 'Cafeteria - Kitchen', location: 'Cafeteria', zoneId: 'cafeteria', status: 'maintenance', scene: 'cafeteria' },
  { id: 'CAM-007', name: 'Parking Lot - East', location: 'Parking Lot', zoneId: 'parking', status: 'online', scene: 'parking' },
  { id: 'CAM-008', name: 'Parking Lot - West', location: 'Parking Lot', zoneId: 'parking', status: 'offline', scene: 'parking' },
  { id: 'CAM-009', name: 'Gymnasium - Main', location: 'Gymnasium', zoneId: 'gym', status: 'online', scene: 'gym' },
  { id: 'CAM-010', name: 'Playground - Open Area', location: 'Playground', zoneId: 'playground', status: 'online', scene: 'outdoor' },
  { id: 'CAM-011', name: 'West Classrooms - Hall', location: 'West Classrooms', zoneId: 'west-classrooms', status: 'online', scene: 'classroom' },
  { id: 'CAM-012', name: 'Perimeter - North Fence', location: 'Perimeter Fence', zoneId: 'perimeter', status: 'online', scene: 'outdoor' },
]

export const MODULE_FOR_TYPE: Record<AlertType, DetectionModule> = {
  bullying: 'behavior',
  fight: 'behavior',
  weapon: 'weapon',
  tailgating: 'access',
  intruder: 'access',
  loitering: 'loitering',
}

export interface Scenario {
  type: AlertType
  label: string
  title: string
  description: string
  severity: Severity
  cameraId: string
}

/** Incidents the presenter can trigger on demand, and that the auto-simulator draws from. */
export const SCENARIOS: Scenario[] = [
  {
    type: 'fight',
    label: 'Physical fight',
    title: 'Fight Detected',
    description: 'Physical altercation detected near the gymnasium entrance. Security has been notified.',
    severity: 'high',
    cameraId: 'CAM-009',
  },
  {
    type: 'bullying',
    label: 'Bullying / aggression',
    title: 'Bullying Detected',
    description: 'Group cornering a student near the lockers. Aggressive posture sustained for 20s.',
    severity: 'high',
    cameraId: 'CAM-004',
  },
  {
    type: 'tailgating',
    label: 'Tailgating at entrance',
    title: 'Tailgating Detected',
    description: 'Two individuals entered on a single badge scan at the side entrance.',
    severity: 'medium',
    cameraId: 'CAM-002',
  },
  {
    type: 'loitering',
    label: 'Loitering in restricted area',
    title: 'Loitering Detected',
    description: 'Individual remained near the playground fence after dismissal for over 10 minutes.',
    severity: 'low',
    cameraId: 'CAM-010',
  },
  {
    type: 'intruder',
    label: 'Unauthorized access',
    title: 'Intruder Detected',
    description: 'Unidentified adult entered the west classroom wing without a visitor badge.',
    severity: 'high',
    cameraId: 'CAM-011',
  },
  {
    type: 'weapon',
    label: 'Possible weapon',
    title: 'Weapon Detected',
    description: 'Object resembling a firearm flagged at the main entrance. Verify immediately.',
    severity: 'critical',
    cameraId: 'CAM-001',
  },
]

const MIN = 60_000
const HOUR = 60 * MIN

let idCounter = 100
export const newId = (prefix: string) => `${prefix}-${++idCounter}`

export function seedAlerts(now = Date.now()): Alert[] {
  return [
    {
      id: 'ALT-001',
      type: 'bullying',
      title: 'Bullying Detected',
      description: 'Bullying behavior detected between individuals near lockers. Security has been notified.',
      severity: 'high',
      status: 'active',
      cameraId: 'CAM-003',
      location: 'East Wing Hallway',
      zoneId: 'east-wing',
      confidence: 0.91,
      createdAt: now - 16 * MIN,
      history: [{ status: 'active', at: now - 16 * MIN, by: 'SchoolShield AI' }],
    },
    {
      id: 'ALT-002',
      type: 'intruder',
      title: 'Intruder Detected',
      description: 'Unauthorized individual detected near perimeter. Security has been dispatched to investigate.',
      severity: 'high',
      status: 'active',
      cameraId: 'CAM-012',
      location: 'Perimeter Fence',
      zoneId: 'perimeter',
      confidence: 0.88,
      createdAt: now - 4 * HOUR,
      history: [{ status: 'active', at: now - 4 * HOUR, by: 'SchoolShield AI' }],
    },
    {
      id: 'ALT-003',
      type: 'tailgating',
      title: 'Tailgating Detected',
      description: 'Multiple individuals entered on a single badge scan. Verification in progress.',
      severity: 'medium',
      status: 'investigating',
      cameraId: 'CAM-001',
      location: 'Main Entrance',
      zoneId: 'main-entrance',
      confidence: 0.83,
      createdAt: now - 26 * MIN,
      history: [
        { status: 'active', at: now - 26 * MIN, by: 'SchoolShield AI' },
        { status: 'investigating', at: now - 26 * MIN + 14_000, by: 'Officer Johnson' },
      ],
    },
    {
      id: 'ALT-004',
      type: 'loitering',
      title: 'Loitering Detected',
      description: 'Individual loitering near vehicle area for extended period. Staff verified - parent waiting for pickup.',
      severity: 'low',
      status: 'resolved',
      cameraId: 'CAM-007',
      location: 'Parking Lot',
      zoneId: 'parking',
      confidence: 0.76,
      createdAt: now - 2 * HOUR,
      history: [
        { status: 'active', at: now - 2 * HOUR, by: 'SchoolShield AI' },
        { status: 'investigating', at: now - 2 * HOUR + 16_000, by: 'Ms. Patel' },
        { status: 'resolved', at: now - 2 * HOUR + 4 * MIN, by: 'Ms. Patel', note: 'Parent waiting for pickup.' },
      ],
    },
    {
      id: 'ALT-005',
      type: 'weapon',
      title: 'Weapon Detected',
      description: 'Object flagged by weapon detection. Security responded and confiscated item. Situation resolved.',
      severity: 'critical',
      status: 'resolved',
      cameraId: 'CAM-001',
      location: 'Main Entrance',
      zoneId: 'main-entrance',
      confidence: 0.94,
      createdAt: now - 6 * HOUR,
      history: [
        { status: 'active', at: now - 6 * HOUR, by: 'SchoolShield AI' },
        { status: 'investigating', at: now - 6 * HOUR + 12_000, by: 'Officer Johnson' },
        { status: 'resolved', at: now - 6 * HOUR + 9 * MIN, by: 'Officer Johnson', note: 'Item confiscated, SRO notified.' },
      ],
    },
  ]
}

export function seedNotifications(now = Date.now()): AppNotification[] {
  return [
    {
      id: 'N-1',
      kind: 'warning',
      title: 'Fight Detected - Hallway B',
      body: 'AI detected a physical altercation near the gymnasium entrance. Security has been notified.',
      at: now - HOUR,
      read: false,
    },
    {
      id: 'N-2',
      kind: 'resolved',
      title: 'Incident Resolved',
      body: 'The tailgating incident at Main Entrance has been marked as resolved by Officer Johnson.',
      at: now - HOUR - 5 * MIN,
      read: false,
    },
    {
      id: 'N-3',
      kind: 'info',
      title: 'Camera Maintenance Complete',
      body: 'Camera CAM-006 in the Parking Lot has been brought back online after scheduled maintenance.',
      at: now - 3 * HOUR,
      read: true,
    },
    {
      id: 'N-4',
      kind: 'warning',
      title: 'Unauthorized Access Attempt',
      body: 'An unauthorized access attempt was detected at the East Entrance. The door remained locked.',
      at: now - 6 * HOUR,
      read: true,
    },
    {
      id: 'N-5',
      kind: 'info',
      title: 'Daily Safety Report',
      body: 'Your daily safety report is ready. Overall safety score: 87/100 (Good).',
      at: now - 24 * HOUR,
      read: true,
    },
  ]
}

export const DEFAULT_SETTINGS: Settings = {
  modules: { behavior: true, weapon: true, access: true, loitering: true },
  sound: true,
  email: true,
  push: true,
  autoSimulate: false,
  simulateEverySec: 30,
}
