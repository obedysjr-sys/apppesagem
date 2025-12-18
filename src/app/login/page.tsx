import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SENHA_CORRETA = 'calculadora123@';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SENHA_CORRETA) {
      toast.success('Login bem-sucedido!');
      login();
      navigate('/calculos'); // Redireciona para a tela de cálculos
    } else {
      toast.error('Senha incorreta', {
        description: 'Por favor, verifique a senha e tente novamente.',
      });
    }
  };
  
  const handleForgotPassword = () => {
    toast.info('Recuperação de Senha', {
        description: 'Entre em contato com o administrador do sistema para redefinir sua senha.',
    });
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[url('https://i.ibb.co/spyshB36/background.png')] bg-cover bg-center bg-no-repeat">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <img src="/logo.png" alt="CheckPeso GDM" className="w-16 h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">Bem-vindo de volta!</CardTitle>
            <CardDescription>Digite sua senha para acessar o painel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit">Entrar</Button>
            <Button variant="link" size="sm" type="button" onClick={handleForgotPassword}>
              Esqueceu a senha?
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
