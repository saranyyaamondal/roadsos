# 🚨 SurakshaRoad — Emergency Road Safety Platform

<div align="center">

![SurakshaRoad](https://img.shields.io/badge/SurakshaRoad-Emergency%20Road%20Safety-C62828?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-2E7D32?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Web%20App-1565C0?style=for-the-badge)

**One-tap emergency response. AI-powered hospital ranking. Works offline.**

[🌐 Live App](https://roadsos-jade.vercel.app) · [⚙️ Backend API](https://suraksharoad.onrender.com) 

</div>

---

## What is SurakshaRoad?

SurakshaRoad is a full-stack emergency road safety web application that saves lives in the critical first minutes after a road accident.

- **Victim?** Tap once → nearest hospitals ranked by AI → SOS fires your location + medical profile to emergency contacts simultaneously.
- **Bystander?** Take a photo → Claude Vision verifies it's a real accident → alert fires after a 60-second cancel window.
- **No internet?** The app still works using IndexedDB-cached data and an offline first aid guide.

---

## Live URLs

| Service | URL |
|---|---|
| 🌐 Frontend | https://roadsos-jade.vercel.app |
| ⚙️ Backend API | https://suraksharoad.onrender.com |
| 📁 Repository | https://github.com/saranyyaamondal/roadsos |

---

## Features

| Feature | Description |
|---|---|
| 🩺 Medical Profile | 3-step signup saves blood group, allergies, medications, emergency contact to device localStorage |
| 📍 GPS Detection | Auto-detects location on every page load — falls back to manual entry if denied |
| 🏥 AI Hospital Ranking | Claude AI ranks nearby hospitals by injury type + proximity + trauma level |
| 🚔 Police Finder | Nearest police stations with one-tap call and navigation |
| 🆘 SOS Button | Simultaneously dials 112, sends WhatsApp alert, fires Twilio SMS, shares live location |
| 📸 Photo Verification | Claude Vision verifies bystander photos before any alert fires — prevents false calls |
| 📶 Offline Mode | IndexedDB caches nearby resources; first aid guide works with zero internet |
| 🌐 6 Languages | English, Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Marathi |
| 🪪 Medical Card | Shareable offline card with all vitals — one tap to send via WhatsApp |
| 🩹 First Aid Guide | 8 categories (Bleeding, Fracture, Burns, Choking, Heart Attack, Seizure, Drowning, Unconscious) |

---

## Tech Stack

### Frontend
- Plain HTML5, CSS3, JavaScript (ES Modules) — no framework, no build step
- [Leaflet.js](https://leafletjs.com/) — interactive maps with OpenStreetMap tiles
- Browser APIs: `navigator.geolocation`, `localStorage`, `IndexedDB`, `navigator.mediaDevices`

### Backend
- **Node.js + Express** — REST API server
- **Anthropic Claude API** — `claude-opus-4-5` (Vision) + `claude-haiku-4-5-20251001` (triage)
- **Twilio** — SMS and WhatsApp emergency alerts
- **OpenRouteService API** — real driving ETA calculations

### Deployment
- **Vercel** — frontend (auto-deploys from `frontend/` on every push to `main`)
- **Render** — backend (auto-deploys from `backend/` on every push to `main`)

---

## Project Structure

```
roadsos/
├── backend/                        # Node.js/Express API (M3 + M6)
│   ├── routes/
│   │   ├── nearby.js               # GET  /api/nearby — Haversine distance search
│   │   ├── triageAI.js             # POST /api/triage — Claude AI hospital ranking
│   │   ├── alert.js                # POST /api/alert  — Twilio SMS + WhatsApp
│   │   └── photoVerify.js          # POST /api/photo-verify — Claude Vision
│   ├── server.js                   # Express app entry point
│   ├── resources.json              # Hospital + police + ambulance database
│   └── package.json
│
├── frontend/                       # Static web app (M1 + M2 + M4 + M5 + M6)
│   ├── landing.html                # Pre-signup hero page
│   ├── signup.html                 # 3-step profile setup
│   ├── index.html                  # Home screen
│   ├── hospitals.html              # AI-ranked hospital list + map
│   ├── police.html                 # Nearby police stations + map
│   ├── emergency.html              # SOS screen
│   ├── verification.html           # Bystander photo verification
│   ├── medical-card.html           # Offline medical profile card
│   ├── firstaid.html               # First aid guide (offline)
│   ├── js/
│   │   ├── config.js               # Central API URL + auth helpers
│   │   ├── gps.js                  # GPS detection + localStorage
│   │   ├── main.js                 # Home screen logic
│   │   ├── verification.js         # Photo verify + countdown
│   │   ├── m2.js                   # Medical card + offline cache
│   │   └── profile-bridge.js       # Bridges M1 localStorage → M2 format
│   ├── data/
│   │   ├── firstaid.json           # First aid steps data
│   │   └── i18n.json               # Language translations
│   └── css/
│       └── style.css
│
└── README.md
```

---

## API Reference

### `GET /api/nearby`
Returns nearby hospitals, police stations, or ambulances sorted by distance.

```
GET /api/nearby?lat=12.92&lon=80.13&type=hospital&radius=100
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `lat` | number | ✅ | User latitude |
| `lon` | number | ✅ | User longitude |
| `type` | string | ❌ | `hospital` / `police` / `ambulance` (omit for all) |
| `radius` | number | ❌ | Search radius in km (default: 100) |

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "name": "Gleneagles Global Hospital",
      "type": "hospital",
      "lat": 12.9516,
      "lon": 80.1462,
      "phone": "04444777000",
      "level": "Level 1 Trauma",
      "distance_km": 1.4
    }
  ]
}
```

---

### `POST /api/triage`
Uses Claude AI to rank hospitals by suitability for the reported injury.

```json
{
  "hospitals": [...],
  "injury": "head injury, unconscious",
  "language": "ta"
}
```

**Response:**
```json
{
  "recommended": { "name": "Gleneagles Global Hospital", ... },
  "all_ranked": [...],
  "reason": "Gleneagles ranked first — nearest Level 1 trauma centre with neurology unit."
}
```

---

### `POST /api/alert`
Sends emergency SMS + WhatsApp via Twilio to the saved emergency contact.

```json
{
  "lat": 12.92,
  "lon": 80.13,
  "medicalSummary": "Blood: B+ | Allergy: Penicillin | Condition: Diabetes",
  "emergencyContact": "+919876543210",
  "patientName": "Arjun Mehta"
}
```

**Response:**
```json
{
  "success": true,
  "sms_sid": "SMxxxxxxxxx",
  "whatsapp_sid": "MMxxxxxxxxx"
}
```

---

### `POST /api/photo-verify`
Sends a base64 image to Claude Vision to verify it shows a road accident.

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "lat": 12.92,
  "lon": 80.13,
  "timestamp": "2026-05-31T10:30:00Z"
}
```

**Response:**
```json
{
  "verified": true,
  "result": "YES",
  "reason": "Accident scene confirmed by AI"
}
```

---

## Running Locally

### Backend

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/saranyyaamondal/roadsos.git
cd roadsos/backend
npm install
```

Create a `.env` file in `backend/`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_PHONE=+1xxxxxxxxxx
TWILIO_WHATSAPP_FROM=+14155238886
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxx
PORT=3000
```

```bash
node server.js
# Server running on port 3000
```

Test it:
```bash
curl "http://localhost:3000/api/nearby?lat=12.92&lon=80.13&type=hospital"
```

### Frontend

Open `frontend/` in VS Code → install the **Live Server** extension → right-click `landing.html` → **Open with Live Server**.

> ⚠️ **GPS requires HTTPS.** It will not work on `file://` or `http://localhost`. For full GPS functionality, use the deployed Vercel URL or deploy your own.

---

## Environment Variables

| Variable | Example | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxxx` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxxx` | Twilio authentication secret |
| `TWILIO_PHONE` | `+17252424690` | Purchased Twilio phone number (SMS) |
| `TWILIO_WHATSAPP_FROM` | `+14155238886` | Twilio WhatsApp sandbox number |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic API key for Claude |
| `PORT` | `3000` | Express server port |

> 🔒 Never commit `.env` to Git. It is listed in `.gitignore`.

---

## How the User Flow Works

```
First visit
└── landing.html
    └── signup.html (3 steps → saves profile to localStorage)
        └── index.html (home)

Return visit
└── landing.html → auto-redirects to index.html

Victim mode (emergency)
└── index.html → tap service → hospitals / police / emergency screen

Bystander mode (emergency)
└── index.html → tap service
    └── verification.html (photo → Claude Vision → 60s countdown)
        └── destination screen (after countdown)
```

---

## Team

| Milestone | Scope |
|---|---|
| M1 | Signup form, localStorage save, language switcher, progress bar |
| M2 | Medical card, WhatsApp share, IndexedDB offline cache, First Aid guide |
| M3 — Anushka Deb | Backend API, Haversine search, all routes, Railway deployment |
| M4 | Home screen, GPS detection, victim/bystander toggle, routing |
| M5 | Hospital + police screens, Leaflet maps, ETA calculation |
| M6 | Claude Vision verify, Claude AI triage, emergency screen, SOS logic |

---

## License

Built for hackathon purposes. All rights reserved by the team.

---

<div align="center">
Made with ❤️ for road safety in India · Hackathon 2026
</div>
