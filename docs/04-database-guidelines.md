# Database Guidelines — Job Search CRM

## Platform: Neon (Serverless PostgreSQL)

Free plan. Single user. All queries go through Netlify Functions using postgres.js. The database is never accessed directly from the browser.

---

## Setup

1. Create a Neon project at https://neon.tech
2. Copy the connection string (DATABASE_URL)
3. Add it to Netlify environment variables (or `.env` for local dev)
4. Run the migration: connect to Neon and execute `db/migrations/001_init.sql`

---

## Tables overview

```
companies
  └──< contacts        (one company → many contacts)
  └──< messages        (one company → many messages)
       └── contact_id  (optional FK: which contact was emailed)
  └──< activity_log    (auto-generated history of actions)

email_templates        (reusable email templates)
settings               (single row: user profile info)
```

No `opportunities` table — the user writes proactively to companies without a specific job posting.

---

## Tables

### `companies`
The core entity. Stores every company the user is interested in.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| name | TEXT NOT NULL | |
| domain | TEXT UNIQUE | normalized (e.g. `acme.com`) — used for deduplication |
| website | TEXT | full URL |
| sector | TEXT | free text + predefined suggestions |
| city | TEXT | |
| region | TEXT | |
| country | TEXT | |
| phone | TEXT | |
| linkedin_url | TEXT | |
| source | TEXT DEFAULT 'manual' | `google_places`, `manual`, `linkedin`, `referral` |
| status | TEXT DEFAULT 'new' | CHECK: `new`, `contacted`, `replied`, `interview`, `rejected`, `archived` |
| interest_level | INTEGER 1–5 | |
| notes | TEXT | |
| tags | TEXT[] | flexible labeling |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | auto-updated via trigger |

### `contacts`
People manually added by the user. Always linked to a company.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| company_id | UUID NOT NULL FK | CASCADE DELETE |
| first_name | TEXT NOT NULL | |
| last_name | TEXT | |
| role | TEXT | free text (e.g. "Head of Design") |
| role_type | TEXT | CHECK: `hr`, `ceo`, `design_lead`, `tech_lead`, `other` |
| email | TEXT | |
| phone | TEXT | |
| linkedin_url | TEXT | |
| is_primary | BOOLEAN DEFAULT false | |
| notes | TEXT | |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

### `messages`
Every outreach email, whether draft or sent.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| company_id | UUID NOT NULL FK | CASCADE DELETE |
| contact_id | UUID FK | SET NULL on delete |
| subject | TEXT NOT NULL | |
| body | TEXT NOT NULL | |
| template_id | TEXT | text reference, not FK |
| status | TEXT DEFAULT 'draft' | CHECK: `draft`, `sent`, `replied`, `follow_up`, `closed` |
| sent_at | TIMESTAMPTZ | null until marked as sent |
| replied_at | TIMESTAMPTZ | null until reply recorded |
| reply_notes | TEXT | summary of reply received |
| follow_up_at | DATE | auto-set to sent_at + 7 days |
| follow_up_done | BOOLEAN DEFAULT false | |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

**Important:** the app never sends emails. `sent_at` is set manually when the user marks a message as sent.

### `activity_log`
Auto-generated log of meaningful actions. Never edited by the user.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| company_id | UUID NOT NULL FK | CASCADE DELETE |
| type | TEXT NOT NULL | CHECK: `status_change`, `message_sent`, `reply_received`, `contact_added`, `note_updated` |
| description | TEXT NOT NULL | human-readable |
| metadata | JSONB DEFAULT '{}' | structured extra data |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

### `email_templates`
Reusable email structures with placeholders.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| name | TEXT NOT NULL | |
| subject | TEXT NOT NULL | |
| body | TEXT NOT NULL | supports `{{placeholders}}` |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | |

### `settings`
Single row. Stores the owner's profile info used in email templates.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| my_name | TEXT | |
| my_role | TEXT | |
| my_web | TEXT | |
| my_email | TEXT | |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | |

---

## Security

No RLS needed — the backend API (Netlify Functions) is the only client of the database. The API authenticates the user via JWT cookie before executing any query. The database connection string is never exposed to the browser.

---

## Performance

Indexes on the columns most used in filters and joins:
- `companies.status`, `companies.sector`, `companies.city`, `companies.domain`
- `contacts.company_id`
- `messages.company_id`, `messages.status`
- `messages.follow_up_at` (partial index: `WHERE follow_up_done = false`)
- `activity_log.company_id, created_at DESC`

---

## Query patterns (postgres.js)

```js
import sql from './utils/db.mjs'

// Load company with all related data
const [company] = await sql`SELECT * FROM companies WHERE id = ${id}`
const contacts = await sql`SELECT * FROM contacts WHERE company_id = ${id}`
const messages = await sql`
  SELECT m.*, c.first_name, c.role
  FROM messages m
  LEFT JOIN contacts c ON m.contact_id = c.id
  WHERE m.company_id = ${id}
  ORDER BY m.created_at DESC
`
const activity = await sql`
  SELECT * FROM activity_log
  WHERE company_id = ${id}
  ORDER BY created_at DESC LIMIT 50
`

// Pending follow-ups for today
const today = new Date().toISOString().split('T')[0]
const followUps = await sql`
  SELECT m.*, co.name, co.sector, c.first_name
  FROM messages m
  JOIN companies co ON m.company_id = co.id
  LEFT JOIN contacts c ON m.contact_id = c.id
  WHERE m.follow_up_at <= ${today}
    AND m.follow_up_done = false
  ORDER BY m.follow_up_at ASC
`

// Deduplication check
const [existing] = await sql`
  SELECT id FROM companies WHERE domain = ${domain}
`

// Insert with RETURNING
const [company] = await sql`
  INSERT INTO companies ${sql(body, Object.keys(body))} RETURNING *
`

// Update
const [updated] = await sql`
  UPDATE companies SET ${sql(body, Object.keys(body))}, updated_at = NOW()
  WHERE id = ${id}
  RETURNING *
`

// Search with ILIKE
const results = await sql`
  SELECT * FROM companies
  WHERE name ILIKE ${'%' + search + '%'}
  ORDER BY created_at DESC
`
```
