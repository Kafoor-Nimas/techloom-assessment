# Task 02 — Fernweh Goods: E-Commerce Checkout & Payment System

**Stack:** React + React Router + Tailwind (frontend) · Node.js/Express +
MongoDB/Mongoose (backend)

## What this is

A customer-facing storefront: search/filter products, add to cart, check out
against a mock payment gateway that can succeed, fail, or time out, then
manage cancellations, refunds, and order history. Shares the same
concurrency-safe reservation engine as [Task 01](../task-01) — see that
README for the deep-dive on how overselling is prevented, since the
mechanism (atomic conditional `$inc` on `Product.stock`) is identical here.

## What's different from Task 01

- **Search & filtering** — `GET /api/products?search=&category=&minPrice=&maxPrice=&inStock=true`
- **`customerId`** — a UUID persisted in `localStorage` (no real auth in
  scope) that orders are grouped by for the "order history" view.
- **Refunds** — `POST /api/orders/:id/refund` simulates reversing a charge.
  An order is refund-eligible once it was `Paid` and is later `Cancelled`, or
  if it ended up `Failed`. Refunding is idempotent — calling it twice is a
  no-op the second time.

## Order lifecycle

Identical state machine to Task 01:
```
Pending → Reserved → Paid
                    → Failed   (stock released)
                    → Expired  (5 min timeout, stock released)
        → Cancelled (stock released if it was held) → eligible for refund if it was ever Paid
```

## Setup

### Backend
```bash
cd server
cp .env.example .env   # fill in MONGODB_URI (Atlas connection string)
npm install
npm run seed            # optional: 7 demo products across categories, one out-of-stock, one low-stock
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
| Search & filter | Type in the search box, pick a category, or set a price range on the Shop page. |
| Reservation on checkout | Add items and check out — the product's available stock drops immediately. |
| Payment outcomes | On the Order History page, use "Simulate success / failure / timeout" on a `Reserved` order. |
| Duplicate payment protection | Each payment click generates a fresh idempotency key; to see key-replay protection, POST the same `idempotencyKey` twice via curl/Postman — the second call returns the first result instead of processing again. |
| Refund | Pay an order successfully, cancel it, then click "Refund" — it becomes eligible because it was once `Paid`. |
| Order history | Visit `/orders` — it's scoped to your browser's persisted `customerId`. |

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | server | MongoDB Atlas (or other) connection string |
| `PORT` | server | API port (default 4001) |
| `CLIENT_ORIGIN` | server | CORS allow-origin for the deployed frontend |
| `RESERVATION_TTL_MINUTES` | server | Reservation window (default 5) |
| `RESERVATION_SWEEP_INTERVAL_MS` | server | Sweeper poll interval (default 10000) |
| `VITE_API_URL` | client | Base URL of the deployed backend, e.g. `https://your-api.onrender.com/api` |
