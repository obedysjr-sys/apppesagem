import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, startOfDay, subDays } from 'date-fns';
import {
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState
} from '@tanstack/react-table';

import { PageContent } from "@/components/layout/page-content";
import { Button } from "@/components/ui/button";
import { RegistroPeso } from "@/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTablePagination } from './data-table-pagination';

// Carregamento de dados reais do Supabase
function parseSQLDate(dateStr: any): Date {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    if (typeof dateStr === 'string') {
        const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) {
            const [_, y, mo, d] = m;
            return new Date(Number(y), Number(mo) - 1, Number(d));
        }
        return new Date(dateStr);
    }
    return new Date();
}

function mapRowToRegistroPeso(row: any): RegistroPeso {
    return {
        id: row.id,
        dataRegistro: parseSQLDate(row.data_registro),
        filial: row.filial,
        fornecedor: row.fornecedor ?? undefined,
        notaFiscal: row.nota_fiscal ?? undefined,
        modeloTabela: row.modelo_tabela,
        quantidadeRecebida: Number(row.quantidade_recebida ?? 0),
        pesoLiquidoPorCaixa: Number(row.peso_liquido_por_caixa ?? 0),
        quantidadeTabela: Number(row.quantidade_tabela ?? 0),
        quantidadebaixopeso: Number(row.quantidade_baixo_peso ?? 0),
        pesoBrutoAnalise: Number(row.peso_bruto_analise ?? 0),
        taraCaixa: Number(row.tara_caixa ?? 0),
        pesoLiquidoProgramado: Number(row.peso_liquido_programado ?? 0),
        pesoLiquidoAnalise: Number(row.peso_liquido_analise ?? 0),
        pesoLiquidoReal: Number(row.peso_liquido_real ?? 0),
        perdaKg: Number(row.perda_kg ?? 0),
        perdaCx: Number(row.perda_cx ?? 0),
        perdaPercentual: Number(row.perda_percentual ?? 0),
        pesoLiquidoIdealAnalise: Number(row.peso_liquido_ideal_analise ?? 0),
        pesoLiquidoRealAnalise: Number(row.peso_liquido_real_analise ?? 0),
        mediaPesoBaixoPorCaixa: Number(row.media_baixo_peso_por_caixa ?? 0),
        percentualqtdcaixascombaixopeso: Number(row.percentual_qtd_caixas_com_baixo_peso ?? 0),
        mediaqtdcaixascombaixopeso: Number(row.media_qtd_caixas_com_baixo_peso ?? 0),
        mediabaixopesoporcaixa: Number(row.media_baixo_peso_por_cx ?? 0),
        // Campos opcionais de produto
        codigo: row.cod_produto ?? undefined,
        produto: row.produto ?? row.descricao ?? undefined,
        categoria: row.categoria ?? undefined,
        familia: row.familia ?? undefined,
        grupoProduto: row.grupo_produto ?? undefined,
    };
}

const initialData: RegistroPeso[] = [];

