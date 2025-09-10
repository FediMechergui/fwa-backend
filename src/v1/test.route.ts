import { Router } from 'express';
import { z } from 'zod';
import { sendWhatsAppMessage } from '../whatsapp/client';
import { sendWhatsAppCloudMessage } from '../whatsapp/cloud';

export const testRouter = Router();

const schema = z.object({
  to: z.string().min(6),
  text: z.string().min(1),
});

testRouter.post('/send', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { to, text } = parsed.data;
  const provider = (process.env.WHATSAPP_PROVIDER || 'web').toLowerCase();
  try {
    if (provider === 'cloud') {
      await sendWhatsAppCloudMessage(to, text);
    } else {
      await sendWhatsAppMessage(to, text);
    }
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: String(err?.message || err) });
  }
});


