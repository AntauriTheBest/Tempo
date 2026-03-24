import { prisma } from '../../config';
import * as tasksService from '../tasks/tasks.service';
import * as commentsService from '../comments/comments.service';
import {
  initBaileys,
  getBaileysStatus,
  getBaileysQr,
  disconnectBaileys,
  type WAStatus,
} from './whatsapp-baileys.adapter';
import {
  initTwilio,
  sendViaTwilio,
  getTwilioStatus,
  disconnectTwilio,
} from './whatsapp-twilio.adapter';

export type { WAStatus };

// ── Active provider ─────────────────────────────────────────────────────────
let activeProvider: 'baileys' | 'twilio' = 'baileys';

// ── In-memory task list per user for "completar N" / "comentarios N" ────────
const lastTaskMap = new Map<string, { id: string; title: string; priority: string; dueDate: string | null }[]>();

// ── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_EMOJI: Record<string, string> = {
  URGENT: '🚨', HIGH: '⚠️', MEDIUM: '📌', LOW: '🔵', NONE: '',
};

const HELP_TEXT = `*Comandos disponibles:*

📋 *tareas* — Ver mis tareas activas
🚨 *urgentes* — Ver tareas urgentes / alta prioridad
📅 *vencidas* — Ver tareas con fecha vencida
➕ *nueva [título]* — Crear una nueva tarea
✅ *completar [N]* — Completar la tarea número N
💬 *comentarios [N]* — Ver comentarios de la tarea N
📝 *comentar [N] [texto]* — Agregar comentario a la tarea N
❓ *ayuda* — Mostrar este menú`;

const HELP_ADMIN = `

*Comandos de administrador:*
👥 *equipo* — Ver usuarios y sus tareas activas
📋 *tareas @nombre* — Ver tareas de un usuario
🏢 *cliente [nombre]* — Ver tareas de un cliente`;

function formatTaskList(
  tasks: { id: string; title: string; priority: string; dueDate: string | null; ownerName?: string }[],
  header: string
): string {
  if (tasks.length === 0) return `✅ No hay tareas en esta categoría.`;
  const lines = tasks.map((t, i) => {
    const emoji = PRIORITY_EMOJI[t.priority] || '';
    const due = t.dueDate
      ? ` 📅 ${new Date(t.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`
      : '';
    const owner = t.ownerName ? ` — ${t.ownerName}` : '';
    return `${i + 1}. ${emoji ? emoji + ' ' : ''}${t.title}${due}${owner}`;
  });
  return `${header} (${tasks.length})\n\n${lines.join('\n')}\n\nResponde *completar [N]* para marcar como completada.`;
}