export default function RelatoriosPage() {
    const [allData, setAllData] = useState<RegistroPeso[]>(initialData);
    // Mostrar todos os registros por padrão; filtro de datas é opcional
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const STORAGE_KEY = 'relatoriosColumnVisibility';
    const defaultVisibility: VisibilityState = {
        modeloTabela: false,
        notaFiscal: false,
        codigo: false,
        produto: false,
        familia: false,
        grupoProduto: false,
        pesoLiquidoIdealAnalise: false,
        pesoLiquidoRealAnalise: false,
        mediaPesoBaixoPorCaixa: false,
        percentualqtdcaixascombaixopeso: false,
        mediaqtdcaixascombaixopeso: false,
        mediabaixopesoporcaixa: false,
    };

    useEffect(() => {
        let mounted = true;
        const fetchAll = async () => {
            try {
                const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
                if (!hasSupabaseEnv) return;
                const { data, error } = await supabase
                    .from('registros_peso')
                    .select('*')
                    .order('data_registro', { ascending: false });
                if (error) {
                    console.warn('Erro ao carregar registros_peso:', error);
                    return;
                }
                if (mounted && Array.isArray(data)) {
                    setAllData(data.map(mapRowToRegistroPeso));
                }
            } catch (err) {
                console.warn('Falha ao buscar dados do Supabase:', err);
            }
        };
        (async () => { await fetchAll(); })();
        const interval = setInterval(fetchAll, 15000);
        return () => { mounted = false; clearInterval(interval); };
    }, []);

    // Realtime: mantém a tabela atualizada sem precisar mexer nos filtros
    useEffect(() => {
        let channel: ReturnType<any> | null = null;
        (async () => {
            try {
                const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
                if (!hasSupabaseEnv) return;
                channel = supabase
                    .channel('registros_peso_changes_reports')
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'registros_peso' },
                        (payload: any) => {
                            try {
                                const evt = payload?.eventType || payload?.event || '';
                                if (evt === 'INSERT' && payload?.new) {
                                    const row = mapRowToRegistroPeso(payload.new);
                                    setAllData(prev => [row, ...prev]);
                                } else if (evt === 'UPDATE' && payload?.new) {
                                    const updated = mapRowToRegistroPeso(payload.new);
                                    setAllData(prev => prev.map(r => (r.id === updated.id ? updated : r)));
                                } else if (evt === 'DELETE' && payload?.old) {
                                    const id = payload.old.id;
                                    setAllData(prev => prev.filter(r => r.id !== id));
                                }
                            } catch (e) {
                                console.warn('Falha ao aplicar payload realtime (reports):', e);
                            }
                        }
                    )
                    .subscribe();
            } catch (err) {
                console.warn('Erro ao inicializar Realtime (reports):', err);
            }
        })();
        return () => {
            (async () => {
                try {
                    const { supabase, hasSupabaseEnv } = await import('@/lib/supabase');
                    if (!hasSupabaseEnv) return;
                    if (channel) supabase.removeChannel(channel as any);
                } catch {}
            })();
        };
    }, []);

    const filteredDataByDate = useMemo(() => {
        if (!dateRange?.from) return allData;
        const startDate = startOfDay(dateRange.from);
        const endDate = dateRange.to ? startOfDay(addDays(dateRange.to, 1)) : startOfDay(addDays(startDate, 1));
        return allData.filter(item => {
            const itemDate = startOfDay(item.dataRegistro);
            return itemDate >= startDate && itemDate < endDate;
        });
    }, [dateRange, allData]);

    const [sorting, setSorting] = useState<SortingState>([
        { id: 'dataRegistro', desc: true },
    ])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch {}
        return defaultVisibility;
    })
    const [rowSelection, setRowSelection] = useState({})

    const table = useReactTable({
        data: filteredDataByDate,
        columns,
        state: {
          sorting,
          columnVisibility,
          rowSelection,
          columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: (updater) => {
            setColumnVisibility((prev) => {
                const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
                return next;
            });
        },
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
      })

    const clearAll = () => {
        try { table.resetColumnFilters(); } catch {}
        const now = new Date();
        setDateRange({ from: subDays(now, 29), to: now });
    };

return (
    <PageContent 
        title="Relatórios" 
        subtitle="Filtre, analise e exporte relatórios detalhados."
    >
        <div className="space-y-4 w-full max-w-full overflow-hidden">

            {/* Header */}
            <div className="
                flex flex-col gap-3 w-full max-w-full
                sm:flex-row sm:flex-wrap sm:items-center sm:justify-between
            ">
                <DataTableToolbar 
                    table={table}
                    className="w-full sm:w-auto max-w-full"
                />

                <DateRangePicker 
                    date={dateRange} 
                    onDateChange={setDateRange}
                    className="w-full sm:w-auto max-w-full"
                />
                <div className="w-full sm:w-auto">
                    <Button variant="outline" onClick={clearAll}>Limpar Filtros</Button>
                </div>
            </div>

            {/* Tabela */}
            <div className="w-full max-w-full overflow-x-auto">
                <DataTable 
                    table={table}
                />
            </div>

            <DataTablePagination table={table} />
        </div>
    </PageContent>
);

}
