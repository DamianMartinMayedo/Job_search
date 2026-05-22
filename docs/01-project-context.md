# Project Context — Job Search CRM

## What is this

A private web app for personal job search management. The owner proactively reaches out to companies to explore job opportunities — not responding to job postings. The app centralizes the entire process: discovering companies, storing key contacts, composing outreach emails, and tracking every conversation.

**Single user. No public access. No registration.**

---

## Who uses it

One person: the owner. A UI/UX designer and frontend developer based in Seville, Spain, actively looking for a job. Personal website: https://www.damianmartin.es

---

## Core problem it solves

Without this tool, the job search is scattered: companies in a spreadsheet, contacts in notes, emails in Gmail with no structure, follow-ups forgotten. This app replaces all of that with a single, structured workflow.

---

## How it works — the main flow

```
1. Search for companies by type and location (via Google Places API)
2. Save interesting companies to the database
3. Manually add key contacts found on LinkedIn or the company website
4. Generate an outreach email using a pre-defined template
5. Copy the email and send it manually from their own email client
6. Mark the message as sent inside the app
7. Update the conversation status when a reply arrives
8. Schedule a follow-up if no reply after 7 days
```

The app does NOT send emails automatically. The user sends from their own email client (Gmail, etc.) and records the action inside the app.

---

## Key concepts / domain glossary

**Company** — Any business the user wants to contact. Added via Google Places search or manually. Has a status that evolves over time.

**Contact** — A specific person at a company (e.g. HR Manager, Head of Design, CEO). Added manually by the user after researching on LinkedIn or the company website. A company can have multiple contacts.

**Message** — An outreach email the user composed and sent (or plans to send) to a contact at a company. Generated from a template, edited freely, then marked as sent.

**Template** — A reusable email structure with placeholders (e.g. `{{company_name}}`, `{{contact_name}}`). The user has a small set of templates for different scenarios (cold outreach, follow-up).

**Status (company)** — Tracks where the company is in the process:
- `new` → saved, not yet contacted
- `contacted` → email sent, waiting for reply
- `replied` → they responded
- `interview` → in an interview process
- `rejected` → discarded
- `archived` → saved for later

**Status (message)** — Tracks the state of a single email:
- `draft` → written but not sent yet
- `sent` → sent, waiting for reply
- `replied` → received a response
- `follow_up` → needs a follow-up
- `closed` → conversation ended

**Follow-up** — A reminder to send a second email if no reply is received. Automatically suggested 7 days after the first send.

**Activity log** — An automatic record of every action on a company (status changed, contact added, message sent, reply received). Shown as a timeline.

---

## What this app is NOT

- Not a job board or aggregator
- Not an automated email sender
- Not a multi-user platform
- Not a LinkedIn scraper
- Not a CRM for sales — it's a CRM for a personal job search
