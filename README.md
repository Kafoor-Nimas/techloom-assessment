# Techloom.ai Software Engineer Intern — Practical Assessment


|                                                    | Repository                         | Live Deployment                                                    |
| -------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| **Task 01 — POS Order & Inventory System**         | this repo, [`/task-01`](./task-01) | https://techloom-assessment-peach.vercel.app                            |
| **Task 02 — E-Commerce Checkout & Payment System** | this repo, [`/task-02`](./task-02) | https://techloom-assessment-task-02-client-gqnpajqua.vercel.app |

## Tech stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** Node.js + Express
- **Database:** MongoDB (Mongoose) — deploy on **MongoDB Atlas**  

## Repository structure

```
/task-01   POS Order & Inventory System (server/, client/, README.md)
/task-02   E-Commerce Checkout & Payment System (server/, client/, README.md)
```

Each task is a fully independent full-stack app with its own `server` and
`client`, meant to be deployed as two separate services (e.g. two Vercel web
services for the backends, two Vercel sites for the frontends)

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
npm run dev                

# frontend (separate terminal)
cd task-0X/client
cp .env.example .env       # point VITE_API_URL at the backend above
npm install
npm run dev
```

## Deployment notes

- **Backend** → Set `MONGODB_URI`,
  `CLIENT_ORIGIN` (your deployed frontend's URL), and optionally
  `RESERVATION_TTL_MINUTES` / `RESERVATION_SWEEP_INTERVAL_MS` as environment
  variables on the host.
- **Frontend** → Set `VITE_API_URL` to the deployed
  backend's `/api` base URL as a build-time environment variable.
- **Database** → MongoDB Atlas free tier (M0). Whitelist `0.0.0.0/0` in
  Atlas's Network Access so the
  deployed backend can connect.

**GitHub repository:** https://github.com/Kafoor-Nimas/techloom-assessment.git


