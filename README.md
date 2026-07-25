# InterviewVault

A dark-themed, glassmorphism-styled interview-prep vault: track questions, code
solutions in multiple languages, run spaced-repetition revisions, and see your
progress on a GitHub-style heatmap.

This build is a **solid, real full-stack core** — not a mockup:

- Real JWT auth (access token in memory + rotating refresh token in an
  httpOnly cookie), rate limiting, helmet, input validation, sanitization
- Real MongoDB-backed Question model with full CRUD, filtering, text search,
  sorting, and pagination
- A working spaced-repetition engine (1 / 3 / 7 / 15 / 30 / 60 / 90-day
  intervals)
- Dashboard aggregations computed from real data: solved/pending counts,
  revision-due count, streaks, activity heatmap, topic/company progress
- Question Library with card & table views, infinite scroll, live filters
- Question Detail page with a Monaco code editor (7 languages), **real "Run
  code" execution** (via the free Piston sandboxed-execution API — stdout/
  stderr/compile errors/exit code, with optional stdin), an explanation
  form, resource links, and a markdown notes editor with preview
- Settings/profile page
- Collections (create/rename/delete, add & remove questions, per-question
  "add to collection" menu)
- Companies and Topics standalone list + detail pages, built on the
  dashboard aggregation endpoints
- Graph View (React Flow) visualizing Question ↔ Topic ↔ Company
  relationships
- Analytics page with chart-based views over the aggregation endpoints
- Global search + command palette (Ctrl/Cmd+K) across titles, notes, and
  tags
- Export questions and collections to **JSON, Markdown, or PDF** (Export
  button on the Library, a single question, or a collection); **JSON
  import** back in on the Library page
- **Drag & drop reordering** of questions within a collection
- **Active sessions panel** (Settings) — see every signed-in device with
  browser/OS, IP, and last-active time, and revoke one session or all other
  sessions at once

**Not included in this pass**: Markdown/PDF **import** (only JSON
round-trips reliably — export still supports all three formats); email
verification is intentionally out of scope for this build.

---

## Prerequisites

- Node.js 18+
- MongoDB running somewhere reachable — either:
  - **Local**: install MongoDB Community Server and run it on
    `mongodb://127.0.0.1:27017`, or
  - **Atlas**: create a free cluster at mongodb.com and copy its connection
    string

## 1. Backend setup

```bash
cd server
cp .env.example .env
```

Open `.env` and set:
- `MONGO_URI` — your local or Atlas connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — generate real random values:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
  (run it twice, once for each secret)

Then install and run:

```bash
npm install
npm run dev
```

The API starts on **http://localhost:5000**. Check `http://localhost:5000/api/health`
to confirm it connected to MongoDB.

### Optional: seed demo data

```bash
npm run seed
```

This creates a demo account (`demo@interviewvault.dev` / `password123`) with
a handful of sample questions and 10 days of backfilled activity so the
dashboard isn't empty on first login.

## 2. Frontend setup

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` requests
to the backend on port 5000 (see `vite.config.js`), so no CORS setup is
needed in development.

Register a new account, or log in with the seeded demo account above.

## Project structure

```
server/
  src/
    config/db.js            Mongo connection
    models/                 User, Question, Activity (Mongoose schemas)
    middleware/              auth, validation, error handling
    controllers/              route logic
    routes/                    auth / questions / dashboard
    utils/                     tokens, activity/streak logic, seed script
client/
  src/
    api/                      axios client + typed request functions
    context/AuthContext.jsx   session state, silent refresh on load
    components/                Sidebar, cards, heatmap, editors, etc.
    pages/                      Login, Register, Dashboard, Library, Detail, Settings
    layouts/AppLayout.jsx      sidebar + content shell
```

## Design system

- Dark base (`#0A0D14`) with a blue→purple accent gradient
  (`#5B8DEF → #A855F7`), glassmorphism cards (`backdrop-blur` + translucent
  borders), rounded corners throughout
