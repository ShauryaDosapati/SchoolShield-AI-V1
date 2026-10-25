/**
 * Procedural CCTV scene renderer. Draws a stylised school space (hallway, entrance,
 * gym, ...) with walking people, and — when an incident is active — the people
 * involved, their pose skeletons and an AI detection box. No faces are drawn or
 * "recognised": the demo mirrors the behaviour-not-identity design.
 */
import type { AlertType, SceneKind, Severity } from '../types'

export interface SceneConfig {
  scene: SceneKind
  seed: number
  incident: AlertType | null
  severity: Severity | null
  confidence: number
  /** Draw person boxes + skeletons for everyone (full HUD view), not just incident actors. */
  showTracking: boolean
}

interface Person {
  x: number
  z: number
  vx: number
  vz: number
  phase: number
  shirt: string
  pants: string
  skin: string
  hair: string
  height: number
  sitting: boolean
}

type Role = 'actor' | 'target' | 'bystander'
interface Actor extends Person {
  role: Role
  pose: 'walk' | 'stand' | 'fight' | 'point' | 'carry' | 'cower'
  facing: number
}

interface Pt {
  x: number
  y: number
}

const SHIRTS = ['#3d5a80', '#7a3b3b', '#5b6b4a', '#4a4e69', '#8d6e4c', '#2f4858', '#9a8c98', '#6b705c', '#3a3a3a', '#a26769', '#335c67', '#b08968']
const PANTS = ['#2b2d42', '#1f2937', '#3f4a5a', '#4b3f35', '#2e3440', '#5c5f66']
const SKINS = ['#e0b49a', '#c68e6e', '#8d5a3f', '#f1c9a5', '#a8704f', '#6b4430']
const HAIRS = ['#1b1b1b', '#3b2a20', '#5a3d2b', '#8a6a42', '#2a1d16']

const INCIDENT_COLOR: Record<Severity, string> = {
  critical: '#ff3b3b',
  high: '#ff5a4f',
  medium: '#f5b324',
  low: '#5fa8ff',
}

const SHORT_LABEL: Record<AlertType, string> = {
  bullying: 'AGGRESSION',
  fight: 'FIGHT',
  tailgating: 'TAILGATE',
  loitering: 'LOITER',
  intruder: 'NO BADGE',
  weapon: 'WEAPON?',
}

