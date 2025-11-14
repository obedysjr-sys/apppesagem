import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { PageWrapper } from './page-wrapper';
import DashboardPage from '@/app/dashboard/page';
import CalculosPage from '@/app/calculos/page';
import RelatoriosPage from '@/app/relatorios/page';
import ConfiguracoesPage from '@/app/configuracoes/page';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar />
      <PageWrapper>
        <Header />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/calculos" element={<CalculosPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageWrapper>
    </div>
  );
}
