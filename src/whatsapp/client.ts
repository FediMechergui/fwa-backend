import WhatsAppWeb from 'whatsapp-web.js';
const { Client, LocalAuth } = WhatsAppWeb as unknown as { Client: any; LocalAuth: any };
import qrcode from 'qrcode-terminal';

let client: Client | null = null;
let readyPromise: Promise<void> | null = null;

export async function initWhatsApp(): Promise<void> {
  if (client) return;
  const executablePath = process.env.CHROME_PATH && process.env.CHROME_PATH.trim().length > 0
    ? process.env.CHROME_PATH
    : undefined;
  const headlessEnv = (process.env.WHATSAPP_HEADLESS || 'false').toLowerCase();
  const headless = headlessEnv === 'true' || headlessEnv === '1';
  const webVersion = process.env.WHATSAPP_WEB_VERSION && process.env.WHATSAPP_WEB_VERSION.trim().length > 0
    ? process.env.WHATSAPP_WEB_VERSION.trim()
    : undefined;

  const webVersionConfig = webVersion
    ? { webVersion, webVersionCache: { type: 'none' as const } }
    : { webVersionCache: { type: 'remote' as const, remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/wa-version.json' } };

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    },
    ...webVersionConfig,
  });

  if (webVersion) {
    console.log(`Using pinned WhatsApp Web version: ${webVersion}`);
  } else {
    console.log('Using remote WhatsApp Web version map (wppconnect)');
  }

  readyPromise = new Promise((resolve) => {
    client!.on('qr', (qr) => {
      console.log('WhatsApp QR code (scan in WhatsApp):');
      try {
        qrcode.generate(qr, { small: true });
      } catch (e) {
        console.log(qr);
      }
    });
    client!.on('ready', () => {
      console.log('WhatsApp client is ready');
      resolve();
    });
  });

  await client.initialize();
  await readyPromise;
}

export async function sendWhatsAppMessage(targetNumberE164NoPlus: string, message: string): Promise<void> {
  if (!client) {
    throw new Error('WhatsApp client not initialized');
  }
  if (readyPromise) await readyPromise;
  const attempt = async () => {
    // Preferred path: resolve to internal id
    const numberId = await (client as any).getNumberId(targetNumberE164NoPlus);
    if (!numberId) {
      throw new Error(`The number ${targetNumberE164NoPlus} is not registered on WhatsApp`);
    }
    await (client as any).sendMessage(numberId._serialized, message);
  };

  try {
    await retryAsync(attempt, 3, 1500);
  } catch (err) {
    console.error('getNumberId/sendMessage failed, considering raw fallback', err);
    if ((process.env.WHATSAPP_ALLOW_RAW_SEND || 'true').toLowerCase() !== 'true') {
      throw err;
    }
    const chatId = `${targetNumberE164NoPlus}@c.us`;
    await retryAsync(() => (client as any).sendMessage(chatId, message), 2, 1500);
  }
}

async function retryAsync<T>(fn: () => Promise<T>, times: number, delayMs: number): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < times - 1) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}


