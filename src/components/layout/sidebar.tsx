import { NavLink } from 'react-router-dom';
import { Home, Calculator, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/calculos', icon: Calculator, label: 'Cálculos' },
  { to: '/relatorios', icon: FileText, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <div className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base mb-4">
            <img src="/logo.png" alt="CheckPeso GDM" className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">CheckPeso GDM</span>
        </div>
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                      isActive && 'bg-accent text-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
