// Central definition of every valid order status and the transitions allowed
// between them. Any code path that changes an order's status must go through
// `assertTransition`, so illegal jumps (e.g. Expired -> Paid) are impossible
// regardless of which route or background job triggers the change.

const STATUSES = Object.freeze({
  PENDING: "Pending", // cart submitted, not yet reserved (transient, usually skipped)
  RESERVED: "Reserved", // stock has been reserved, awaiting payment
  PAID: "Paid", // payment succeeded, order confirmed
  CANCELLED: "Cancelled", // cancelled by user/admin (from Pending, Reserved, or Paid)
  EXPIRED: "Expired", // reservation timed out (5 min) without payment
  FAILED: "Failed", // payment attempt failed
});

const TRANSITIONS = Object.freeze({
  [STATUSES.PENDING]: [STATUSES.RESERVED, STATUSES.CANCELLED],
  [STATUSES.RESERVED]: [STATUSES.PAID, STATUSES.FAILED, STATUSES.EXPIRED, STATUSES.CANCELLED],
  [STATUSES.PAID]: [STATUSES.CANCELLED],
  [STATUSES.FAILED]: [STATUSES.RESERVED], // allow a fresh reservation/retry to be linked, no direct reuse of this order id
  [STATUSES.EXPIRED]: [],
  [STATUSES.CANCELLED]: [],
});

// Statuses where the order still holds a stock reservation that must be
// released if the order moves to a terminal non-paid state.
const STOCK_HELD_STATUSES = [STATUSES.RESERVED, STATUSES.PAID];

class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Invalid order status transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
    this.status = 409;
  }
}

function assertTransition(from, to) {
  const allowed = TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(from, to);
  }
}

module.exports = { STATUSES, TRANSITIONS, STOCK_HELD_STATUSES, assertTransition, InvalidTransitionError };
