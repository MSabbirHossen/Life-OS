import app from '../server/server.js';
import { connectDB } from '../server/config/db.js';

let isConnected = false;

export default async function handler(req, res) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
  } catch (err) {
    console.error('[Vercel Serverless DB Error]:', err.message);
    // Don't crash entirely; let health checks or unauthenticated routes attempt to respond
  }

  return app(req, res);
}
