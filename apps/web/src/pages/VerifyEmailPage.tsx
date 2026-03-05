import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('Token inválido.');
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/my-tasks'), 2000);
      })
      .catch((err: any) => {
        setStatus('error');
        setErrorMsg(
          err.response?.data?.message || 'El enlace es inválido o ha expirado.'
        );
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Verificación de correo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-muted-foreground">Verificando tu correo...</p>
          )}
          {status === 'success' && (
            <p className="text-green-600 font-medium">
              ¡Correo verificado! Redirigiendo...
            </p>
          )}
          {status === 'error' && (
            <>
              <p className="text-destructive">{errorMsg}</p>
              <Button variant="outline" onClick={() => navigate('/register')}>
                Volver al registro
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
