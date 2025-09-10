export async function sendWhatsAppCloudMessage(targetNumberE164NoPlus: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error('Missing WHATSAPP_CLOUD_ACCESS_TOKEN or WHATSAPP_CLOUD_PHONE_NUMBER_ID');
  }

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  const sendMode = (process.env.WHATSAPP_CLOUD_SEND_MODE || 'text').toLowerCase();
  let body: any;

  if (sendMode === 'template') {
    const templateName = process.env.WHATSAPP_CLOUD_TEMPLATE_NAME || 'hello_world';
    const templateLang = process.env.WHATSAPP_CLOUD_TEMPLATE_LANG || 'en_US';
    body = {
      messaging_product: 'whatsapp',
      to: targetNumberE164NoPlus,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLang }
      }
    };
  } else {
    body = {
      messaging_product: 'whatsapp',
      to: targetNumberE164NoPlus,
      type: 'text',
      text: { body: message }
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloud API send failed: ${res.status} ${text}`);
  }
  try {
    const json = await res.json();
    console.log('[cloud] response', json);
  } catch {
    // ignore parse errors
  }
}

export async function sendWhatsAppCloudTemplate(targetNumberE164NoPlus: string, name: string, lang: string = 'en_US'): Promise<void> {
  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error('Missing WHATSAPP_CLOUD_ACCESS_TOKEN or WHATSAPP_CLOUD_PHONE_NUMBER_ID');
  }

  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: targetNumberE164NoPlus,
    type: 'template',
    template: {
      name,
      language: { code: lang },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloud API template failed: ${res.status} ${text}`);
  }
}


