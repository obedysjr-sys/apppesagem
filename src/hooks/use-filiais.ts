import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useFiliais() {
  const [filiais, setFiliais] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiliais() {
      try {
        const { data, error } = await supabase
          .from('filiais')
          .select('nome')
          .order('nome');
        
        if (error) {
             console.error('Erro ao buscar filiais (tabela filiais):', error);
             // Fallback: tentar buscar distinct da tabela registros_peso se filiais falhar
             return; 
        }
        
        if (data) {
          setFiliais(data.map((f: any) => f.nome));
        }
      } catch (error) {
        console.error('Erro ao buscar filiais:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFiliais();
  }, []);

  return { filiais, loading };
}
