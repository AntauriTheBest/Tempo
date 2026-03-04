import type { WAStatus } from './whatsapp-baileys.adapter';

let twilioClient: any = null;
let twilioFrom = '';

export async function initTwilio(accountSid: string, authToken: string, fromNumber: string) {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[WhatsApp/Twilio] Credenciales incompletas. Bot no disponible.');
    twilioClient = null;
    return;
  }

  try {
    const twilio = await import('twilio');
    const Twilio = (twilio as any).default ?? twilio;
    twilioClient = Twilio(accountSid, authToken);
    twilioFrom = `whatsapp:+${fromNumber}`;
    console.log('[WhatsApp/Twilio] Cliente inicializado. From:', twilioFrom);
  } catch (err) {
    console.error('[WhatsApp/Twilio] Error al inicializar:', err);
    twilioClient = null;
  }
}

export async function sendViaTwilio(toPhone: string, text: string) {
  if (!twilioClient) {
    console.warn('[WhatsApp/Twilio] sendViaTwilio llamado sin cliente inicializado. Ignorando.');
    return;
  }
  await twilioClient.messages.create({
    from: twilioFrom,
    to: `whatsapp:+${toPhone}`,
    body: text,
  });
}

export function getTwilioStatus(): WAStatus {
  return twilioClient ? 'connected' : 'disconnected';
}

export function disconnectTwilio() {
  twilioClient = null;
  twilioFrom = '';
  console.log('[WhatsApp/Twilio] Desconectado.');
}
