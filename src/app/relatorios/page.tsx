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
import { RegistroPeso } from "@/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTablePagination } from './data-table-pagination';

// Carregamento de dados reais do Supabase
function mapRowToRegistroPeso(row: any): RegistroPeso {
    return {
        id: row.id,
        dataRegistro: new Date(row.data_registro),
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
    };
}

const initialData: RegistroPeso[] = [];

export default function RelatoriosPage() {
    const [allData, setAllData] = useState<RegistroPeso[]>(initialData);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
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
        })();
        return () => { mounted = false; };
    }, []);

    const filteredDataByDate = useMemo(() => {
        if (!dateRange?.from) return allData;
        
        const startDate = startOfDay(dateRange.from);
        const endDate = dateRange.to ? startOfDay(addDays(dateRange.to, 1)) : startOfDay(addDays(startDate, 1));
        
        return allData.filter(item => {
            const itemDate = startOfDay(item.dataRegistro);
            return itemDate >= startDate && itemDate < endDate;
        });
    }, [dateRange]);

    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
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
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
      })

    return (
        <PageContent title="Relatórios" subtitle="Filtre, analise e exporte relatórios detalhados.">
                <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <DataTableToolbar table={table} />
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
                <DataTable table={table} />
                <DataTablePagination table={table} />
                </div>
        </PageContent>
    );
}
