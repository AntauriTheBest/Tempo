import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@todo-list-pro/shared';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerFormSchema>;

export function RegisterPage() {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
  });

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/my-tasks" replace />;
  }

  const onSubmit = async (data: RegisterForm) => {
    setError('');
    try {
      await registerUser({
        orgName: data.orgName,
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/my-tasks');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Todo-List Pro</CardTitle>
          <p className="text-sm text-muted-foreground">
            Crea tu cuenta y organización
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de organización</Label>
              <Input
                id="orgName"
                type="text"
                placeholder="Mi Empresa"
                {...register('orgName')}
              />
              {errors.orgName && (
                <p className="text-xs text-destructive">
                  {errors.orgName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Tu nombre</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan García"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

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
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
