# Techloom.ai Software Engineer Intern — Practical Assessment

**Candidate submission — replace the placeholders below before sharing.**

| | Repository | Live Deployment |
|---|---|---|
| **Task 01 — POS Order & Inventory System** | this repo, [`/task-01`](./task-01) | `<add Vercel/Render/Railway URL here>` |
| **Task 02 — E-Commerce Checkout & Payment System** | this repo, [`/task-02`](./task-02) | `<add Vercel/Render/Railway URL here>` |

Optional walkthrough video: `<add link here>`

## Tech stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose) — deploy on **MongoDB Atlas** so
  multi-document transactions are available (a bare standalone `mongod`
  doesn't support them; the app still runs correctly against one via a
  manual-compensation fallback, but Atlas is what the "database
  transactions" evaluation criterion is aimed at).

## Repository structure

```
/task-01   POS Order & Inventory System (server/, client/, README.md)
/task-02   E-Commerce Checkout & Payment System (server/, client/, README.md)
```

Each task is a fully independent full-stack app with its own `server` and
`client`, meant to be deployed as two separate services (e.g. two Render web
services for the backends, two Vercel/Netlify sites for the frontends), or
combined behind a reverse proxy if preferred.

## Quick start (both tasks)

Each task needs a MongoDB connection string, a running backend, and a
running frontend pointed at that backend. Per-task details, environment
variables, and feature-by-feature testing steps are in each task's own
README:

- [`/task-01/README.md`](./task-01/README.md)
- [`/task-02/README.md`](./task-02/README.md)

In short, for each task:

```bash
# backend
cd task-0X/server
cp .env.example .env      # add your MongoDB Atlas URI
npm install
npm run seed               # loads demo products
npm run dev                 # or: npm start

# frontend (separate terminal)
cd task-0X/client
cp .env.example .env       # point VITE_API_URL at the backend above
npm install
npm run dev
```

## Deployment notes

- **Backend** → Render, Railway, or Fly.io all work well for a long-running
  Express process (needed here since the reservation-expiry sweeper runs as
  a background interval, not a one-shot request). Set `MONGODB_URI`,
  `CLIENT_ORIGIN` (your deployed frontend's URL), and optionally
  `RESERVATION_TTL_MINUTES` / `RESERVATION_SWEEP_INTERVAL_MS` as environment
  variables on the host.
- **Frontend** → Vercel or Netlify. Set `VITE_API_URL` to the deployed
  backend's `/api` base URL as a build-time environment variable.
- **Database** → MongoDB Atlas free tier (M0). Whitelist `0.0.0.0/0` in
  Atlas's Network Access (or your hosting provider's egress IPs) so the
  deployed backend can connect.

## Design notes shared by both tasks

Both tasks are built on the same core commerce engine (`orderStateMachine.js`,
`inventoryService.js`, `orderService.js` in each `server/src`), since the
underlying problem — reserve stock, take a mock payment, handle lifecycle
transitions safely — is the same; Task 02 layers search/filtering and refunds
on top, and uses a persisted `customerId` for order history in place of
Task 01's operator-facing view. See each task's README for the specifics.
