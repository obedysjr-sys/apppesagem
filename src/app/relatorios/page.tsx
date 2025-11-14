import * as React from 'react';
import { useMemo, useState } from 'react';
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

// Sem dados simulados: dados iniciam vazios
const allData: RegistroPeso[] = [];

export default function RelatoriosPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

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
                <div className="flex items-center justify-between">
                    <DataTableToolbar table={table} />
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
                <DataTable table={table} />
                <DataTablePagination table={table} />
            </div>
        </PageContent>
    );
}