- Type: Space Grotesk for headings, Inter for body text, JetBrains Mono for
  code and stats
- Signature elements: the GitHub-style activity heatmap with a flickering
  streak flame on the dashboard, and a subtle animated knowledge-graph motif
  on the auth screens (a nod to the eventual Graph View)

## What's not built yet

Auth (with active-session management), question CRUD, dashboard, library,
collections (with drag & drop reordering), companies/topics, graph view,
analytics, search, code execution, export/import, and AI features are all
real and wired end-to-end. What's left:

1. **Email verification** on registration (out of scope for this build)
2. **Markdown/PDF import** — export supports all three formats, but import
   only accepts the JSON format back in, since Markdown/PDF aren't reliable
   round-trip formats

Happy to build out either of these next — just say which one.

## Export / Import

Every question, a single question, or a whole collection can be exported as
**JSON**, **Markdown**, or **PDF** via the "Export" button on the Question
Library, a Question Detail page, or a Collection page
(`GET /api/export/questions`, `GET /api/export/collections/:id`). JSON
exports are the only format that can be **imported** back in — use the
"Import" button on the Question Library (`POST /api/import/questions`);
imported questions are always created fresh under your account (ids,
timestamps, and revision progress from the file are ignored, capped at 500
questions per import).

## Collections: drag & drop

Within a collection's detail page, drag the handle on the left of each
question row to reorder it — the new order is persisted immediately
(`PATCH /api/collections/:id/reorder`).

## Active sessions

Settings → **Active sessions** lists every device currently signed in
(browser/OS, IP, last-active time), with a "This device" tag on the current
one. You can revoke a single session or log out of every other session at
once. Under the hood, refresh tokens are stored only as a SHA-256 hash
(`server/src/models/User.js`, `server/src/controllers/auth.controller.js`)
so a database read alone can't be replayed as a session.

## Code execution

The "Run" button on a question's Code tab sends `{ language, code, stdin }`
to `POST /api/execute`, which proxies to the free
[Piston](https://github.com/engineer-man/piston) execution API
(`emkc.org`) — no API key needed. The server resolves the right
language/version at request time (cached for an hour) and returns stdout,
stderr, compile errors, and the exit code. It's rate-limited separately
(15 runs/minute/IP) since it calls out to a third-party sandbox. If your
deployment can't reach `emkc.org`, point `PISTON_BASE` in
`server/src/controllers/execute.controller.js` at a self-hosted Piston
instance instead.

## AI features (Gemini)

Five AI features are wired up, all backed by the Gemini API
(`server/src/services/gemini.js`, `POST /api/ai/*`, 20 requests/min/IP):

- **Explain code** — Code tab → "Explain with AI" walks through the saved
  solution's approach, complexity, and edge cases as rendered markdown.
- **Similar / follow-up questions** — Explanation tab → "Suggest with AI"
  generates 4 related questions (2 same-concept, 2 harder follow-ups), each
  with a one-click "Add" that saves it straight into your library.
- **Mock interviewer** — "Mock interview" button opens a chat modal where
  Gemini plays interviewer for that specific question: it won't hand you
  the solution, asks guiding questions, and probes complexity/edge cases.
  The full conversation is resent each turn (server is stateless).
- **Quiz generation** — new **AI Quiz** page (sidebar): pick a topic/
  company/difficulty and a question count, and Gemini writes a multiple-
  choice quiz from the concepts behind your matching saved questions, with
  scoring and per-question explanations after you submit.
- **Note summarization** — Notes tab → "Summarize with AI" condenses your
  notes into a short bullet list, with an "Append to notes" shortcut.

### Setup

```bash
# server/.env
GEMINI_API_KEY=your-key-from-https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash   # optional override
```

If `GEMINI_API_KEY` isn't set, the `/api/ai/*` endpoints return a clear
503 rather than failing silently; every button above surfaces that error
inline instead of hanging.
