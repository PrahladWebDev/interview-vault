import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in your .env file');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);

  console.log(`[db] connected -> ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });
}
