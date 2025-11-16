import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Home, Calculator, FileText, Settings, PanelLeft, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/calculos', icon: Calculator, label: 'Cálculos' },
    { to: '/relatorios', icon: FileText, label: 'Relatórios' },
    { to: '/configuracoes', icon: Settings, label: 'Configurações' },
  ];

export function Header() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        {/* Padronizar largura do menu mobile para todas as telas */}
        <SheetContent side="left" className="w-[280px] sm:w-[280px]">
          <SheetHeader className="text-left mb-6">
            <SheetTitle>
              <div className="flex items-center gap-3">
    <div className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-background text-lg font-semibold text-foreground md:h-8 md:w-8 md:text-base">
      <img src="/logo.png" alt="CheckPeso GDM" className="h-5 w-5 transition-all group-hover:scale-110" />
                </div>
                <span>CHECKPESO</span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <nav className="grid gap-4 text-base font-medium">
            {navItems.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                        `flex items-center gap-4 px-2.5 ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`
                    }
                    onClick={() => setOpen(false)}
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" size="icon" onClick={logout}>
            <LogOut className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Sair</span>
        </Button>
      </div>
    </header>
  );
}
