import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setPasswordSchema } from '@todo-list-pro/shared';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import type { z } from 'zod';

type SetPasswordForm = z.infer<typeof setPasswordSchema>;

export function SetPasswordPage() {
  const { setPassword, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetPasswordForm>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { token },
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/inbox" replace />;
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Token de invitación no proporcionado. Verifica el enlace recibido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: SetPasswordForm) => {
    setError('');
    try {
      await setPassword(data);
      navigate('/my-tasks');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al establecer la contraseña. Verifica que el enlace sea válido.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tempo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Establece tu contraseña para activar tu cuenta
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <input type="hidden" {...register('token')} />

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, al menos una mayúscula y un número
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Estableciendo contraseña...' : 'Establecer contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
