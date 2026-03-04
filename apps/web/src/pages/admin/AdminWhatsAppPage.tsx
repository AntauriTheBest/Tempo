import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff, Loader2, LogOut, Save } from 'lucide-react';
import { whatsappService, type WAStatus, type WhatsAppSettings } from '../../services/whatsapp.service';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

const STATUS_LABELS: Record<WAStatus['status'], string> = {
  connected: 'Conectado',
  connecting: 'Conectando...',
  qr_ready: 'Esperando escaneo QR',
  disconnected: 'Desconectado',
};

const STATUS_COLORS: Record<WAStatus['status'], string> = {
  connected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  connecting: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  qr_ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  disconnected: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const COMMANDS = [
  { cmd: 'tareas', desc: 'Ver mis tareas activas (hasta 10)' },
  { cmd: 'urgentes', desc: 'Ver tareas urgentes y de alta prioridad' },
  { cmd: 'vencidas', desc: 'Ver tareas con fecha de vencimiento pasada' },
  { cmd: 'nueva [título]', desc: 'Crear una nueva tarea' },
  { cmd: 'completar [N]', desc: 'Marcar como completada la tarea #N de la última lista' },
  { cmd: 'comentarios [N]', desc: 'Ver comentarios de la tarea #N' },
  { cmd: 'comentar [N] [texto]', desc: 'Agregar comentario a la tarea #N' },
  { cmd: 'ayuda', desc: 'Ver todos los comandos disponibles' },
];

const ADMIN_COMMANDS = [
  { cmd: 'equipo', desc: 'Ver usuarios del equipo y sus tareas activas' },
  { cmd: 'tareas @nombre', desc: 'Ver tareas de un usuario por nombre' },
  { cmd: 'cliente [nombre]', desc: 'Ver tareas activas de un cliente' },
];

export function AdminWhatsAppPage() {
  const [activeTab, setActiveTab] = useState<'baileys' | 'twilio'>('baileys');
  const [waStatus, setWaStatus] = useState<WAStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  // Twilio settings form
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  const fetchStatus = useCallback(async () => {
    try {
      const status = await whatsappService.getStatus();
      setWaStatus(status);
      // Sync active tab with provider stored in DB
      if (status.provider) setActiveTab(status.provider);

      if (status.status === 'qr_ready' && status.hasQr) {
        const qrData = await whatsappService.getQr();
        setQr(qrData);
      } else {
        setQr(null);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const s = await whatsappService.getSettings();
      setSettings(s);
      setTwilioSid(s.twilioAccountSid);
      setTwilioFrom(s.twilioFromNumber);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchSettings();
  }, [fetchStatus, fetchSettings]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (waStatus?.status === 'qr_ready' || waStatus?.status === 'connecting') {
        fetchStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus, waStatus?.status]);

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar el bot de WhatsApp? Se eliminará la sesión guardada.')) return;
    setDisconnecting(true);
    try {
      await whatsappService.disconnect();
      toast.success('Bot desconectado');
      fetchStatus();
    } catch {
      toast.error('Error al desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSaveTwilio = async () => {
    setSavingSettings(true);
    try {
      await whatsappService.updateSettings({
        provider: 'twilio',
        twilioAccountSid: twilioSid,
        twilioAuthToken: twilioToken || undefined,
        twilioFromNumber: twilioFrom,
      });
      toast.success('Configuración Twilio guardada y activada');
      setTwilioToken('');
      fetchStatus();
      fetchSettings();
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleActivateBaileys = async () => {
    try {
      await whatsappService.updateSettings({ provider: 'baileys' });
      toast.success('Proveedor cambiado a Baileys');
      fetchStatus();
    } catch {
      toast.error('Error al cambiar proveedor');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentProvider = waStatus?.provider ?? settings?.provider ?? 'baileys';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">WhatsApp Bot</h2>
        <Button variant="outline" size="sm" onClick={() => { fetchStatus(); fetchSettings(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Provider tabs */}
      <div className="flex gap-2 border-b">
        {(['baileys', 'twilio'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'baileys' ? 'Baileys (directo)' : 'Twilio (API)'}
            {currentProvider === tab && (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-green-500" title="Proveedor activo" />
            )}
          </button>
        ))}
      </div>

      {/* ── Baileys panel ── */}
      {activeTab === 'baileys' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {waStatus?.status === 'connected' ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-muted-foreground" />
                )}
                Estado de conexión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={cn('text-sm', waStatus ? STATUS_COLORS[waStatus.status] : '')}
                >
                  {waStatus ? STATUS_LABELS[waStatus.status] : 'Cargando...'}
                </Badge>
                {waStatus?.connectedPhone && (
                  <span className="text-sm text-muted-foreground">
                    Número: {waStatus.connectedPhone}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {waStatus?.status === 'connected' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Desconectar bot
                  </Button>
                )}
                {currentProvider !== 'baileys' && (
                  <Button variant="outline" size="sm" onClick={handleActivateBaileys}>
                    Activar Baileys
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {waStatus?.status === 'qr_ready' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Escanea el código QR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo → escanea el código.
                </p>
                {qr ? (
                  <div className="flex justify-center">
                    <img
                      src={qr}
                      alt="WhatsApp QR Code"
                      className="rounded-lg border p-2 max-w-[260px]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando QR...
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  El QR se actualiza automáticamente cada 10 segundos.
                </p>
              </CardContent>
            </Card>
          )}

          {waStatus?.status === 'disconnected' && (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                El bot está desconectado. Reinicia el servidor de la API para iniciar una nueva sesión.
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ── Twilio panel ── */}
      {activeTab === 'twilio' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración de Twilio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Requiere una cuenta de Twilio con el complemento WhatsApp habilitado y una URL pública accesible.
            </p>

            <div className="space-y-2">
              <Label htmlFor="twilioSid">Account SID</Label>
              <Input
                id="twilioSid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
              />
              {settings?.twilioAccountSid && (
                <p className="text-xs text-muted-foreground">Guardado: {settings.twilioAccountSid}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twilioToken">Auth Token</Label>
              <Input
                id="twilioToken"
                type="password"
                placeholder="Dejar vacío para conservar el token actual"
                value={twilioToken}
                onChange={(e) => setTwilioToken(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twilioFrom">From Number (sin + ni espacios)</Label>
              <Input
                id="twilioFrom"
                placeholder="14155238886"
                value={twilioFrom}
                onChange={(e) => setTwilioFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex items-center gap-2">
                <Input value={webhookUrl} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('URL copiada'); }}
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Configura esta URL en tu Twilio Sandbox o número de WhatsApp como webhook de mensajes entrantes.
              </p>
            </div>

            <Button onClick={handleSaveTwilio} disabled={savingSettings}>
              {savingSettings ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar y activar Twilio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Commands reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comandos disponibles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Los usuarios deben registrar su número de teléfono en su perfil para usar el bot.
          </p>
          <div className="space-y-2">
            {COMMANDS.map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-start gap-3 text-sm">
                <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono min-w-fit">
                  {cmd}
                </code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-medium mt-4">Solo administradores:</p>
          <div className="space-y-2">
            {ADMIN_COMMANDS.map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-start gap-3 text-sm">
                <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono min-w-fit">
                  {cmd}
                </code>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
