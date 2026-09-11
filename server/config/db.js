import mongoose from 'mongoose';
import dns from 'dns';

/**
 * Check if the Atlas host is reachable via DNS TXT lookup without hanging the driver.
 */
const checkAtlasReachable = async (uri) => {
  if (!uri || !uri.startsWith('mongodb+srv://')) return true;
  const match = uri.match(/@([^/?]+)/);
  if (!match) return true;
  const host = match[1];

  try {
    await Promise.race([
      dns.promises.resolveTxt(host),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DNS TXT preflight timeout (1500ms)')), 1500)
      ),
    ]);
    return true;
  } catch (err) {
    console.warn(`[MongoDB Atlas Preflight]: DNS TXT query failed (${err.message})`);
    return false;
  }
};

/**
 * Connect to MongoDB with instant fallback if Atlas is unreachable or IP is unwhitelisted.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lifeos';

  const isReachable = await checkAtlasReachable(uri);

  if (isReachable) {
    try {
      console.log(`[MongoDB] Connecting to primary database...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        socketTimeoutMS: 15000,
        family: 4,
        maxPoolSize: 20,
      });
      console.log(`[MongoDB Connected] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);

      try {
        await mongoose.connection.collection('users').dropIndex('username_1');
      } catch (e) {}
      return conn;
    } catch (primaryError) {
      console.warn(`[MongoDB Primary Connection Failed]: ${primaryError.message}. Switching to fallback...`);
    }
  }

  // Fallback to in-memory database
  try {
    console.log(`[MongoDB] Initializing in-memory database fallback...`);
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[MongoDB Connected In-Memory Fallback] Host: ${conn.connection.host} | DB: ${conn.connection.name}`);
    return conn;
  } catch (fallbackError) {
    console.error(`[MongoDB Fallback Error]: ${fallbackError.message}`);
  }
};
