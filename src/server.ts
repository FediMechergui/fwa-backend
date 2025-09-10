import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { router as contactRouter } from './v1/contact.route.js';
import { testRouter } from './v1/test.route.js';
import { initWhatsApp } from './whatsapp/client.js';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/contact', contactRouter);
app.use('/api/test', testRouter);

async function main() {
  const port = Number(process.env.PORT || 4000);
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in environment');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');

  const provider = (process.env.WHATSAPP_PROVIDER || 'web').toLowerCase();
  if (provider === 'web') {
    await initWhatsApp();
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


