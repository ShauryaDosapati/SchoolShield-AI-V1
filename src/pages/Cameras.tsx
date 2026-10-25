import { Wifi, WifiOff, Wrench } from 'lucide-react'
import { CAMERAS } from '../data/mock'
import { Card, PageHeader } from '../components/ui'
import { CameraGrid } from '../components/CameraGrid'

export function Cameras() {
  const count = (s: string) => CAMERAS.filter((c) => c.status === s).length
  const tiles = [
    { label: 'Online', value: count('online'), icon: Wifi, tone: 'text-emerald-400' },
    { label: 'Offline', value: count('offline'), icon: WifiOff, tone: 'text-red-400' },
    { label: 'Maintenance', value: count('maintenance'), icon: Wrench, tone: 'text-amber-300' },
  ]
  return (
    <div>
      <PageHeader title="Camera Management" subtitle="Monitor and manage all security cameras. Click a feed to open it." />
      <div className="mb-6 grid grid-cols-3 gap-3">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-muted">{label}</p>
              <p className={`text-2xl font-bold ${tone}`}>{value}</p>
            </div>
            <Icon className={`size-5 ${tone}`} />
          </Card>
        ))}
      </div>
      <CameraGrid cameras={CAMERAS} size="md" />
    </div>
  )
}
