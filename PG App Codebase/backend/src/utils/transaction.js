import mongoose from "mongoose";

const TX_ERROR_PATTERNS = [
  /Transaction numbers are only allowed/i,
  /replica set member or mongos/i,
  /does not support transactions/i,
];

const isTransactionUnsupportedError = (error) =>
  TX_ERROR_PATTERNS.some((pattern) => pattern.test(error.message || ""));

export const runInTransaction = async (work) => {
  let session;

  try {
    session = await mongoose.startSession();

    let result;

    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });

      return result;
    } catch (error) {
      if (!isTransactionUnsupportedError(error)) {
        throw error;
      }

      return await work(undefined);
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
