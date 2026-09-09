import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas with resilient timeouts and connection pooling.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifeos';

  try {
    console.log(`[MongoDB] Connecting to primary database...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      family: 4,
      maxPoolSize: 20,
    });
    console.log(`[MongoDB Connected] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);

    // Drop legacy username index if present
    try {
      await mongoose.connection.collection('users').dropIndex('username_1');
    } catch (e) {}
  } catch (error) {
    console.warn(`[MongoDB Primary Connection Warning]: ${error.message}. Initializing fallback...`);
    try {
      await mongoose.disconnect().catch(() => {});
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB Connected In-Memory Fallback] Host: ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`[MongoDB Connection Error]: ${fallbackError.message}`);
    }
  }
};
