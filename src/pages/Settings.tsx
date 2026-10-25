import type { ComponentType, ReactNode } from 'react'
import { Bell, DoorOpen, EyeOff, Hourglass, Mail, RotateCcw, Shield, ShieldAlert, Smartphone, Users, Volume2, Zap } from 'lucide-react'
import { useSafety } from '../store/SafetyStore'
import { Card, PageHeader, Toggle } from '../components/ui'

function Section({ icon: Icon, title, subtitle, children }: { icon: ComponentType<{ className?: string }>; title: string; subtitle: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Icon className="size-4 text-emerald-400" /> {title}
      </h2>
      <p className="mb-2 text-sm text-muted">{subtitle}</p>
      <div className="divide-y divide-white/5">{children}</div>
    </Card>
  )
}

function Row({ icon: Icon, title, desc, checked, onChange }: { icon: ComponentType<{ className?: string }>; title: string; desc: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium text-white">
          <Icon className="size-4 text-slate-400" /> {title}
        </p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <Toggle label={title} checked={checked} onChange={onChange} />
    </div>
  )
}

export function Settings() {
  const { settings, toggleModule, updateSettings, reset } = useSafety()
  const m = settings.modules
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Settings" subtitle="Configure your safety monitoring preferences" />
      <Section icon={Shield} title="Detection Settings" subtitle="Configure AI detection modules. Disabled modules raise no alerts.">
        <Row icon={Users} title="Fight & Bullying Detection" desc="Detect physical altercations and aggressive behavior" checked={m.behavior} onChange={() => toggleModule('behavior')} />
        <Row icon={ShieldAlert} title="Weapon Detection" desc="Scan for firearms, knives, and other threats" checked={m.weapon} onChange={() => toggleModule('weapon')} />
        <Row icon={DoorOpen} title="Access Control Monitoring" desc="Monitor for unauthorized access and tailgating" checked={m.access} onChange={() => toggleModule('access')} />
        <Row icon={Hourglass} title="Loitering Detection" desc="Flag extended presence in restricted areas or after hours" checked={m.loitering} onChange={() => toggleModule('loitering')} />
      </Section>
      <Section icon={Bell} title="Notification Preferences" subtitle="Choose how you want to receive alerts">
        <Row icon={Volume2} title="Sound Alerts" desc="Play audio notification for new alerts" checked={settings.sound} onChange={() => updateSettings({ sound: !settings.sound })} />
        <Row icon={Mail} title="Email Notifications" desc="Send email for high and critical severity alerts" checked={settings.email} onChange={() => updateSettings({ email: !settings.email })} />
        <Row icon={Smartphone} title="Push Notifications" desc="Send push notifications to mobile devices" checked={settings.push} onChange={() => updateSettings({ push: !settings.push })} />
      </Section>
      <Section icon={EyeOff} title="Privacy" subtitle="Built-in safeguards (not configurable)">
        <ul className="space-y-1.5 py-2 text-sm text-slate-300">
          <li>• No facial recognition. Detection uses body pose, motion and objects only.</li>
          <li>• Every alert is reviewed by a person before any action is taken.</li>
          <li>• Every status change is logged with who made it and when.</li>
        </ul>
      </Section>
      <Section icon={Zap} title="Demo Mode" subtitle="Controls for presenting the simulated system">
        <Row icon={Zap} title="Auto-generate alerts" desc="Raise a random incident on a schedule" checked={settings.autoSimulate} onChange={() => updateSettings({ autoSimulate: !settings.autoSimulate })} />
        <div className="flex items-center justify-between gap-4 py-3">
          <label htmlFor="interval" className="text-sm font-medium text-white">Interval</label>
          <select
            id="interval"
            value={settings.simulateEverySec}
            onChange={(e) => updateSettings({ simulateEverySec: Number(e.target.value) })}
            className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-sm"
          >
            {[10, 20, 30, 60].map((s) => (
              <option key={s} value={s}>Every {s}s</option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Reset demo data</p>
            <p className="text-xs text-muted">Restore the original alerts, notifications and settings</p>
          </div>
          <button onClick={reset} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-white/5">
            <RotateCcw className="size-4" /> Reset
          </button>
        </div>
      </Section>
    </div>
  )
}
