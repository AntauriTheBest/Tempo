import path from 'path';
import { toDataURL } from 'qrcode';

export type WAStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

interface BaileysState {
  status: WAStatus;
  qrDataUrl: string | null;
  connectedPhone: string | null;
}

const state: BaileysState = {
  status: 'disconnected',
  qrDataUrl: null,
  connectedPhone: null,
};

let sock: any = null;

export const SESSION_DIR = path.resolve(__dirname, '../../../../whatsapp-session');

type OnMessageFn = (fromPhone: string, text: string, sendReply: (msg: string) => Promise<void>) => Promise<void>;

export async function initBaileys(onMessage: OnMessageFn) {
  console.log('[WhatsApp/Baileys] Iniciando cliente...');
  state.status = 'connecting';

  try {
    const {
      default: makeWASocket,
      useMultiFileAuthState,
      DisconnectReason,
      fetchLatestBaileysVersion,
      jidNormalizedUser,
    } = await import('@whiskeysockets/baileys') as any;

    const { state: authState, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const noop = () => {};
    const makeLogger = (): any => ({
      level: 'silent',
      trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop,
      child: () => makeLogger(),
    });

    sock = makeWASocket({
      version,
      auth: authState,
      printQRInTerminal: false,
      logger: makeLogger(),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        state.status = 'qr_ready';
        state.qrDataUrl = await toDataURL(qr);
        console.log('[WhatsApp/Baileys] QR generado. Escanea desde el panel de admin.');
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;

        state.status = 'disconnected';
        state.qrDataUrl = null;
        state.connectedPhone = null;
        console.log('[WhatsApp/Baileys] Conexión cerrada.', shouldReconnect ? 'Reconectando...' : 'Sesión cerrada.');

        if (shouldReconnect) {
          setTimeout(() => initBaileys(onMessage), 5000);
        }
      }

      if (connection === 'open') {
        state.status = 'connected';
        state.qrDataUrl = null;
        state.connectedPhone = sock?.user?.id ?? null;
        console.log('[WhatsApp/Baileys] Conectado como:', state.connectedPhone);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }: any) => {
      console.log(`[WhatsApp/Baileys] messages.upsert tipo="${type}" cantidad=${messages?.length}`);
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const rawJid: string = msg.key.remoteJid ?? '';
        const jid: string = jidNormalizedUser(rawJid);
        if (!jid.endsWith('@s.whatsapp.net')) continue;

        const fromPhone = jid.split('@')[0];
        console.log(`[WhatsApp/Baileys] Mensaje de: ${fromPhone} (raw JID: ${rawJid})`);
        console.log(`[WhatsApp/Baileys] Tipos de mensaje:`, Object.keys(msg.message));

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          msg.message.buttonsResponseMessage?.selectedDisplayText ||
          msg.message.listResponseMessage?.title ||
          '';

        console.log(`[WhatsApp/Baileys] Texto extraído: "${text}"`);
        if (!text.trim()) continue;

        const sendReply = async (replyText: string) => {
          await sock.sendMessage(jid, { text: replyText });
        };

        onMessage(fromPhone, text, sendReply).catch((err) => {
          console.error('[WhatsApp/Baileys] Error procesando mensaje:', err);
          sendReply('❌ Ocurrió un error. Por favor intenta de nuevo.').catch(() => {});
        });
      }
    });
  } catch (err) {
    console.error('[WhatsApp/Baileys] Error al inicializar:', err);
    state.status = 'disconnected';
    setTimeout(() => initBaileys(onMessage), 10000);
  }
}

export function getBaileysStatus(): { status: WAStatus; connectedPhone: string | null; hasQr: boolean } {
  return {
    status: state.status,
    connectedPhone: state.connectedPhone,
    hasQr: state.qrDataUrl !== null,
  };
}

export function getBaileysQr(): string | null {
  return state.qrDataUrl;
}

export async function disconnectBaileys() {
  if (sock) {
    await sock.logout().catch(() => {});
    sock = null;
  }
  state.status = 'disconnected';
  state.qrDataUrl = null;
  state.connectedPhone = null;

  const fs = await import('fs');
  if (fs.existsSync(SESSION_DIR)) {
    for (const file of fs.readdirSync(SESSION_DIR)) {
      fs.unlinkSync(path.join(SESSION_DIR, file));
    }
  }
}
