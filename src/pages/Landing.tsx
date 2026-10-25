import { Link } from 'react-router-dom'
import type { ComponentType } from 'react'
import {
  ArrowRight,
  Bell,
  BellRing,
  Brain,
  CircleCheck,
  LayoutDashboard,
  Play,
  Radio,
  ScanEye,
  ShieldCheck,
  Siren,
  Video,
} from 'lucide-react'

function ShieldArt() {
  const windows = [
    [62, 128], [78, 128], [122, 128], [138, 128],
    [62, 146], [78, 146], [122, 146], [138, 146],
  ]
  return (
    <svg viewBox="0 0 200 220" className="h-full w-full" role="img" aria-label="Glowing shield protecting a school building">
      <defs>
        <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="shieldFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f3a4a" />
          <stop offset="1" stopColor="#071a26" />
        </linearGradient>
        <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.35" />
          <stop offset="1" stopColor="#2dd4bf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="105" fill="url(#halo)" />
      <path d="M100 14 30 40v58c0 52 30 88 70 104 40-16 70-52 70-104V40L100 14z" fill="url(#shieldFill)" stroke="#5eead4" strokeWidth="5" filter="url(#glow)" strokeLinejoin="round" />
      <path d="M100 28 42 50v48c0 44 25 75 58 89 33-14 58-45 58-89V50L100 28z" fill="none" stroke="#2dd4bf" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* circuit traces */}
      <g stroke="#2dd4bf" strokeOpacity="0.45" strokeWidth="1" fill="none">
        <path d="M52 70h18l6 6M148 70h-18l-6 6M56 92h10M144 92h-10" />
      </g>
      <g fill="#5eead4">
        <circle cx="52" cy="70" r="2" />
        <circle cx="148" cy="70" r="2" />
      </g>
      {/* school building */}
      <g filter="url(#glow)">
        <path d="M86 108V84l14-14 14 14v24" fill="#0b2733" stroke="#5eead4" strokeWidth="2" />
        <path d="M100 58v12" stroke="#5eead4" strokeWidth="2" />
        <rect x="95" y="84" width="10" height="10" rx="1" fill="#5eead4" opacity="0.9" />
        <path d="M52 166v-52l34-6h28l34 6v52z" fill="#0b2733" stroke="#5eead4" strokeWidth="2" />
        <rect x="92" y="140" width="16" height="26" fill="#5eead4" opacity="0.85" />
        {windows.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - 5} y={y - 5} width="10" height="9" rx="1" fill="#5eead4" opacity="0.75" />
        ))}
      </g>
      <path d="M40 176h120" stroke="#2dd4bf" strokeOpacity="0.6" strokeWidth="2" />
    </svg>
  )
}

function Ring({ value, pct, color, title, body }: { value: string; pct: number; color: string; title: string; body: string }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 128 128" className="size-36">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle cx="64" cy="64" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 64 64)" />
        <text x="64" y="70" textAnchor="middle" className="fill-white text-[18px] font-bold">{value}</text>
      </svg>
      <h4 className="mt-2 font-semibold text-white">{title}</h4>
      <p className="mt-1 max-w-56 text-sm text-slate-300">{body}</p>
    </div>
  )
}

function Feature({ icon: Icon, title, body }: { icon: ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-red-500/40 bg-white/[0.03] p-5">
      <span className="grid size-9 place-items-center rounded-full bg-red-600/90 text-white">
        <Icon className="size-4" />
      </span>
      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-300">{body}</p>
    </div>
  )
}

