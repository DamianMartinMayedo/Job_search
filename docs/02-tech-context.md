# Tech Context — Job Search CRM

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Client state | Zustand v5 |
| Database | Neon (serverless PostgreSQL) |
| DB Client | postgres.js (raw SQL, tagged templates) |
| Backend | Netlify Functions (serverless API) |
| Auth | JWT via HttpOnly cookies (single user, login with email + password) |
| Hosting | Netlify (free plan) |
| Icons | Lucide React |
| External API | Google Places API (Text Search) — proxied through Netlify Function |

---

## Architecture

```
Browser (React SPA)
     │
     ├── /api/auth/*  →  Netlify Functions (auth.mjs)  ──  JWT cookies
     └── /api/*       →  Netlify Functions (api.mjs)   ──  postgres.js  ──  Neon PostgreSQL
```

All database access goes through the Netlify Functions API layer. The browser never talks to the database directly. Auth is handled via JWT stored in an HttpOnly cookie, set by the server on login.

---

## Hard rules — never break these

### Styling
- **All styles must use Tailwind CSS utility classes only**
- No inline styles (`style={{...}}`) anywhere — not even for dynamic values. Use Tailwind's arbitrary value syntax instead: `w-[240px]`, `bg-[#fff]`
- No CSS modules, no styled-components, no emotion, no external UI libraries (no shadcn, no MUI, no Chakra)
- CSS custom properties are allowed only in `index.css` inside `@theme {}` for design tokens
- Dynamic class variants must use full class names — Tailwind does not support string concatenation for class names:
  ```jsx
  // ✗ Wrong
  className={`bg-${color}-500`}
  
  // ✓ Correct
  const colorMap = { green: 'bg-green-500', red: 'bg-red-500' }
  className={colorMap[color]}
  ```

### Components
- Functional components only — no class components
- All components use hooks
- No component libraries — build all UI from scratch with Tailwind

### Data
- All data fetching through TanStack Query hooks — no raw `useEffect` + `useState` for server data
- All API calls go through `src/lib/api.js` — the single `fetch` wrapper with `credentials: 'include'`
- No `localStorage` or `sessionStorage` — Netlify serves in contexts where storage can be restricted. Use in-memory state (Zustand) for transient UI state
- Auth token is stored in an HttpOnly cookie (set server-side), never accessible from JavaScript

### Security
- `VITE_GOOGLE_PLACES_API_KEY` is read server-side by the Netlify Function that proxies Google Places API calls. It is NOT exposed to the browser
- Auth credentials (`AUTH_EMAIL`, `AUTH_PASSWORD`, `JWT_SECRET`) are server-side only in environment variables
- `DATABASE_URL` is server-side only — never exposed to the browser
- JWT is signed with HS256 and stored in HttpOnly, Secure, SameSite=Strict cookie

---

## What NOT to install or use

| Avoid | Reason |
|-------|--------|
| shadcn/ui, MUI, Chakra, Radix UI | Conflicts with Tailwind-only rule |
| axios | Native fetch is enough |
| moment.js / date-fns | Use native `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat` |
| react-hook-form | Overkill for this scale; vanilla controlled inputs |
| Redux, Jotai, Recoil | Zustand is already chosen |
| CSS-in-JS of any kind | Conflicts with Tailwind-only rule |
| Any email sending library | Emails are sent manually by the user outside the app |
| ORMs (Prisma, Drizzle) | postgres.js raw SQL is chosen |

---

## Environment variables

```env
# Neon PostgreSQL
DATABASE_URL=postgres://user:password@host/database

# Auth (simple login, single user)
AUTH_EMAIL=damianmartinmayedo@gmail.com
AUTH_PASSWORD=123456
JWT_SECRET=change-me-to-a-random-string

# Google Places API (proxied through server)
VITE_GOOGLE_PLACES_API_KEY=
```

Variables prefixed with `VITE_` are available at build time. `DATABASE_URL`, `JWT_SECRET`, `AUTH_EMAIL`, and `AUTH_PASSWORD` are server-side only (Netlify environment variables).

---

## Tailwind v4 setup note

Tailwind v4 uses `@tailwindcss/vite` plugin — no `tailwind.config.js` file needed.

```js
// vite.config.js
import tailwindcss from '@tailwindcss/vite'
export default { plugins: [react(), tailwindcss()] }
```

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Design tokens go here */
}
```

---

## Local development

```bash
npm run dev        # Runs netlify dev (Vite + Functions)
npm run build      # Vite build (for production)
```

The Vite dev server proxies `/api/*` to Netlify Functions on port 8888. `netlify dev` handles running both Vite and the Functions locally.

---

## Google Places API usage

Using the **Text Search (New)** endpoint: `POST https://places.googleapis.com/v1/places:searchText`

The browser calls `POST /api/places/search` which proxies to Google Places. The API key is never exposed to the client. The user types a company type (e.g. "estudio de diseño") and a city. The API returns up to 20 businesses.

Fields requested: `displayName`, `websiteUri`, `formattedAddress`, `nationalPhoneNumber`
