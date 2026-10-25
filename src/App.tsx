import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SafetyProvider } from './store/SafetyStore'
import { Layout } from './components/Layout'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { Cameras } from './pages/Cameras'
import { Alerts } from './pages/Alerts'
import { Zones } from './pages/Zones'
import { Notifications } from './pages/Notifications'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <SafetyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cameras" element={<Cameras />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SafetyProvider>
  )
}
