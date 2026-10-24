# Wanes - Mutual Aid & Care Platform

Wanes (ونس) is a next-generation community mutual aid, elder care companionship, daily assistance, and real-time emergency safety telemetry platform.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation
```bash
npm install
```

### Development Server
Start the local development server:
```bash
npm run dev
```

### Type Checking & Build
Run full TypeScript type validation and Vite production bundle build:
```bash
# Type check
npm run typecheck

# Production build
npm run build

# Preview build locally
npm run preview
```

---

## 🛠️ Tech Stack
- **Framework**: React 19 (TypeScript)
- **Bundler & Tooling**: Vite 7
- **Styling**: Tailwind CSS v4, Lucide React
- **Animations**: GSAP
- **Backend & Auth**: Supabase
- **UI Components**: Radix UI, Sonner

---

## 📁 Project Structure
```text
├── public/                 # Static assets (video telemetry, icons)
├── src/
│   ├── components/         # Reusable UI elements, modals, dialogs
│   │   ├── accessibility/  # Voice, contrast, and font size controls
│   │   ├── admin/          # Volunteer verification dashboard
│   │   ├── ai-assistant/   # AI chat support agent
│   │   ├── auth/           # Authentication views & modals
│   │   ├── checkout/       # Service order checkout flow
│   │   ├── dashboard/      # User activity & request dashboard
│   │   ├── location/       # Live geolocation & mapping
│   │   ├── negotiation/    # Mutual aid request terms & offers
│   │   ├── pages/          # Primary application screens
│   │   ├── sections/       # Landing page hero, trust, & feature sections
│   │   ├── ui/             # Shadcn / Radix primitive components
│   │   ├── urgent/         # Urgent request broadcast banners
│   │   └── verification/   # Identity verification steps
│   ├── lib/                # Utility helpers & Supabase client
│   ├── App.tsx             # Root application orchestrator
│   ├── index.css           # Global CSS variables & Tailwind tokens
│   └── main.tsx            # React DOM entrypoint
├── components.json         # Shadcn configuration
├── index.html              # HTML shell & SEO meta
├── package.json            # Project manifest & build scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration & code-splitting chunks
```