const INCIDENT_LABEL: Record<AlertType, string> = {
  bullying: 'AGGRESSIVE BEHAVIOR',
  fight: 'PHYSICAL ALTERCATION',
  tailgating: 'TAILGATE · 2 PERSONS / 1 BADGE',
  loitering: 'LOITERING',
  intruder: 'NO VISITOR BADGE',
  weapon: 'POSSIBLE FIREARM',
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Room {
  halfWidth: number
  depth: number
  ceiling: number
  outdoor: boolean
}

const ROOMS: Record<SceneKind, Room> = {
  hallway: { halfWidth: 1, depth: 4.5, ceiling: 1.7, outdoor: false },
  classroom: { halfWidth: 1, depth: 4.5, ceiling: 1.7, outdoor: false },
  entrance: { halfWidth: 1.3, depth: 2.6, ceiling: 1.9, outdoor: false },
  cafeteria: { halfWidth: 1.8, depth: 4, ceiling: 1.9, outdoor: false },
  gym: { halfWidth: 2.2, depth: 4.5, ceiling: 2.6, outdoor: false },
  outdoor: { halfWidth: 3, depth: 2.6, ceiling: 0, outdoor: true },
  parking: { halfWidth: 3, depth: 3.4, ceiling: 0, outdoor: true },
}

/** Where incident actors stand, per scene (world x, z). */
const ANCHORS: Record<SceneKind, [number, number]> = {
  hallway: [-0.4, 0.6],
  classroom: [-0.25, 0.6],
  entrance: [0.1, 0.8],
  cafeteria: [0.15, 0.5],
  gym: [0.2, 0.7],
  outdoor: [0.4, 1.0],
  parking: [0.5, 0.9],
}

export class SceneSim {
  private cfg: SceneConfig
  private rng: () => number
  private people: Person[] = []
  private actors: Actor[] = []
  private bg: HTMLCanvasElement | null = null
  private bgKey = ''
  private w = 0
  private h = 0
  private vpX = 0
  private vpY = 0

  constructor(cfg: SceneConfig) {
    this.cfg = cfg
    this.rng = mulberry32(cfg.seed * 9973 + 17)
    this.spawnCrowd()
    this.spawnActors()
  }

  update(cfg: SceneConfig) {
    const incidentChanged = cfg.incident !== this.cfg.incident
    this.cfg = cfg
    if (incidentChanged) this.spawnActors()
  }

  private room() {
    return ROOMS[this.cfg.scene]
  }

  private randomPerson(): Person {
    const r = this.rng
    const room = this.room()
    const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]
    const lateral = this.cfg.scene === 'outdoor' || this.cfg.scene === 'parking' || this.cfg.scene === 'gym' || this.cfg.scene === 'cafeteria'
    const speed = 0.18 + r() * 0.18
    return {
      x: (r() * 2 - 1) * (room.halfWidth - 0.3),
      z: 0.3 + r() * (room.depth - 0.7),
      vx: lateral ? (r() < 0.5 ? -1 : 1) * speed * (0.5 + r() * 0.5) : 0,
      vz: lateral ? (r() - 0.5) * 0.12 : (r() < 0.5 ? -1 : 1) * speed,
      phase: r() * Math.PI * 2,
      shirt: pick(SHIRTS),
      pants: pick(PANTS),
      skin: pick(SKINS),
      hair: pick(HAIRS),
      height: 0.88 + r() * 0.18,
      sitting: false,
    }
  }

  private spawnCrowd() {
    const counts: Record<SceneKind, number> = { hallway: 6, classroom: 4, entrance: 4, cafeteria: 5, gym: 6, outdoor: 3, parking: 2 }
    this.people = Array.from({ length: counts[this.cfg.scene] }, () => this.randomPerson())
    if (this.cfg.scene === 'cafeteria') {
      for (let i = 0; i < 8; i++) {
        const p = this.randomPerson()
        p.sitting = true
        p.vx = p.vz = 0
        p.x = (i % 2 ? 1 : -1) * (0.45 + this.rng() * 0.8)
        p.z = 1.15 + Math.floor(i / 2) * 0.8 + 0.12
        this.people.push(p)
      }
    }
  }

  private spawnActors() {
    const { incident, scene } = this.cfg
    this.actors = []
    if (!incident) return
    const [ax, az] = ANCHORS[scene]
    const mk = (role: Role, pose: Actor['pose'], x: number, z: number, facing = 0): Actor => ({
      ...this.randomPerson(),
      x,
      z,
      vx: 0,
      vz: 0,
      role,
      pose,
      facing,
    })
    switch (incident) {
      case 'bullying': {
        const target = mk('target', 'cower', ax - 0.15, az + 0.1)
        target.height = 0.86
        this.actors.push(target, mk('actor', 'point', ax + 0.12, az - 0.12, -1), mk('actor', 'point', ax + 0.22, az + 0.12, -1), mk('actor', 'stand', ax - 0.02, az - 0.28, -1))
        break
      }
      case 'fight':
        this.actors.push(
          mk('actor', 'fight', ax - 0.13, az, 1),
          mk('actor', 'fight', ax + 0.13, az, -1),
          mk('bystander', 'stand', ax - 0.5, az + 0.35),
          mk('bystander', 'stand', ax + 0.45, az + 0.4),
          mk('bystander', 'point', ax + 0.55, az - 0.2, -1),
        )
        break
      case 'tailgating':
        this.actors.push(mk('actor', 'walk', 0.05, 0.6), mk('actor', 'walk', 0.12, 0.45))
        break
      case 'loitering':
        this.actors.push(mk('actor', 'stand', ax, az))
        break
      case 'intruder':
        this.actors.push(mk('actor', 'walk', ax - 0.6, az))
        break
      case 'weapon':
        this.actors.push(mk('actor', 'carry', ax, az + 1.2))
        break
    }
  }

  // ---- projection ---------------------------------------------------------

  private proj(x: number, y: number, z: number): Pt & { s: number } {
    const s = 1 / (1 + z * 2.4)
    return {
      x: this.vpX + x * this.w * 0.55 * s,
      y: this.vpY + (this.h * 1.04 - this.vpY) * s - y * this.h * 0.6 * s,
      s,
    }
  }

  private quad(ctx: CanvasRenderingContext2D, pts: [number, number, number][], fill: string | CanvasGradient, stroke?: string) {
    ctx.beginPath()
    pts.forEach(([x, y, z], i) => {
      const p = this.proj(x, y, z)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  // ---- static background (cached per size) ------------------------------

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const room = this.room()
    const { w, h } = this
    const W = room.halfWidth
    const D = room.depth
    const C = room.ceiling
    const r = mulberry32(this.cfg.seed * 31 + 7)

    if (room.outdoor) {
      const sky = ctx.createLinearGradient(0, 0, 0, this.vpY)
      sky.addColorStop(0, '#8fa9bd')
      sky.addColorStop(1, '#d2dce2')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, this.vpY + 2)
      // distant tree line
      ctx.fillStyle = '#3f5a3c'
      ctx.beginPath()
      ctx.moveTo(0, this.vpY + 2)
      for (let x = 0; x <= w; x += w / 40) ctx.lineTo(x, this.vpY - 6 - r() * h * 0.05)
      ctx.lineTo(w, this.vpY + 2)
      ctx.fill()
      const ground = ctx.createLinearGradient(0, this.vpY, 0, h)
      if (this.cfg.scene === 'parking') {
        ground.addColorStop(0, '#6b7177')
        ground.addColorStop(1, '#41464b')
      } else {
        ground.addColorStop(0, '#7d935f')
        ground.addColorStop(1, '#4e6a3a')
      }
      ctx.fillStyle = ground
      ctx.fillRect(0, this.vpY, w, h - this.vpY)

      if (this.cfg.scene === 'parking') {
        ctx.strokeStyle = 'rgba(240,240,230,0.75)'
        ctx.lineWidth = Math.max(1, w / 400)
        for (const [z0, z1] of [[0.7, 1.5], [2.1, 2.9]]) {
          for (let x = -2.5; x <= 2.5; x += 0.5) {
            const a = this.proj(x, 0, z0)
            const b = this.proj(x + 0.15, 0, z1)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        const carColors = ['#7c8a99', '#a33b3b', '#e5e5e5', '#2f3e52', '#1c1c1c', '#8a7f6a']
        for (const [z0] of [[2.15], [0.75]]) {
          for (let x = -2.5; x < 2.5; x += 0.5) {
            if (r() < 0.35) continue
            const col = carColors[Math.floor(r() * carColors.length)]
            const x0 = x + 0.08
            const x1 = x + 0.42
            this.quad(ctx, [[x0, 0.05, z0 + 0.1], [x1, 0.05, z0 + 0.1], [x1, 0.42, z0 + 0.1], [x0, 0.42, z0 + 0.1]], col)
            this.quad(ctx, [[x0 + 0.04, 0.42, z0 + 0.25], [x1 - 0.04, 0.42, z0 + 0.25], [x1 - 0.07, 0.62, z0 + 0.35], [x0 + 0.07, 0.62, z0 + 0.35]], '#1d2730')
            this.quad(ctx, [[x0, 0.42, z0 + 0.1], [x1, 0.42, z0 + 0.1], [x1 - 0.04, 0.42, z0 + 0.25], [x0 + 0.04, 0.42, z0 + 0.25]], col)
          }
        }
      } else {
        // fence across the back
        const fz = D
        ctx.strokeStyle = 'rgba(200,205,210,0.35)'
        ctx.lineWidth = 1
        for (let x = -3.5; x <= 3.5; x += 0.06) {
          const a = this.proj(x, 0, fz)
          const b = this.proj(x + 0.12, 1.3, fz)
          const c = this.proj(x - 0.12, 1.3, fz)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(c.x, c.y)
          ctx.stroke()
        }
        ctx.strokeStyle = '#9aa3aa'
        ctx.lineWidth = Math.max(1.5, w / 300)
        for (let x = -3.5; x <= 3.5; x += 0.5) {
          const a = this.proj(x, 0, fz)
          const b = this.proj(x, 1.35, fz)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        const l = this.proj(-3.5, 1.3, fz)
        const rr = this.proj(3.5, 1.3, fz)
        ctx.beginPath()
        ctx.moveTo(l.x, l.y)
        ctx.lineTo(rr.x, rr.y)
        ctx.stroke()
        if (this.cfg.seed % 2 === 0) {
          // play structure
          this.quad(ctx, [[-1.6, 0, 1.6], [-1.6, 0, 1.0], [-0.6, 0, 1.0], [-0.6, 0, 1.6]], '#8a6b4a')
          this.quad(ctx, [[-1.5, 0.6, 1.35], [-0.9, 0.6, 1.35], [-0.9, 0.7, 1.35], [-1.5, 0.7, 1.35]], '#c0392b')
          for (const x of [-1.5, -0.9]) this.quad(ctx, [[x, 0, 1.35], [x + 0.05, 0, 1.35], [x + 0.05, 1.3, 1.35], [x, 1.3, 1.35]], '#e1b12c')
          this.quad(ctx, [[-1.55, 1.3, 1.35], [-0.85, 1.3, 1.35], [-1.2, 1.6, 1.35]], '#2e86de')
          this.quad(ctx, [[-0.9, 0.65, 1.35], [-0.5, 0.0, 1.0], [-0.42, 0.0, 1.0], [-0.82, 0.65, 1.35]], '#e1b12c')
        } else {
          // building wall on the right
          this.quad(ctx, [[1.6, 0, 0], [1.6, 0, 3], [1.6, 2.2, 3], [1.6, 2.2, 0]], '#8f8174')
          for (let z = 0.3; z < 2.8; z += 0.7) this.quad(ctx, [[1.6, 0.8, z], [1.6, 0.8, z + 0.4], [1.6, 1.4, z + 0.4], [1.6, 1.4, z]], '#3d4f5c')
        }
      }
      return
    }

    // ---- indoor box room ----
    const palette = {
      hallway: { wall: '#b3ac9e', floor: ['#7d796f', '#bcb7ac'], ceil: '#cfcfc8' },
      classroom: { wall: '#bdb6a5', floor: ['#7f796d', '#b8b3a8'], ceil: '#cfcfc8' },
      entrance: { wall: '#a9a399', floor: ['#6f6c66', '#aeaba4'], ceil: '#cacac6' },
      cafeteria: { wall: '#b9b09e', floor: ['#8f887a', '#c9c2b4'], ceil: '#d2d0ca' },
      gym: { wall: '#b9b2a6', floor: ['#8b6239', '#b88a57'], ceil: '#8f8c86' },
    }[this.cfg.scene as 'hallway' | 'classroom' | 'entrance' | 'cafeteria' | 'gym']

    ctx.fillStyle = palette.wall
    ctx.fillRect(0, 0, w, h)
    const far = this.proj(0, 0, D)
    const floorGrad = ctx.createLinearGradient(0, h, 0, far.y)
    floorGrad.addColorStop(0, palette.floor[0])
    floorGrad.addColorStop(1, palette.floor[1])
    this.quad(ctx, [[-W, 0, 0], [W, 0, 0], [W, 0, D], [-W, 0, D]], floorGrad)
    this.quad(ctx, [[-W, C, 0], [W, C, 0], [W, C, D], [-W, C, D]], palette.ceil)
    const shade = (alpha: number) => `rgba(0,0,0,${alpha})`
    this.quad(ctx, [[-W, 0, 0], [-W, 0, D], [-W, C, D], [-W, C, 0]], palette.wall)
    this.quad(ctx, [[-W, 0, 0], [-W, 0, D], [-W, C, D], [-W, C, 0]], shade(0.12))
    this.quad(ctx, [[W, 0, 0], [W, 0, D], [W, C, D], [W, C, 0]], palette.wall)
    this.quad(ctx, [[W, 0, 0], [W, 0, D], [W, C, D], [W, C, 0]], shade(0.06))
    this.quad(ctx, [[-W, 0, D], [W, 0, D], [W, C, D], [-W, C, D]], palette.wall)

    // floor seams
    ctx.strokeStyle = 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let z = 0.25; z < D; z += 0.25) {
      const a = this.proj(-W, 0, z)
      const b = this.proj(W, 0, z)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }

    // ceiling lights
    for (let z = 0.5; z < D - 0.2; z += 0.8) {
      for (const x of W > 1.5 ? [-0.9, 0.9] : [0]) {
        this.quad(ctx, [[x - 0.15, C, z], [x + 0.15, C, z], [x + 0.15, C, z + 0.3], [x - 0.15, C, z + 0.3]], '#f4f7fb')
      }
    }

    const door = (x: number, z: number) => {
      this.quad(ctx, [[x, 0, z], [x, 0, z + 0.32], [x, 1.25, z + 0.32], [x, 1.25, z]], '#7a5a37')
      this.quad(ctx, [[x, 0.75, z + 0.06], [x, 0.75, z + 0.14], [x, 1.1, z + 0.14], [x, 1.1, z + 0.06]], '#a9c4d6')
    }
    const board = (x: number, z: number) => {
      this.quad(ctx, [[x, 0.7, z], [x, 0.7, z + 0.4], [x, 1.15, z + 0.4], [x, 1.15, z]], '#2c6e9b')
      const colors = ['#f5f1e3', '#f6d365', '#ff9a8b', '#a8e6cf']
      for (let i = 0; i < 4; i++) {
        const zz = z + 0.04 + (i % 2) * 0.18
        const yy = 0.76 + Math.floor(i / 2) * 0.2
        this.quad(ctx, [[x, yy, zz], [x, yy, zz + 0.14], [x, yy + 0.15, zz + 0.14], [x, yy + 0.15, zz]], colors[i])
      }
    }

    switch (this.cfg.scene) {
      case 'hallway': {
        for (let z = 0.15; z < D - 0.3; z += 0.13) {
          const col = Math.floor(z / 0.13) % 2 ? '#2f5a8a' : '#356396'
          this.quad(ctx, [[-W, 0.06, z], [-W, 0.06, z + 0.125], [-W, 1.22, z + 0.125], [-W, 1.22, z]], col, 'rgba(0,0,0,0.25)')
          this.quad(ctx, [[-W, 1.0, z + 0.03], [-W, 1.0, z + 0.09], [-W, 1.08, z + 0.09], [-W, 1.08, z + 0.03]], 'rgba(0,0,0,0.25)')
        }
        for (let z = 0.4; z < D - 0.5; z += 1.1) {
          door(W, z)
          board(W, z + 0.5)
        }
        break
      }
      case 'classroom': {
        for (let z = 0.3; z < D - 0.5; z += 1.0) {
          door(-W, z)
          door(W, z + 0.45)
          board(-W, z + 0.45)
        }
        break
      }
      case 'entrance': {
        const glass = ctx.createLinearGradient(0, this.proj(0, 1.5, D).y, 0, this.proj(0, 0, D).y)
        glass.addColorStop(0, '#e6f1f8')
        glass.addColorStop(1, '#a7c3d4')
        this.quad(ctx, [[-0.7, 0, D], [0.7, 0, D], [0.7, 1.55, D], [-0.7, 1.55, D]], glass)
        ctx.strokeStyle = '#3a3f44'
        ctx.lineWidth = Math.max(1.5, w / 260)
        for (const x of [-0.7, -0.35, 0, 0.35, 0.7]) {
          const a = this.proj(x, 0, D)
          const b = this.proj(x, 1.55, D)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        const t1 = this.proj(-0.7, 1.55, D)
        const t2 = this.proj(0.7, 1.55, D)
        ctx.beginPath()
        ctx.moveTo(t1.x, t1.y)
        ctx.lineTo(t2.x, t2.y)
        ctx.stroke()
        // badge reader
        this.quad(ctx, [[0.82, 0.85, D], [0.92, 0.85, D], [0.92, 1.02, D], [0.82, 1.02, D]], '#22272c')
        this.quad(ctx, [[0.85, 0.97, D], [0.89, 0.97, D], [0.89, 1.0, D], [0.85, 1.0, D]], '#3ee07a')
        // floor mat and posters
        this.quad(ctx, [[-0.6, 0.001, D - 0.6], [0.6, 0.001, D - 0.6], [0.6, 0.001, D], [-0.6, 0.001, D]], '#3b3e42')
        board(-W, 1.2)
        board(W, 0.8)
        this.quad(ctx, [[W, 0.3, 1.8], [W, 0.3, 2.5], [W, 1.2, 2.5], [W, 1.2, 1.8]], '#4b3a2a')
        this.quad(ctx, [[W, 0.4, 1.85], [W, 0.4, 2.45], [W, 1.12, 2.45], [W, 1.12, 1.85]], '#9fb4c0')
        break
      }
      case 'cafeteria': {
        this.quad(ctx, [[-1.0, 0.9, D], [1.0, 0.9, D], [1.0, 1.4, D], [-1.0, 1.4, D]], '#5f6f52')
        for (let z = 0.5; z < D - 0.4; z += 0.9) {
          this.quad(ctx, [[-W, 0.9, z], [-W, 0.9, z + 0.5], [-W, 1.45, z + 0.5], [-W, 1.45, z]], '#d9eef7')
        }
        break
      }
      case 'gym': {
        this.quad(ctx, [[-W, 0, 0], [-W, 0, D], [-W, 0.5, D], [-W, 0.5, 0]], '#1f4e79')
        this.quad(ctx, [[W, 0, 0], [W, 0, D], [W, 0.5, D], [W, 0.5, 0]], '#1f4e79')
        this.quad(ctx, [[-W, 0, D], [W, 0, D], [W, 0.5, D], [-W, 0.5, D]], '#1f4e79')
        // bleachers
        for (let i = 0; i < 5; i++) {
          const x0 = -W + i * 0.12
          this.quad(ctx, [[x0, 0.12 * (5 - i), 0.4], [x0, 0.12 * (5 - i), 3.6], [x0 + 0.12, 0.12 * (5 - i), 3.6], [x0 + 0.12, 0.12 * (5 - i), 0.4]], i % 2 ? '#9a9a9a' : '#b4b4b4')
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'
        ctx.lineWidth = Math.max(1, w / 350)
        const line = (pts: [number, number][]) => {
          ctx.beginPath()
          pts.forEach(([x, z], i) => {
            const p = this.proj(x, 0.001, z)
            if (i === 0) ctx.moveTo(p.x, p.y)
            else ctx.lineTo(p.x, p.y)
          })
          ctx.stroke()
        }
        line([[-1.5, 0.3], [1.9, 0.3], [1.9, 4.2], [-1.5, 4.2], [-1.5, 0.3]])
        line([[-1.5, 2.25], [1.9, 2.25]])
        line(Array.from({ length: 33 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2
          return [0.2 + Math.cos(a) * 0.45, 2.25 + Math.sin(a) * 0.45] as [number, number]
        }))
        this.quad(ctx, [[-0.9, 1.7, D], [-0.3, 1.7, D], [-0.3, 2.2, D], [-0.9, 2.2, D]], '#7a1f2b')
        this.quad(ctx, [[0.5, 1.7, D], [1.1, 1.7, D], [1.1, 2.2, D], [0.5, 2.2, D]], '#c9a227')
        break
      }
    }

    // far-end glow
    const glow = ctx.createRadialGradient(far.x, far.y - h * 0.05, 0, far.x, far.y - h * 0.05, w * 0.35)
    glow.addColorStop(0, 'rgba(255,255,245,0.18)')
    glow.addColorStop(1, 'rgba(255,255,245,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)
  }

  private drawTables(ctx: CanvasRenderingContext2D, minZ: number, maxZ: number) {
    if (this.cfg.scene !== 'cafeteria') return
    for (let z = 1.2; z < 3.8; z += 0.8) {
      if (z < minZ || z >= maxZ) continue
      for (const [x0, x1] of [[-1.4, -0.3], [0.3, 1.4]]) {
        this.quad(ctx, [[x0, 0.42, z], [x1, 0.42, z], [x1, 0.42, z + 0.3], [x0, 0.42, z + 0.3]], '#e9e4d8')
        this.quad(ctx, [[x0, 0.3, z], [x1, 0.3, z], [x1, 0.42, z], [x0, 0.42, z]], '#8c8577')
      }
    }
  }

  // ---- people -------------------------------------------------------------

  private keypoints(p: Person, pose: Actor['pose'], facing: number, t: number) {
    const base = this.proj(p.x, 0, p.z)
    const H = this.h * 0.6 * base.s * p.height * (p.sitting ? 0.72 : 1)
    const X = base.x
    const Y = base.y - (p.sitting ? this.h * 0.6 * base.s * 0.28 : 0)
    const moving = pose === 'walk' || pose === 'carry' || (Math.abs(p.vx) + Math.abs(p.vz) > 0.01 && pose !== 'stand')
    const sw = moving ? Math.sin(p.phase) : 0
    const neck = { x: X, y: Y - H * 0.82 }
    const hip = { x: X, y: Y - H * 0.48 }
    const sL = { x: X - H * 0.11, y: Y - H * 0.79 }
    const sR = { x: X + H * 0.11, y: Y - H * 0.79 }
    const hL = { x: X - H * 0.06, y: hip.y }
    const hR = { x: X + H * 0.06, y: hip.y }
    const kL = { x: hL.x + sw * H * 0.04, y: Y - H * 0.24 }
    const kR = { x: hR.x - sw * H * 0.04, y: Y - H * 0.24 }
    const fL = { x: hL.x + sw * H * 0.08, y: Y }
    const fR = { x: hR.x - sw * H * 0.08, y: Y }
    let eL = { x: sL.x - H * 0.02 - sw * H * 0.03, y: Y - H * 0.62 }
    let eR = { x: sR.x + H * 0.02 + sw * H * 0.03, y: Y - H * 0.62 }
    let wL = { x: sL.x - H * 0.02 - sw * H * 0.06, y: Y - H * 0.46 }
    let wR = { x: sR.x + H * 0.02 + sw * H * 0.06, y: Y - H * 0.46 }
    if (pose === 'fight') {
      const jab = Math.max(0, Math.sin(t * 7 + p.phase)) * H * 0.14
      eL = { x: sL.x + facing * H * 0.06, y: Y - H * 0.7 }
      eR = { x: sR.x + facing * H * 0.06, y: Y - H * 0.7 }
      wL = { x: sL.x + facing * (H * 0.14 + jab), y: Y - H * 0.8 }
      wR = { x: sR.x + facing * (H * 0.1 + jab * 0.4), y: Y - H * 0.78 }
    } else if (pose === 'point') {
      const thrust = Math.sin(t * 3 + p.phase) * H * 0.03
      eR = { x: X + facing * H * 0.18, y: Y - H * 0.72 }
      wR = { x: X + facing * (H * 0.3 + thrust), y: Y - H * 0.72 }
    } else if (pose === 'cower') {
      eL = { x: X - H * 0.05, y: Y - H * 0.66 }
      eR = { x: X + H * 0.05, y: Y - H * 0.66 }
      wL = { x: X - H * 0.03, y: Y - H * 0.78 }
      wR = { x: X + H * 0.03, y: Y - H * 0.78 }
    } else if (pose === 'carry') {
      eL = { x: sL.x - H * 0.01, y: Y - H * 0.6 }
      eR = { x: sR.x + H * 0.03, y: Y - H * 0.62 }
      wL = { x: X - H * 0.03, y: Y - H * 0.56 }
      wR = { x: X + H * 0.09, y: Y - H * 0.64 }
    }
    const head = { x: X + (pose === 'cower' ? -H * 0.02 : 0), y: Y - H * (pose === 'cower' ? 0.87 : 0.9) }
    return { X, Y, H, head, neck, hip, sL, sR, hL, hR, kL, kR, fL, fR, eL, eR, wL, wR }
  }

  private drawPerson(ctx: CanvasRenderingContext2D, p: Person, pose: Actor['pose'], facing: number, t: number) {
    const k = this.keypoints(p, pose, facing, t)
    const { H } = k
    const seg = (a: Pt, b: Pt, width: number, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(1, width)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.beginPath()
    ctx.ellipse(k.X, k.Y, H * 0.14, H * 0.03, 0, 0, Math.PI * 2)
    ctx.fill()
    if (!p.sitting) {
      seg(k.hL, k.kL, H * 0.075, p.pants)
      seg(k.kL, k.fL, H * 0.065, p.pants)
      seg(k.hR, k.kR, H * 0.075, p.pants)
      seg(k.kR, k.fR, H * 0.065, p.pants)
    }
    seg({ x: k.X, y: k.neck.y + H * 0.04 }, { x: k.X, y: k.hip.y }, H * 0.2, p.shirt)
    seg(k.sL, k.sR, H * 0.09, p.shirt)
    seg(k.sL, k.eL, H * 0.06, p.shirt)
    seg(k.eL, k.wL, H * 0.05, p.shirt)
    seg(k.sR, k.eR, H * 0.06, p.shirt)
    seg(k.eR, k.wR, H * 0.05, p.shirt)
    if (pose === 'carry') {
      // long dark object held diagonally across the body
      seg({ x: k.X - H * 0.12, y: k.Y - H * 0.42 }, { x: k.X + H * 0.2, y: k.Y - H * 0.74 }, H * 0.035, '#111')
    }
    ctx.fillStyle = p.skin
    for (const wpt of [k.wL, k.wR]) {
      ctx.beginPath()
      ctx.arc(wpt.x, wpt.y, Math.max(0.8, H * 0.025), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(k.head.x, k.head.y, Math.max(1.2, H * 0.075), 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = p.hair
    ctx.beginPath()
    ctx.arc(k.head.x, k.head.y - H * 0.01, Math.max(1.2, H * 0.078), Math.PI * 1.05, Math.PI * 1.95)
    ctx.fill()
  }

  private drawSkeleton(ctx: CanvasRenderingContext2D, p: Person, pose: Actor['pose'], facing: number, t: number, color: string) {
    const k = this.keypoints(p, pose, facing, t)
    const bones: [Pt, Pt][] = [
      [k.head, k.neck], [k.neck, k.sL], [k.neck, k.sR], [k.sL, k.eL], [k.eL, k.wL], [k.sR, k.eR], [k.eR, k.wR],
      [k.neck, k.hip], [k.hip, k.hL], [k.hip, k.hR], [k.hL, k.kL], [k.kL, k.fL], [k.hR, k.kR], [k.kR, k.fR],
    ]
    ctx.strokeStyle = color
    ctx.lineWidth = Math.max(1, this.w / 500)
    ctx.beginPath()
    for (const [a, b] of bones) {
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
    }
    ctx.stroke()
    ctx.fillStyle = color
    const r = Math.max(1.2, this.w / 380)
    for (const pt of [k.head, k.neck, k.sL, k.sR, k.eL, k.eR, k.wL, k.wR, k.hL, k.hR, k.kL, k.kR, k.fL, k.fR]) {
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private personBox(p: Person) {
    const base = this.proj(p.x, 0, p.z)
    const H = this.h * 0.6 * base.s * p.height
    const top = base.y - H * (p.sitting ? 0.98 * 0.72 + 0.28 : 0.98)
    return { x0: base.x - H * 0.2, y0: top, x1: base.x + H * 0.2, y1: base.y }
  }

  // ---- simulation step ----------------------------------------------------

  private step(dt: number, t: number) {
    const room = this.room()
    const W = room.halfWidth - 0.25
    const zMin = 0.25
    const zMax = room.depth - 0.35
    for (const p of this.people) {
      if (p.sitting) continue
      p.x += p.vx * dt
      p.z += p.vz * dt
      p.phase += (Math.abs(p.vx) + Math.abs(p.vz)) * dt * 16
      if (p.x < -W || p.x > W) p.vx *= -1
      if (p.z < zMin || p.z > zMax) {
        if (room.outdoor || this.cfg.scene === 'gym' || this.cfg.scene === 'cafeteria') p.vz *= -1
        else {
          // corridor traffic: respawn at the opposite end
          p.z = p.z < zMin ? zMax - 0.01 : zMin + 0.01
          p.x = (this.rng() * 2 - 1) * (room.halfWidth - 0.35)
        }
      }
      p.x = Math.max(-W, Math.min(W, p.x))
      p.z = Math.max(zMin - 0.02, Math.min(zMax + 0.02, p.z))
    }

    const [ax, az] = ANCHORS[this.cfg.scene]
    for (const [i, a] of this.actors.entries()) {
      switch (this.cfg.incident) {
        case 'tailgating': {
          const cycle = ((t * 0.22) % 1 + 1) % 1
          a.z = 0.5 + cycle * (room.depth - 0.9) - i * 0.16
          a.x = 0.05 + i * 0.09
          a.phase = t * 6 + i
          break
        }
        case 'intruder': {
          a.x = ax + Math.sin(t * 0.25) * 0.8
          a.phase = t * 5
          a.vx = 0.1
          break
        }
        case 'weapon': {
          const cycle = ((t * 0.08) % 1 + 1) % 1
          a.z = az + 1.4 - cycle * 1.4
          a.phase = t * 4.5
          break
        }
        case 'fight':
          if (a.role === 'actor') a.x += Math.sin(t * 5 + i * 2) * 0.004
          break
        case 'bullying':
          if (a.role === 'actor') a.x += Math.sin(t * 2.5 + i) * 0.002
          break
        case 'loitering':
          a.x = ax + Math.sin(t * 0.6) * 0.03
          break
      }
    }
  }

  // ---- frame --------------------------------------------------------------

  private lastT = -1

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
    const dt = this.lastT < 0 ? 0 : Math.min(0.1, t - this.lastT)
    this.lastT = t
    this.step(dt, t)

    this.w = w
    this.h = h
    this.vpX = w * 0.5
    this.vpY = h * 0.3
    const key = `${w}x${h}`
    if (this.bgKey !== key || !this.bg) {
      this.bg = document.createElement('canvas')
      this.bg.width = w
      this.bg.height = h
      const bctx = this.bg.getContext('2d')!
      this.drawBackground(bctx)
      this.bgKey = key
    }
    ctx.drawImage(this.bg, 0, 0)

    // painter's algorithm: far to near, tables interleaved
    type Item = { z: number; p: Person; pose: Actor['pose']; facing: number; actor: boolean }
    const items: Item[] = [
      ...this.people.map((p) => ({ z: p.z, p, pose: (p.sitting ? 'stand' : 'walk') as Actor['pose'], facing: 0, actor: false })),
      ...this.actors.map((a) => ({ z: a.z, p: a as Person, pose: a.pose, facing: a.facing, actor: true })),
    ].sort((a, b) => b.z - a.z)

    let lastZ = Infinity
    for (const it of items) {
      this.drawTables(ctx, it.z, lastZ)
      lastZ = it.z
      this.drawPerson(ctx, it.p, it.pose, it.facing, t)
    }
    this.drawTables(ctx, -Infinity, lastZ)

    // AI overlays
    const { showTracking, incident, severity, confidence } = this.cfg
    if (showTracking) {
      ctx.font = `${Math.max(9, w / 85)}px "JetBrains Mono", monospace`
      for (const p of this.people) {
        const b = this.personBox(p)
        ctx.strokeStyle = 'rgba(80, 230, 160, 0.55)'
        ctx.lineWidth = 1
        ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0)
        if (b.y1 - b.y0 > h * 0.12) {
          ctx.fillStyle = 'rgba(80, 230, 160, 0.85)'
          ctx.fillText('person', b.x0 + 2, b.y0 - 3)
        }
      }
    }

    if (incident && severity && this.actors.length) {
      const color = INCIDENT_COLOR[severity]
      const pulse = 0.65 + 0.35 * Math.sin(t * 6)
      for (const a of this.actors) {
        if (a.role !== 'bystander') this.drawSkeleton(ctx, a, a.pose, a.facing, t, showTracking ? '#38e8ff' : 'rgba(56,232,255,0.85)')
      }
      const boxes = this.actors.filter((a) => a.role !== 'bystander').map((a) => this.personBox(a))
      const pad = h * 0.02
      const x0 = Math.min(...boxes.map((b) => b.x0)) - pad
      const y0 = Math.min(...boxes.map((b) => b.y0)) - pad
      const x1 = Math.max(...boxes.map((b) => b.x1)) + pad
      const y1 = Math.max(...boxes.map((b) => b.y1)) + pad
      ctx.globalAlpha = pulse
      ctx.strokeStyle = color
      ctx.lineWidth = Math.max(1.5, w / 260)
      const c = Math.min(x1 - x0, y1 - y0) * 0.25
      ctx.beginPath()
      for (const [cxp, cyp, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as const) {
        ctx.moveTo(cxp + dx * c, cyp)
        ctx.lineTo(cxp, cyp)
        ctx.lineTo(cxp, cyp + dy * c)
      }
      ctx.stroke()
      ctx.globalAlpha = 0.18 * pulse
      ctx.fillStyle = color
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
      ctx.globalAlpha = 1

      const compact = w < 420
      let label = `${(compact ? SHORT_LABEL : INCIDENT_LABEL)[incident]} ${(confidence * 100).toFixed(0)}%`
      if (incident === 'loitering' && !compact) {
        const secs = 612 + Math.floor(t)
        label = `LOITERING · DWELL ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
      }
      const fs = Math.max(9, w / 70)
      ctx.font = `600 ${fs}px "JetBrains Mono", monospace`
      const tw = ctx.measureText(label).width
      const lx = Math.min(Math.max(0, x0), w - tw - 8)
      // keep clear of the LIVE / camera badges in the top corner
      const ly = y0 - fs - 6 < h * 0.2 ? Math.min(h - 2, y1 + fs + 6) : y0
      ctx.fillStyle = color
      ctx.fillRect(lx, ly - fs - 6, tw + 8, fs + 6)
      ctx.fillStyle = '#fff'
      ctx.fillText(label, lx + 4, ly - 5)
    }

    // CCTV post-processing: grain, scanlines, vignette
    const grain = Math.floor((w * h) / 1400)
    for (let i = 0; i < grain; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5)
    }
    ctx.fillStyle = 'rgba(0,0,0,0.07)'
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.75)
    vig.addColorStop(0, 'rgba(0,0,0,0)')
    vig.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = vig
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = 'rgba(15,30,50,0.2)'
    ctx.fillRect(0, 0, w, h)
  }
}
