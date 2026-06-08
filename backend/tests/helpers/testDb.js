import mongoose from "mongoose";

export const connectTestDb = async () => {
  if (!process.env.TEST_DB_URL) {
    throw new Error("TEST_DB_URL is required for database integration tests.");
  }

  await mongoose.connect(process.env.TEST_DB_URL, {
    dbName: "Job_Portal_Test",
  });
};

export const clearTestDb = async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
};

export const closeTestDb = async () => {
  await mongoose.disconnect();
};
