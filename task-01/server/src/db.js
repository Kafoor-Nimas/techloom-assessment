const mongoose = require("mongoose");

let transactionsSupported = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and fill it in.");
  }

  await mongoose.connect(uri);
  console.log(`[db] connected to ${mongoose.connection.name}`);

  transactionsSupported = await detectTransactionSupport();
  console.log(`[db] multi-document transactions supported: ${transactionsSupported}`);
}

// Standalone MongoDB instances don't support multi-document transactions
// (only replica sets / mongos do - this includes every MongoDB Atlas cluster).
// We detect support at boot so the order service can safely fall back to a
// manual compensation strategy when running against a local standalone mongod,
// while still using real ACID transactions in production (Atlas).
async function detectTransactionSupport() {
  const session = await mongoose.connection.startSession();
  try {
    session.startTransaction();
    await session.abortTransaction();
    return true;
  } catch (err) {
    return false;
  } finally {
    session.endSession();
  }
}

function isTransactionsSupported() {
  return transactionsSupported === true;
}

module.exports = { connectDB, isTransactionsSupported };