// ── Main message handler (shared by Baileys and Twilio) ──────────────────────
export async function handleMessage(
  fromPhone: string,
  text: string,
  sendReply: (msg: string) => Promise<void>
) {
  const normalized = text.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { phone: fromPhone },
    select: { id: true, name: true, role: true, organizationId: true },
  });

  if (!user) {
    await sendReply(
      '❌ Tu número no está registrado en la app.\n\nAgrega tu número de teléfono en tu *perfil* dentro de la aplicación y vuelve a intentarlo.'
    );
    return;
  }

  const isAdmin = user.role === 'ADMIN';

  // tareas / mis tareas
  if (normalized === 'tareas' || normalized === 'mis tareas') {
    const result = await tasksService.getAll(user.id, user.organizationId, {
      status: 'PENDING,IN_PROGRESS', sortBy: 'priority', sortDir: 'desc', limit: 10,
    });
    const tasks = result.data.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate ?? null }));
    lastTaskMap.set(fromPhone, tasks);
    await sendReply(formatTaskList(tasks, '📋 *Tus tareas activas*'));
    return;
  }

  // urgentes
  if (normalized === 'urgentes') {
    const result = await tasksService.getAll(user.id, user.organizationId, {
      priority: 'URGENT,HIGH', status: 'PENDING,IN_PROGRESS', sortBy: 'priority', sortDir: 'desc', limit: 10,
    });
    const tasks = result.data.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate ?? null }));
    lastTaskMap.set(fromPhone, tasks);
    await sendReply(formatTaskList(tasks, '🚨 *Tareas urgentes / alta prioridad*'));
    return;
  }

  // vencidas
  if (normalized === 'vencidas') {
    const today = new Date().toISOString().split('T')[0];
    const result = await tasksService.getAll(user.id, user.organizationId, {
      dueDateTo: today, status: 'PENDING,IN_PROGRESS', sortBy: 'dueDate', sortDir: 'asc', limit: 10,
    });
    const tasks = result.data.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate ?? null }));
    lastTaskMap.set(fromPhone, tasks);
    await sendReply(formatTaskList(tasks, '📅 *Tareas vencidas*'));
    return;
  }

  // nueva [título]
  const newMatch = normalized.match(/^nueva\s+(.+)$/);
  if (newMatch) {
    const title = text.trim().replace(/^nueva\s+/i, '');
    await tasksService.create(user.id, user.organizationId, { title });
    await sendReply(`✅ Tarea creada: *${title}*\n\nResponde *tareas* para ver tu lista actualizada.`);
    return;
  }

  // completar [N]
  const completeMatch = normalized.match(/^completar\s+(\d+)$/);
  if (completeMatch) {
    const n = parseInt(completeMatch[1], 10);
    const taskList = lastTaskMap.get(fromPhone);
    if (!taskList?.length) {
      await sendReply('❌ No tienes una lista reciente. Escribe *tareas* primero para ver tu lista.');
      return;
    }
    if (n < 1 || n > taskList.length) {
      await sendReply(`❌ Número inválido. Escribe un número entre 1 y ${taskList.length}.`);
      return;
    }
    const task = taskList[n - 1];
    await tasksService.updateStatus(user.id, user.organizationId, task.id, 'COMPLETED');
    await sendReply(`✅ Tarea *${n}* completada: _${task.title}_`);
    return;
  }

  // comentarios [N]
  const commentsMatch = normalized.match(/^comentarios\s+(\d+)$/);
  if (commentsMatch) {
    const n = parseInt(commentsMatch[1], 10);
    const taskList = lastTaskMap.get(fromPhone);
    if (!taskList?.length) {
      await sendReply('❌ No tienes una lista reciente. Escribe *tareas* primero.');
      return;
    }
    if (n < 1 || n > taskList.length) {
      await sendReply(`❌ Número inválido. Escribe un número entre 1 y ${taskList.length}.`);
      return;
    }
    const task = taskList[n - 1];
    const comments = await commentsService.getCommentsByTask(user.id, task.id, user.role);
    if (comments.length === 0) {
      await sendReply(`💬 *"${task.title}"* no tiene comentarios aún.\n\nUsa *comentar ${n} [texto]* para agregar uno.`);
      return;
    }
    const lines = comments.map((c: any, i: number) => {
      const fecha = new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      return `${i + 1}. [${fecha}] *${c.user.name}*: ${c.content}`;
    });
    await sendReply(`💬 *Comentarios: "${task.title}"* (${comments.length})\n\n${lines.join('\n')}`);
    return;
  }

  // comentar [N] [texto]
  const commentAddMatch = text.trim().match(/^comentar\s+(\d+)\s+(.+)$/i);
  if (commentAddMatch) {
    const n = parseInt(commentAddMatch[1], 10);
    const content = commentAddMatch[2].trim();
    const taskList = lastTaskMap.get(fromPhone);
    if (!taskList?.length) {
      await sendReply('❌ No tienes una lista reciente. Escribe *tareas* primero.');
      return;
    }
    if (n < 1 || n > taskList.length) {
      await sendReply(`❌ Número inválido. Escribe un número entre 1 y ${taskList.length}.`);
      return;
    }
    const task = taskList[n - 1];
    await commentsService.createComment(user.id, task.id, { content }, user.role);
    await sendReply(`✅ Comentario agregado a: _${task.title}_`);
    return;
  }

  // ADMIN: equipo
  if (isAdmin && normalized === 'equipo') {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: { select: { tasks: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] }, parentId: null } } } },
      },
      orderBy: { name: 'asc' },
    });
    if (!users.length) { await sendReply('👥 No hay usuarios activos en el equipo.'); return; }
    const lines = users.map((u: any, i: number) => `${i + 1}. ${u.name} — ${u._count.tasks} tarea(s) activa(s)`);
    await sendReply(`👥 *Tu equipo* (${users.length})\n\n${lines.join('\n')}\n\nUsa *tareas @nombre* para ver las tareas de alguien.`);
    return;
  }

  // ADMIN: tareas @nombre
  if (isAdmin) {
    const teamTaskMatch = text.trim().match(/^tareas @(.+)$/i);
    if (teamTaskMatch) {
      const nombre = teamTaskMatch[1].trim();
      const foundUser = await prisma.user.findFirst({
        where: { name: { contains: nombre, mode: 'insensitive' }, isActive: true },
        select: { id: true, name: true, organizationId: true },
      });
      if (!foundUser) { await sendReply(`❌ No se encontró ningún usuario con el nombre "${nombre}".`); return; }
      const result = await tasksService.getAll(foundUser.id, foundUser.organizationId, {
        status: 'PENDING,IN_PROGRESS', sortBy: 'priority', sortDir: 'desc', limit: 10,
      });
      const tasks = result.data.map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate ?? null }));
      lastTaskMap.set(fromPhone, tasks);
      await sendReply(formatTaskList(tasks, `📋 *Tareas de ${foundUser.name}*`));
      return;
    }
  }

  // ADMIN: cliente [nombre]
  if (isAdmin) {
    const clientMatch = text.trim().match(/^cliente (.+)$/i);
    if (clientMatch) {
      const nombre = clientMatch[1].trim();
      const client = await prisma.client.findFirst({
        where: { name: { contains: nombre, mode: 'insensitive' } },
        select: { id: true, name: true },
      });
      if (!client) { await sendReply(`❌ No se encontró ningún cliente con el nombre "${nombre}".`); return; }
      const lists = await prisma.taskList.findMany({ where: { clientId: client.id }, select: { id: true } });
      if (!lists.length) { await sendReply(`🏢 El cliente *${client.name}* no tiene listas asociadas.`); return; }
      const listIds = lists.map((l: any) => l.id);
      const rawTasks = await prisma.task.findMany({
        where: { listId: { in: listIds }, status: { in: ['PENDING', 'IN_PROGRESS'] }, parentId: null },
        include: { user: { select: { name: true } } },
        orderBy: { priority: 'desc' },
        take: 15,
      });
      const tasks = rawTasks.map((t: any) => ({
        id: t.id, title: t.title, priority: t.priority,
        dueDate: t.dueDate ? (t.dueDate as Date).toISOString() : null,
        ownerName: t.user.name,
      }));
      lastTaskMap.set(fromPhone, tasks);
      await sendReply(formatTaskList(tasks, `🏢 *Cliente: ${client.name}*`));
      return;
    }
  }

  // Default: ayuda
  const helpMsg = isAdmin
    ? `Hola, *${user.name}* 👋\n\n${HELP_TEXT}${HELP_ADMIN}`
    : `Hola, *${user.name}* 👋\n\n${HELP_TEXT}`;
  await sendReply(helpMsg);
}

