# AFAQ OS — Mobile

React Native + Expo (Expo Router) shell for AFAQ OS. Talks to the same
FastAPI backend as the web app via the shared `ApiResponse<T>` envelope.

## Prerequisites

- Node 20+
- Expo CLI (`npx expo --help`)
- Real device via Expo Go, or Android Studio / Xcode simulator

## Running

```bash
cd mobile
npm install
npm start
```

Scan the QR with Expo Go, or press `i` / `a` for simulator.

The default API base is `https://afaq24.store.ngrok.pizza` (set in `app.json`
under `expo.extra.apiBaseUrl`). Change it there for staging / prod.

## Layout

```
mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # root stack
│   └── (tabs)/             # bottom-tab group
│       ├── _layout.tsx     # tab config
│       ├── index.tsx       # Dashboard
│       ├── leads.tsx       # Leads
│       ├── whatsapp.tsx    # WhatsApp
│       └── more.tsx        # More
├── constants/Brand.ts      # BRAND tokens (keep in sync with web design-tokens.css)
└── services/api.ts         # ApiResponse<T> + apiFetch
```

## Brand parity

`constants/Brand.ts` mirrors `frontend/src/styles/design-tokens.css`. When the
web tokens change, update both. Fonts (Manrope, Space Grotesk) load from
Expo Google Fonts in the slot-12 dev pass.

## Feature flag

`MOBILE_APP_API_ENABLED` (backend) gates any mobile-specific endpoints we add.
The shell itself reuses existing endpoints and does not need a flag.

## What's next (slot-12 dev pass)

- Biometric auth + token refresh
- Push notifications (Expo push service)
- Offline cache (tanstack query persist)
- Native share from leads/threads
- Deep links into specific threads / leads
