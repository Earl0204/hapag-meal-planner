# 🍽️ Hapag — Ang Hapag ng Pamilya

> AI-powered Filipino meal planner, pantry manager & palengke price tracker

**"Ano ang ulam ngayon?"** — We answer it for you.

## 🗂️ Project Structure

```
hapag/
├── client/          → Vite + React + TypeScript (Vercel)
├── server/          → Express.js API (Render.com)
├── supabase/
│   ├── migrations/  → PostgreSQL schema files
│   └── seed/        → Seed data (recipes, cuisines, countries)
└── README.md
```

## 🚀 Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Vite + React + TypeScript | Vercel |
| Backend | Express.js + Node.js | Render.com |
| Database | PostgreSQL | Supabase |
| Auth | Supabase Auth | Supabase |
| Realtime | Supabase Realtime | Supabase |
| Storage | Supabase Storage + Cloudinary | Cloud |
| Cache | Upstash Redis | Upstash |
| Payments | Stripe | Stripe |
| AI | Google Gemini Flash | Google |
| Email | Resend | Resend |

## 💳 Subscription Tiers

- **Free** — Search recipes, manual grocery list, save 10 recipes
- **Pro ₱199/mo** — AI recipe gen, meal planning, macro tracking
- **Ultra ₱499/mo** — Household sync, TikTok/IG import, delivery export

## 📦 Getting Started

### Client
```bash
cd client
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```

### Server
```bash
cd server
npm install
cp .env.example .env         # fill in all keys
npm run dev
```

## 🌐 Domain
`hapag.ph` / `hapag.app`

## 📣 Tagline
*"Ang Hapag ng Pamilya."*
