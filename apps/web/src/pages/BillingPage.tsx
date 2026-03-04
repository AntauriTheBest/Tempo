import { useState, useEffect } from 'react';
import { billingService } from '../services/billing.service';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import type { BillingStatus } from '@todo-list-pro/shared';

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'Trial gratuito',
  PRO: 'PRO',
  ENTERPRISE: 'Enterprise',
};

const STATUS_LABELS: Record<string, string> = {
  TRIALING: 'En trial',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
};

export function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    billingService
      .getStatus()
      .then(setStatus)
      .catch(() => toast.error('Error al cargar el estado de facturación'))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async () => {
    setActionLoading(true);
    try {
      const { url } = await billingService.createCheckoutSession();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al iniciar el pago');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const { url } = await billingService.createPortalSession();
      if (url) window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al abrir el portal');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!status) return null;

  const isSuspended = status.status === 'SUSPENDED' || status.status === 'CANCELLED';
  const isTrialing = status.status === 'TRIALING';
  const isActive = status.status === 'ACTIVE';
  const trialProgress = Math.max(0, Math.min(100, ((14 - status.daysLeft) / 14) * 100));

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Facturación y plan</h1>

      {/* Suspended banner */}
      {isSuspended && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4">
          <p className="text-sm font-semibold text-destructive">
            Cuenta suspendida. Actualiza tu plan para continuar usando la aplicación.
          </p>
        </div>
      )}

      {/* Plan card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Plan actual</CardTitle>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              isActive ? 'bg-green-100 text-green-700' :
              isTrialing ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {STATUS_LABELS[status.status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-2xl font-bold">{PLAN_LABELS[status.plan]}</p>

          {/* Trial info */}
          {isTrialing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Días restantes de trial</span>
                <span className={`font-semibold ${status.daysLeft <= 3 ? 'text-destructive' : status.daysLeft <= 7 ? 'text-amber-600' : ''}`}>
                  {status.daysLeft} días
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    status.daysLeft <= 3 ? 'bg-destructive' :
                    status.daysLeft <= 7 ? 'bg-amber-500' : 'bg-primary'
                  }`}
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tu trial expira el {new Date(status.trialEndsAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Active subscription info */}
          {isActive && status.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Próxima renovación: {new Date(status.currentPeriodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {(isTrialing || isSuspended) && (
              <Button onClick={handleCheckout} disabled={actionLoading}>
                {actionLoading ? 'Procesando...' : 'Upgrade a PRO'}
              </Button>
            )}
            {isActive && (
              <Button variant="outline" onClick={handlePortal} disabled={actionLoading}>
                {actionLoading ? 'Procesando...' : 'Gestionar suscripción'}
              </Button>
            )}
            <a
              href="mailto:contacto@todolistpro.com"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Contactar para Enterprise
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qué incluye el plan PRO</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {[
              'Miembros ilimitados en tu organización',
              'Tareas, listas y proyectos ilimitados',
              'Seguimiento de tiempo y reportes',
              'Gestión de clientes y facturación',
              'Soporte prioritario',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
