"use client"

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PesagemHoverContent({ recordId }: { recordId: string }) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    async function fetchPesagem() {
      try {
        setLoading(true);
        const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
        if (!hasSupabaseEnv) {
          setError('Supabase não configurado.');
          return;
        }
        const { data: row, error } = await supabase
          .from('pesagem')
          .select('*')
          .eq('record_id', Number(recordId))
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (mounted) setData(row || null);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar pesagem.');
      } finally {
        setLoading(false);
      }
    }
    fetchPesagem();
    return () => { mounted = false; };
  }, [recordId]);

  if (loading) return <div className="text-sm">Carregando...</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!data) return <div className="text-sm text-muted-foreground">Sem pesagem registrada.</div>;

  const campos: number[] = [];
  for (let i = 1; i <= 50; i++) {
    const key = `campo_${i}`;
    const val = Number(data[key] ?? NaN);
    if (!Number.isNaN(val)) campos.push(val);
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pesagem das Caixas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {campos.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum campo preenchido.</div>
            ) : (
              campos.map((v, idx) => (
                <div key={idx} className="text-xs">
                  <span className="text-muted-foreground">#{idx + 1}:</span> {v}
                </div>
              ))
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
            <div>
              <div className="font-semibold">Total digitado</div>
              <div>{Number(data.total_digitado ?? 0).toFixed(2)} KG</div>
            </div>
            <div>
              <div className="font-semibold">Total marcado "Baixo Peso"</div>
              <div>{Number(data.total_baixo_peso ?? 0).toFixed(2)} KG</div>
            </div>
            <div>
              <div className="font-semibold">Qtd. "Baixo Peso"</div>
              <div>{Number(data.qtd_baixo_peso ?? 0)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
