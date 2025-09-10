import { Router } from 'express';
import { z } from 'zod';
import { Contact } from './contact.model.js';
import { sendWhatsAppMessage } from '../whatsapp/client.js';
import { sendWhatsAppCloudMessage } from '../whatsapp/cloud.js';

export const router = Router();

const contactSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  whatsapp: z.string().min(6),
  description: z.string().min(1),
  projectTypes: z.array(z.string()).optional(),
  additionalFeatures: z.array(z.string()).optional(),
  meetingDate: z.string().datetime().optional(),
  language: z.string().optional(),
});

router.post('/', async (req, res) => {
  console.log('[contact] incoming');
  const parseResult = contactSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.flatten() });
  }
  const data = parseResult.data;

  const saved = await Contact.create({
    ...data,
    meetingDate: data.meetingDate ? new Date(data.meetingDate) : undefined,
  });
  console.log('[contact] saved', { id: saved._id.toString() });

  const envTarget = process.env.WHATSAPP_TARGET;
  const formTarget = (String(saved.whatsapp || '').replace(/\D/g, '')) || undefined;
  const target = envTarget && envTarget.trim().length > 0 ? envTarget : formTarget;
  const disableSend = (process.env.WHATSAPP_DISABLE_SEND || 'false').toLowerCase() === 'true';
  if (target && !disableSend) {
    const message = buildWhatsAppMessage(saved.toObject());
    // Fire-and-forget to avoid crashing or blocking the request on WA errors
    (async () => {
      try {
        const provider = (process.env.WHATSAPP_PROVIDER || 'web').toLowerCase();
        console.log('[contact] sending', { provider, target });
        if (provider === 'cloud') {
          await sendWhatsAppCloudMessage(target, message);
        } else {
          await sendWhatsAppMessage(target, message);
        }
        console.log('[contact] sent');
      } catch (err) {
        console.error('WhatsApp send failed', err);
      }
    })();
  } else {
    console.log('[contact] skip send', { targetPresent: Boolean(target), disableSend });
  }

  res.status(201).json({ id: saved._id });
});

function buildWhatsAppMessage(data: any): string {
  const projectTypes: string[] = Array.isArray(data.projectTypes) ? data.projectTypes : [];
  const additionalFeatures: string[] = Array.isArray(data.additionalFeatures) ? data.additionalFeatures : [];
  const when = data.meetingDate ? new Date(data.meetingDate).toLocaleString() : '-';

  const formattedTypes = projectTypes.length
    ? projectTypes.map((t: string) => `• ${t}`).join('\n')
    : '• -';
  const formattedFeatures = additionalFeatures.length
    ? additionalFeatures.map((f: string) => `• ${f}`).join('\n')
    : '• -';

  return [
    '⭐️ New Contact Request',
    `\n*Name:* ${data.fullName}`,
    `*Email:* ${data.email}`,
    `*WhatsApp:* ${data.whatsapp}`,
    `*Language:* ${data.language || '-'}`,
    `*Meeting:* ${when}`,
    '\n*Project Types:*',
    formattedTypes,
    '\n*Additional Features:*',
    formattedFeatures,
    '\n*Description:*',
    data.description?.trim() || '-',
  ].join('\n');
}


