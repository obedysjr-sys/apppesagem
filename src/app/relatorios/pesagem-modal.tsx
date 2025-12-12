"use client"

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PesagemModal({ open, onOpenChange, recordId }: { open: boolean; onOpenChange: (o: boolean) => void; recordId: string | number }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [row, setRow] = React.useState<Record<string, unknown> | null>(null);
  const [page, setPage] = React.useState(0);
  const [limite, setLimite] = React.useState(0);

  const PAGE_SIZE = 10;

  React.useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!open || !recordId) return;
      try {
        setLoading(true);
        setError(null);
        const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
        if (!hasSupabaseEnv) {
          setError('Supabase não configurado.');
          return;
        }
        const { data, error } = await supabase
          .from('pesagem')
          .select('*')
          .eq('record_id', String(recordId))
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (mounted) setRow(data || null);

        // Buscar dados do registro principal para calcular o limite de baixo peso
        const { data: rp, error: rpErr } = await supabase
          .from('registros_peso')
          .select('peso_liquido_por_caixa, tara_caixa')
          .eq('id', String(recordId))
          .limit(1)
          .maybeSingle();
        if (!rpErr && rp) {
          const pesoLiq = Number((rp as any).peso_liquido_por_caixa ?? 0);
          const tara = Number((rp as any).tara_caixa ?? 0);
          const thr = (Number.isFinite(pesoLiq) ? pesoLiq : 0) + (Number.isFinite(tara) ? tara : 0);
          if (mounted) setLimite(thr);
        }
      } catch (e: unknown) {
        const msg = (e as { message?: string })?.message || 'Falha ao carregar pesagem.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [open, recordId]);

  const campos: number[] = React.useMemo(() => {
    const arr: number[] = [];
    for (let i = 1; i <= 50; i++) {
      const keyUnderscore = `campo_${i}`;
      const keySpace = `campo ${i}`;
      const r = row as Record<string, number | string | null | undefined> | null;
      const rawVal = r ? (r[keyUnderscore] ?? r[keySpace]) : undefined;
      const val = typeof rawVal === 'number' ? rawVal : Number(rawVal ?? NaN);
      if (!Number.isNaN(val)) arr.push(val);
    }
    return arr;
  }, [row]);

  const marcados: number[] = React.useMemo(() => {
    const r = row as Record<string, unknown> | null;
    const raw = r ? ((r['marcados'] as unknown) ?? (r['marcados_json'] as unknown) ?? null) : null;
    if (!raw) return [];
    if (Array.isArray(raw)) return (raw as unknown[]).map((n) => Number(n)).filter((n) => Number.isFinite(n));
    if (typeof raw === 'string') {
      let parsed: unknown = null;
      try { parsed = JSON.parse(raw as string); } catch { parsed = null; }
      if (Array.isArray(parsed)) return (parsed as unknown[]).map((n) => Number(n)).filter((n) => Number.isFinite(n));
    }
    return [];
  }, [row]);

  const pageCount = Math.max(1, Math.ceil(campos.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const slice = campos.slice(start, start + PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[92vw] sm:max-w-xl lg:max-w-2xl max-h-[80vh] sm:max-h-[85vh] overflow-y-auto p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Pesagem das Caixas</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Visualização dos valores digitados e destaques de baixo peso.</DialogDescription>
        </DialogHeader>
        {loading && (<div className="text-sm">Carregando...</div>)}
        {error && (<div className="text-sm text-red-500">{error}</div>)}
        {!loading && !error && row && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs sm:text-sm">Registo ID: {String(recordId)}</div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" disabled={page<=0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Anterior</Button>
                <div className="text-xs sm:text-sm">Página {page+1} de {pageCount}</div>
                <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs" disabled={page>=pageCount-1} onClick={()=>setPage(p=>Math.min(pageCount-1,p+1))}>Próxima</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {slice.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum campo preenchido.</div>
              ) : (
                slice.map((v, idx) => {
                  const globalIndex = start + idx + 1; // 1-based
                  const isMarcado = marcados.length > 0 ? marcados.includes(globalIndex) : (limite > 0 ? (v < limite) : false);
                  return (
                    <div key={idx} className={`px-2 py-1.5 border rounded-md ${isMarcado ? 'bg-red-50 dark:bg-red-900/20 border-red-300' : ''}`}>
                      <div className="text-[11px] text-muted-foreground">#{globalIndex}</div>
                      <div className={`text-xs font-medium ${isMarcado ? 'text-red-500' : ''}`}>{`${v} KG`}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Card>
                <CardHeader className="p-2 sm:p-3"><CardTitle className="text-xs sm:text-sm">Total digitado</CardTitle></CardHeader>
                <CardContent className="text-lg sm:text-xl font-bold">{(() => {
                  const r = row as Record<string, unknown>;
                  const v = r['total_digitado'] ?? r['total digitado'] ?? r['Total digitado'] ?? r['totalDigitado'] ?? 0;
                  return Number(v as number).toFixed(2);
                })()} KG</CardContent>
              </Card>
              <Card>
                <CardHeader className="p-2 sm:p-3"><CardTitle className="text-xs sm:text-sm">Total marcado "Baixo Peso"</CardTitle></CardHeader>
                <CardContent className="text-lg sm:text-xl font-bold text-red-500">{(() => {
                  const r = row as Record<string, unknown>;
                  const v = r['total_baixo_peso'] ?? r['total baixo peso'] ?? r['Total baixo peso'] ?? r['totalBaixoPeso'] ?? 0;
                  return Number(v as number).toFixed(2);
                })()} KG</CardContent>
              </Card>
              <Card>
                <CardHeader className="p-2 sm:p-3"><CardTitle className="text-xs sm:text-sm">Qtd. "Baixo Peso"</CardTitle></CardHeader>
                <CardContent className="text-lg sm:text-xl font-bold text-red-500">{(() => {
                  const r = row as Record<string, unknown>;
                  const v = r['qtd_baixo_peso'] ?? r['qtd baixo peso'] ?? r['Qtd baixo peso'] ?? r['qtdBaixoPeso'] ?? 0;
                  return Number(v as number);
                })()}</CardContent>
              </Card>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" size="sm" className="h-8 px-2 text-xs" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

