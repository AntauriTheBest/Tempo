import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@todo-list-pro/shared';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import type { z } from 'zod';

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError('');
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al enviar la solicitud. Intenta de nuevo.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tempo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recuperar contraseña
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-4 text-sm text-green-700 dark:text-green-400">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
              </div>
              <Link
                to="/login"
                className="block text-center text-sm text-primary hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoFocus
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </Button>

              <Link
                to="/login"
                className="block text-center text-sm text-muted-foreground hover:text-primary"
              >
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
