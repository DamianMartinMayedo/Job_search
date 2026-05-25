# Structure & Navigation — Job Search CRM

## Folder structure

```
src/
├── components/
│   ├── ui/              # Reusable atoms: Button, Badge, Input, Modal, Tabs, EmptyState, etc.
│   ├── layout/          # AppLayout, Sidebar, Header
│   ├── companies/       # CompanyTable, CompanyForm, GoogleSearchModal
│   ├── contacts/        # ContactList, ContactForm
│   └── messages/        # MessageList, EmailComposer, FollowUpAlert
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Companies.jsx
│   ├── CompanyDetail.jsx
│   ├── Contacts.jsx
│   ├── Messages.jsx
│   ├── Templates.jsx
│   └── Settings.jsx
├── hooks/               # TanStack Query hooks: useCompanies, useContacts, useMessages
├── lib/
│   ├── api.js           # fetch wrapper with credentials: 'include' — single entry point to Netlify Functions
│   ├── googlePlaces.js  # Google Places API wrapper (calls /api/places/search)
│   └── emailTemplates.js # Template definitions + renderTemplate() function
├── store/
│   └── useAppStore.js   # Zustand store for UI state (modals, filters, etc.)
├── utils/
│   └── constants.js     # SECTORS, STATUSES, ROLE_TYPES arrays used across the app
├── App.jsx              # Router setup
├── main.jsx
└── index.css            # Tailwind import + @theme tokens
```

---

## Routes

```
/                         Login (public)
/app                      Protected layout wrapper (redirects to /app/dashboard)
/app/dashboard            Home — KPIs, follow-ups, recent activity
/app/companies            Company list with search and filters
/app/companies/:id        Company detail — contacts, messages, notes, activity
/app/contacts             All contacts across companies
/app/messages             All messages — outbox and follow-up tracker
/app/templates            Email template editor
/app/settings             User profile settings (name, role, website)
```

All `/app/*` routes are protected. If no valid JWT cookie session (verified via `GET /api/auth/me`) → redirect to `/`.

---

## App layout

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (fixed, 240px)  │  MAIN AREA                   │
│                          │                              │
│  [Logo]                  │  [Page header + breadcrumb]  │
│                          │                              │
│  Dashboard               │  [Page content]              │
│  Empresas          (42)  │                              │
│  Contactos         (18)  │                              │
│  Mensajes           (5)  │                              │
│  Plantillas              │                              │
│  ───────────             │                              │
│  Ajustes                 │                              │
│  [User name]             │                              │
└─────────────────────────────────────────────────────────┘
```

- Sidebar is always visible on desktop (≥1024px)
- On tablet (768–1023px): sidebar collapses to icon-only (48px wide)
- On mobile (<768px): sidebar hidden, bottom navigation bar with 4 icons (Dashboard, Empresas, Mensajes, +)
- Active nav item has a distinct background using Tailwind classes, not inline styles

---

## CompanyDetail layout (tabs)

The company detail page uses tabs to organize content without overwhelming the user:

```
[Contactos]  [Mensajes]  [Notas]  [Actividad]
```

- **Contactos** — list of key people manually added. Each row: name, role badge, email (copy button), LinkedIn link, edit/delete actions
- **Mensajes** — list of sent/draft emails to this company. Each row: subject, recipient contact, status badge, sent date, follow-up date if set
- **Notas** — single free-text area. Autosaves with 1.5s debounce
- **Actividad** — chronological log of all actions on this company (auto-generated, read-only)

---

## Key UI behaviors to implement consistently

- **Status badges** always use a predefined color map (never dynamic Tailwind string interpolation)
- **Empty states** on every list: an icon, a short message, and a CTA button — never just an empty space
- **Loading states**: skeleton loaders matching the shape of the content (not spinners)
- **Optimistic updates**: when adding a company or contact, show it immediately before the server confirms
- **Toasts**: only for background confirmations (saved, deleted). Errors always inline, next to the action that caused them
- **Follow-up alert**: a persistent banner or highlighted section on the Dashboard when there are pending follow-ups for today
