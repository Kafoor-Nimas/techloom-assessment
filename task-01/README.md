# Task 01 — Counter POS: Concurrency-Safe Order & Inventory System

**Stack:** React + Tailwind (frontend) · Node.js/Express + MongoDB/Mongoose (backend)

## What this is

A point-of-sale backend that manages product inventory and order lifecycle with
overselling prevention, timed stock reservations, mock payments, and full
order-status tracking. See [`/server/src`](./server/src) for the implementation
and inline comments explaining each design decision.

## How overselling is prevented

Every unit of stock lives in `Product.stock`, which always represents
*available* (sellable) inventory. Reserving stock is a single atomic MongoDB
operation:

```js
Product.findOneAndUpdate(
  { _id: productId, stock: { $gte: qty } },
  { $inc: { stock: -qty } }
)
```

MongoDB evaluates the filter and the `$inc` as one atomic document operation,
so two concurrent requests racing for the last unit can never both succeed —
whichever loses the race simply gets `null` back and the checkout fails with
"insufficient stock." This holds regardless of how many app server instances
are running, because the guarantee comes from the database, not from
in-process locking.

Multi-document transactions (Order creation + Product stock update together)
are used automatically when the target MongoDB deployment is a replica set
(e.g. any MongoDB Atlas cluster). Against a bare standalone `mongod` (which
doesn't support transactions), the app detects this at boot and falls back to
manual compensation — if reserving item 3 of 4 fails, items 1–2 are rolled
back before the error is returned. **For real transactional guarantees,
deploy against MongoDB Atlas** (its free tier is already a replica set).

## Order lifecycle

```
Pending → Reserved → Paid
                    → Failed   (stock released)
                    → Expired  (5 min timeout, stock released)
        → Cancelled (from Pending, Reserved, or Paid — stock released if held)
```

All transitions are enforced centrally in `orderStateMachine.js` — no code
path can move an order to an invalid next status.

## Reservation timeout

Checkout sets `reservationExpiresAt = now + 5 minutes`. A background sweeper
(`reservationSweeper.js`) polls every 10 seconds for `Reserved` orders past
that timestamp, expires them, and releases their stock. There's also a lazy
check on every read/pay/cancel call, so correctness doesn't depend on the
sweeper's polling interval.

## Payments & duplicate protection

`POST /orders/:id/pay` requires a client-generated `idempotencyKey`. If the
same key is replayed (network retry, double-click), the original recorded
outcome is returned instead of re-charging. A `timeout` outcome leaves the
order in `Reserved` — it just keeps counting down to its existing expiry.

## Setup

### Backend
```bash
cd server
cp .env.example .env   # fill in MONGODB_URI (Atlas connection string)
npm install
npm run seed            # optional: adds 5 demo products, one with stock=3
npm run dev
```

### Frontend
```bash
cd client
cp .env.example .env   # set VITE_API_URL to your backend URL
npm install
npm run dev
```

## Testing the key features

| Feature | How to test |
|---|---|
| Overselling prevention | Seed the "Ceramic Mug" (stock 3), open the app in several tabs, add 1 to cart in each, and check out simultaneously — only 3 succeed. |
| Reservation expiry | Check out, then wait 5 minutes without paying — refresh and the order flips to `Expired`, stock count goes back up. |
| Payment outcomes | On a `Reserved` order, use the "Simulate success / failure / timeout" buttons. |
| Duplicate payment | Rapidly click "Simulate success" twice — the second click reuses a fresh idempotency key per click by design, so to test replay, resend the exact same request body (e.g. via curl) twice. |
| Cancellation | Cancel a `Reserved` or `Paid` order and confirm the product's stock count increases. |
| Admin CRUD | Use "Manage inventory" to create/edit/delete products. |

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | server | MongoDB Atlas (or other) connection string |
| `PORT` | server | API port (default 4000) |
| `CLIENT_ORIGIN` | server | CORS allow-origin for the deployed frontend |
| `RESERVATION_TTL_MINUTES` | server | Reservation window (default 5) |
| `RESERVATION_SWEEP_INTERVAL_MS` | server | Sweeper poll interval (default 10000) |
| `VITE_API_URL` | client | Base URL of the deployed backend, e.g. `https://your-api.onrender.com/api` |
