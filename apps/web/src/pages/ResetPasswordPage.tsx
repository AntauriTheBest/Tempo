import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { resetPasswordSchema } from '@todo-list-pro/shared';
import { authService } from '../services/auth.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const formSchema = resetPasswordSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof formSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { token },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
            <p className="text-center text-destructive">
              Enlace inválido. No se encontró el token de recuperación.
            </p>
            <Link
              to="/forgot-password"
              className="block text-center text-sm text-primary hover:underline"
            >
              Solicitar un nuevo enlace
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    setError('');
    try {
      const result = await authService.resetPassword(data.token, data.password);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      navigate(result.user.role === 'ADMIN' ? '/dashboard' : '/my-tasks');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al restablecer la contraseña.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tempo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Establece tu nueva contraseña
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
                {error.includes('expirado') || error.includes('utilizado') ? (
                  <Link
                    to="/forgot-password"
                    className="block mt-2 text-primary hover:underline"
                  >
                    Solicitar un nuevo enlace
                  </Link>
                ) : null}
              </div>
            )}

            <input type="hidden" {...register('token')} />

            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoFocus
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Restableciendo...' : 'Restablecer contraseña'}
            </Button>

            <Link
              to="/login"
              className="block text-center text-sm text-muted-foreground hover:text-primary"
            >
              Volver al inicio de sesión
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