const STEPS = [
  { icon: ScanEye, title: 'AI Analysis', body: 'Analyzes live camera activity for safety-related patterns using computer vision.' },
  { icon: Siren, title: 'Alert Generation', body: 'Creates a severity-based alert with incident details and location.' },
  { icon: BellRing, title: 'Staff Notification', body: 'Authorized staff receive live alert notifications on their devices.' },
  { icon: Video, title: 'Video Review', body: 'Staff view live or recorded video of the incident directly from the alert.' },
  { icon: CircleCheck, title: 'Resolution', body: 'Incident is investigated, resolved, or marked as a false positive.' },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-navy text-slate-100 [background-image:radial-gradient(rgba(94,234,212,0.08)_1px,transparent_1px)] [background-size:28px_28px]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="flex items-center gap-2 font-semibold text-white">
          <ShieldCheck className="size-5 text-teal-300" /> SchoolShield AI
        </span>
        <Link to="/dashboard" className="flex items-center gap-1.5 rounded-lg bg-teal-400 px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-teal-300">
          <LayoutDashboard className="size-4" /> Open Dashboard
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
        <div className="animate-fade-up">
          <span className="rounded-full bg-amber-900/60 px-3 py-1 text-xs font-bold tracking-wider text-amber-200 ring-1 ring-amber-400/40">INTRODUCING</span>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white sm:text-6xl">SchoolShield - AI</h1>
          <p className="mt-5 max-w-lg text-lg text-slate-300">
            An AI-powered school safety monitoring and alert platform that helps schools detect risks early, respond faster, and keep students and staff safe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard" className="flex items-center gap-2 rounded-lg bg-teal-400 px-5 py-3 font-semibold text-slate-900 hover:bg-teal-300">
              Launch live demo <ArrowRight className="size-4" />
            </Link>
            <a href="https://youtu.be/gQtsNemZ-5M" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/5">
              <Play className="size-4" /> Watch the video
            </a>
          </div>
        </div>
        <div className="mx-auto aspect-[10/11] w-full max-w-sm">
          <ShieldArt />
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-bold text-white">School Safety Gaps Are Growing</h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          Schools across America face increasing safety risks, but detection and response remain delayed. The tools available today aren't keeping pace with the challenges educators face daily.
        </p>
        <div className="mt-10 grid gap-8 text-center sm:grid-cols-3">
          {[
            ['70%', 'Schools Report Incidents', 'Over 70% of K–12 schools report bullying or aggressive incidents annually according to NCES, U.S. Department of Education.'],
            ['Rising', 'Post-Pandemic Trend', 'Physical altercations and behavioral incidents have surged, especially in middle and high schools.'],
            ['Delayed', 'Response Time Gap', 'Most schools rely on passive cameras and manual reporting, responding only after incidents escalate.'],
          ].map(([big, title, body]) => (
            <div key={title}>
              <p className="text-5xl font-semibold text-white">{big}</p>
              <p className="mt-3 font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm text-slate-300">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-slate-300">
          <strong className="text-white">The consequences are serious:</strong> Delayed response increases risk of injury, student absenteeism, emotional trauma, and erosion of trust between families and schools.
        </p>
      </section>

      {/* Solution */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <span className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">INTRODUCING</span>
        <h2 className="mt-3 text-3xl font-bold text-white">SchoolShield AI</h2>
        <p className="mt-3 max-w-3xl text-slate-300">
          SchoolShield AI enables proactive school safety through real-time detection and intelligent alerts that empower staff to respond before situations escalate.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Feature icon={Radio} title="Continuous Monitoring" body="Analyzes school environments 24/7 across all connected cameras." />
          <Feature icon={Siren} title="Real-Time Detection" body="Identifies critical safety incidents as they unfold, not hours later." />
          <Feature icon={Bell} title="Instant Alerts" body="Notifies authorized staff immediately with severity-based prioritization." />
        </div>
        <h3 className="mt-10 font-semibold text-white">Critical Safety Incidents Detected</h3>
        <ul className="mt-3 grid list-disc gap-x-10 gap-y-1.5 pl-5 text-slate-300 sm:grid-cols-2">
          <li>Bullying and aggression escalation</li>
          <li>Loitering in restricted areas</li>
          <li>Physical fights and altercations</li>
          <li>Potential weapon-related threats</li>
          <li>Unauthorized access and tailgating</li>
          <li>Suspicious behavior patterns</li>
        </ul>
        <p className="mt-6 border-l-2 border-amber-400 pl-4 text-slate-300">
          <strong className="text-white">Core principle:</strong> Early awareness leads to faster response, which reduces harm and protects the entire school community.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-bold text-white">How It Works: From Detection to Response in Seconds</h2>
        <p className="mt-3 max-w-3xl text-slate-300">SchoolShield AI transforms raw camera feeds into actionable intelligence through a simple, practical workflow designed for real school operations.</p>
        <ol className="mt-8 grid gap-4 md:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-xs font-semibold text-teal-300">STEP {i + 1}</span>
              <Icon className="mt-2 size-6 text-white" />
              <h3 className="mt-2 font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-300">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-900/50 p-4 ring-1 ring-amber-500/40">
          <Brain className="mt-0.5 size-5 shrink-0 text-amber-300" />
          <p className="text-sm text-amber-100">
            <strong>Important design choice:</strong> AI supports staff decisions. It does not replace human judgment or override professional discretion. Staff remain in control of all response actions, and the system detects behaviors, never identities.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-bold text-white">Key Features & What Makes Us Different</h2>
        <p className="mt-3 max-w-3xl text-slate-300">Designed specifically for real school operations, with features that address the daily challenges safety coordinators and administrators actually face.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Intelligent Alert System', 'Multiple alert types with clear severity levels help staff prioritize response. Customizable sensitivity and notification rules adapt to each school.'],
            ['Instant Video Access', 'Live video playback directly from alerts eliminates delays. Staff can assess situations in real time and make informed decisions immediately.'],
            ['Organized Alert Management', 'Active alerts, alerts under investigation, resolved incidents, and false positives, each tracked with a full audit trail.'],
            ['School Safety Score', 'Interactive dashboard with trend awareness helps identify patterns and prevent future incidents through data-driven insights.'],
            ['Unified Platform', 'One comprehensive view instead of disconnected tools. No more switching between systems or missing critical information.'],
            ['Privacy First', 'No facial recognition and no student profiles. Pose and object detection only, with every action reviewed by a person.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-300">{body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 border-l-2 border-red-500 pl-4 text-slate-300">
          <strong className="text-red-400">What makes it different:</strong> Focus on prevention and response, not just recording. SchoolShield AI is designed to stop incidents before they escalate, not just document them afterward.
        </p>
      </section>

      {/* Impact */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-bold text-white">The Impact: Safer Schools Through Faster, Smarter Action</h2>
        <p className="mt-3 max-w-3xl text-slate-300">SchoolShield AI aims to deliver measurable improvements in school safety outcomes by giving educators the tools they need to protect students proactively.</p>
        <h3 className="mt-8 font-semibold text-white">Research-Backed Benefits</h3>
        <div className="mt-6 grid gap-10 sm:grid-cols-3">
          <Ring value="20–30%" pct={0.25} color="#eab308" title="Reduction in Bullying" body="Early intervention lowers repeat bullying incidents by 20–30% according to StopBullying.gov research." />
          <Ring value="60%" pct={0.6} color="#f43f5e" title="Faster Response" body="Real-time alerts can cut response times by over 60%, minimizing injury severity per CDC school safety findings." />
          <Ring value="45%" pct={0.45} color="#fb7185" title="Staff Confidence" body="Improved situational awareness reduces staff overload and burnout, by 45% in pilot programs." />
        </div>
        <p className="mt-10 border-l-2 border-red-500 pl-4 text-slate-300">
          <span className="text-red-400">SchoolShield AI demonstrates how artificial intelligence can be applied responsibly to protect students, support educators, and strengthen school safety outcomes.</span> This is AI with purpose: technology in service of what matters most, keeping our children safe.
        </p>
        <div className="mt-10 flex justify-center">
          <Link to="/dashboard" className="flex items-center gap-2 rounded-lg bg-teal-400 px-6 py-3 font-semibold text-slate-900 hover:bg-teal-300">
            Try the live dashboard <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
        SchoolShield AI · Congressional App Challenge 2026 (NJ-12) · Demo uses simulated camera feeds and data.
      </footer>
    </div>
  )
}
