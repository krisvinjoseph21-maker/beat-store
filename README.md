# PRODKJBEATS

[![CI](https://github.com/krisvinjoseph21-maker/prodkjbeats/actions/workflows/ci.yml/badge.svg)](https://github.com/krisvinjoseph21-maker/prodkjbeats/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](vitest.config.ts)

A full-stack music production marketplace for buying beats, sample packs, and booking custom production services. Built with Next.js, Supabase, and Stripe.

**Live:** [prodkjbeats.com](https://prodkjbeats.com) &nbsp;|&nbsp; **Placements:** GloRilla · DeeBaby · Shenseea

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Database / Auth | Supabase (PostgreSQL + Row-Level Security) |
| Payments | Stripe — one-time purchases + subscriptions + webhooks |
| AI | Anthropic Claude — natural language beat recommendations |
| Email | Resend — transactional order confirmations |
| State | Zustand |
| Styling | Tailwind CSS v4 |
| Deployment | Vercel |

---

## Features

**Store**
- Beat catalog with genre, BPM, and key filtering
- Tiered licensing system (Basic · Standard · Premium · Exclusive)
- Sample pack / drum kit / melody pack bundles
- Weekly loop subscription
- Promo / discount code engine
- Tokenized download links with expiration (anti-piracy)

**AI**
- `POST /api/ai/recommend` — natural language beat search powered by Claude; describe your vibe and get matched beats with reasoning. Uses prompt caching to avoid re-tokenizing the catalog on every request.

**Payments & Fulfillment**
- Stripe Checkout for one-time and recurring purchases
- Webhook-driven fulfillment (order creation, download token generation, email dispatch)
- Admin dashboard for order management and revenue tracking

**Auth**
- Supabase Auth with SSR middleware and OAuth callback
- Separate admin session with HMAC-signed tokens

**Infrastructure**
- Per-route in-memory rate limiting with IP extraction hardened against header spoofing
- Narrow content filter on contact submissions (threats + link spam)
- Environment variable validation at boot — fails fast on misconfiguration

---

## Local Development

### Prerequisites
- Node.js 20+
- A Supabase project
- A Stripe account (test mode)
- An Anthropic API key

### Setup

```bash
git clone https://github.com/krisvinjoseph21-maker/prodkjbeats
cd prodkjbeats
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
ANTHROPIC_API_KEY=
ADMIN_PASSWORD=
ADMIN_HMAC_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm run type-check   # TypeScript type checking
npm run lint         # ESLint
npm test             # unit tests (vitest)
npm run test:coverage  # unit tests with coverage report
```

---

## Architecture Notes

**Download security** — purchased files are never served directly. After a successful Stripe webhook, a short-lived signed token is stored in Supabase. The download endpoint validates the token and streams the file, then marks the token consumed.

**AI recommendation** — `POST /api/ai/recommend` fetches the live beat catalog from Supabase, serializes it as a compact text block, and sends it to Claude with the user's query. The catalog block uses `cache_control: ephemeral` so it is only tokenized once per cache window, keeping latency and cost low for repeated requests.

**Rate limiting** — every public API route calls `rateLimit(getRateLimitKey(req, route))` before any database work. Keys are scoped per-route to prevent cross-endpoint budget sharing. The IP extraction layer prefers the Vercel-injected header over client-controllable headers.

---

## CI

GitHub Actions runs on every push and pull request to `main`:
1. TypeScript type-check (`tsc --noEmit`)
2. ESLint
3. Vitest unit tests

See [.github/workflows/ci.yml](.github/workflows/ci.yml).
