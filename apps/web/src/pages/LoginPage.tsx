import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@todo-list-pro/shared';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import type { z } from 'zod';

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated, isLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to={isAdmin ? '/dashboard' : '/my-tasks'} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setError('');
    setEmailNotVerified(false);
    try {
      const result = await login(data);
      navigate(result.user.role === 'ADMIN' ? '/dashboard' : '/my-tasks');
    } catch (err: any) {
      if (err.response?.data?.message === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      } else {
        setError(
          err.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.'
        );
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Tempo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Inicia sesión en tu cuenta
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {emailNotVerified && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                Tu correo aún no está verificado. Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

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
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary"
              >
                ¿Has olvidado tu contraseña?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Crear cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
