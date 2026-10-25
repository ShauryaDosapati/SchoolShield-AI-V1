Welcome to SchoolShield AI, an AI‑powered school safety monitoring and alert platform built to help schools detect risks early, respond faster, and keep students and staff safe.

School environments face a wide range of safety challenges—from bullying and physical fights to unauthorized access and potential threats. SchoolShield AI continuously monitors school spaces and identifies critical incidents in real time, allowing staff to act before situations escalate.

The platform delivers multiple types of safety alerts, each clearly categorized by severity. These include alerts for bullying and aggressive behavior, physical fights, unauthorized access or tailgating, loitering in restricted areas, and potential weapon‑related threats. Each alert is designed to provide immediate situational awareness while supporting calm, informed decision‑making.

When an alert is triggered, authorized staff can view a live or recorded video feed directly from the dashboard. This allows security teams and administrators to quickly understand what is happening on the ground. From the same interface, staff can investigate the incident, take action, mark it as resolved, or label it as a false positive. Alert status updates are tracked in real time, ensuring clear communication and accountability.


SchoolShield AI is designed to support prevention, rapid response, and continuous improvement. By combining real‑time alerts, live video access, customizable controls, and clear incident tracking, the platform helps schools create safer, more responsive learning environments.

SchoolShield AI shows how AI can be used as a powerful safety tool for schools, enhancing visibility, improving response times, and supporting the people responsible for protecting students every day.

Youtube link -> https://www.youtube.com/watch?v=vOpPjDs0q74



## Running the demo app

React 19 + TypeScript + Vite + Tailwind CSS v4. No backend: all data and camera feeds are simulated in the browser.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

### Pages
| Route | What it shows |
|---|---|
| `/` | Project intro (problem, solution, how it works, features, impact) |
| `/dashboard` | Safety score, KPIs, AI detection modules, live alerts, 12 camera feeds |
| `/cameras` | Camera management (online / offline / maintenance) |
| `/alerts` | Alert management with search, status and severity filters |
| `/zones` | Campus zones with live risk levels |
| `/notifications` | Notification feed |
| `/settings` | Detection modules, notification preferences, demo controls |

### Suggested demo script
1. Start on `/` and walk through the problem and solution, then click **Launch live demo**.
2. On the dashboard, use **Simulate incident → Physical fight**. A toast pops up with a sound, and the camera tile turns red.
3. Click **View live feed** to open the HUD with the detection box, pose skeleton, confidence and audit trail.
4. Click **Investigate**, then **Mark Resolved**. The safety score, active count, avg response and zone risk all update live.
5. Trigger **Possible weapon**: the HUD opens automatically with a red lockdown banner.
6. Trigger **Loitering** and mark it **False Positive** to show the human-in-the-loop feedback loop.
7. Turn off a detection module (dashboard toggle or Settings) to show that schools control what is monitored.

Turn on **Auto-generate alerts** in the Simulate menu for a hands-free demo. **Settings → Reset** restores the starting data (reloading the page does too).

### Using real footage
Camera feeds are drawn procedurally (`src/sim/scene.ts`), with stick-figure people and no faces. To use your own clips or images instead, add a `clipUrl` to a camera in `src/data/mock.ts`, e.g. `clipUrl: '/clips/cam-003.mp4'`, and put the file in `public/clips/`. The AI overlays (LIVE badge, banner, alert panel) still render on top.
