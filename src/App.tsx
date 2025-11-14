import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from './hooks/use-auth';
import AppLayout from './components/layout/app-layout';
import LoginPage from './app/login/page';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="min-h-screen w-full bg-background">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/*" 
            element={
              isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
            } 
          />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