// ── Settings helpers ─────────────────────────────────────────────────────────
async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? defaultValue;
}

async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

export async function getSettings() {
  const [provider, accountSid, fromNumber] = await Promise.all([
    getSetting('whatsapp.provider', 'baileys'),
    getSetting('twilio.accountSid', ''),
    getSetting('twilio.fromNumber', ''),
  ]);
  return {
    provider,
    twilioAccountSid: accountSid ? `${accountSid.slice(0, 6)}...${accountSid.slice(-4)}` : '',
    twilioFromNumber: fromNumber,
  };
}

export async function updateSettings(data: {
  provider?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
}) {
  if (data.provider !== undefined) await upsertSetting('whatsapp.provider', data.provider);
  if (data.twilioAccountSid !== undefined) await upsertSetting('twilio.accountSid', data.twilioAccountSid);
  if (data.twilioAuthToken !== undefined) await upsertSetting('twilio.authToken', data.twilioAuthToken);
  if (data.twilioFromNumber !== undefined) await upsertSetting('twilio.fromNumber', data.twilioFromNumber);

  const provider = data.provider ?? (await getSetting('whatsapp.provider', 'baileys'));
  await reinitialize(provider);
}

async function reinitialize(provider: string) {
  activeProvider = provider as 'baileys' | 'twilio';
  if (provider === 'twilio') {
    const [sid, token, from] = await Promise.all([
      getSetting('twilio.accountSid', ''),
      getSetting('twilio.authToken', ''),
      getSetting('twilio.fromNumber', ''),
    ]);
    await initTwilio(sid, token, from);
  } else {
    await initBaileys(handleMessage);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function initWhatsApp() {
  console.log('[WhatsApp] Iniciando servicio...');
  const provider = await getSetting('whatsapp.provider', 'baileys');
  activeProvider = provider as 'baileys' | 'twilio';
  console.log(`[WhatsApp] Proveedor: ${activeProvider}`);

  if (activeProvider === 'twilio') {
    const [sid, token, from] = await Promise.all([
      getSetting('twilio.accountSid', ''),
      getSetting('twilio.authToken', ''),
      getSetting('twilio.fromNumber', ''),
    ]);
    await initTwilio(sid, token, from);
  } else {
    await initBaileys(handleMessage);
  }
}

export function getStatus() {
  if (activeProvider === 'twilio') {
    return { status: getTwilioStatus(), connectedPhone: null, hasQr: false, provider: 'twilio' };
  }
  return { ...getBaileysStatus(), provider: 'baileys' };
}

export function getQr(): string | null {
  return activeProvider === 'baileys' ? getBaileysQr() : null;
}

export async function disconnect() {
  if (activeProvider === 'twilio') disconnectTwilio();
  else await disconnectBaileys();
}

// ── Twilio webhook handler ────────────────────────────────────────────────────
export async function handleTwilioWebhook(body: string, from: string) {
  const fromPhone = from.replace(/^whatsapp:\+?/, '');
  if (!body?.trim()) return;
  const sendReply = async (replyText: string) => { await sendViaTwilio(fromPhone, replyText); };
  await handleMessage(fromPhone, body.trim(), sendReply);
}
