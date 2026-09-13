import mongoose from 'mongoose';
import app from '../server/server.js';
import { connectDB } from '../server/config/db.js';

export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    console.error('[Vercel Serverless DB Error]:', err.message);
    // Continue so health check or unauthenticated routes can still respond
  }

  return app(req, res);
}
