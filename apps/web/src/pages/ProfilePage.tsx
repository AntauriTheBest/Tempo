import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '@todo-list-pro/shared';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';
import { usersService } from '../services/users.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { z } from 'zod';

type ProfileForm = z.infer<typeof updateProfileSchema>;
type PasswordForm = z.infer<typeof changePasswordSchema>;

export function ProfilePage() {
  const { user, logout } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleProfileSubmit = async (data: ProfileForm) => {
    try {
      const updated = await usersService.updateProfile({
        ...data,
        phone: data.phone?.trim() || null,
      });
      // Update the auth store so the new phone/name are reflected immediately
      if (user) {
        setUser({ ...user, ...updated });
      }
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar perfil');
    }
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    try {
      await usersService.changePassword(data);
      toast.success('Contraseña cambiada');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await usersService.deleteAccount();
      await logout();
      navigate('/login');
    } catch {
      toast.error('Error al eliminar cuenta');
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información personal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="521234567890 (con código de país, sin + ni espacios)"
                {...profileForm.register('phone')}
              />
              {profileForm.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {profileForm.formState.errors.phone.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Registra tu número para recibir y enviar tareas por WhatsApp.
              </p>
            </div>
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              Cambiar contraseña
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona peligrosa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Esta acción desactivará tu cuenta. No podrás iniciar sesión de nuevo.
          </p>
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            Eliminar cuenta
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar cuenta"
        description="¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
