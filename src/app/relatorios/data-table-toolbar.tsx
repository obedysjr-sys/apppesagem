"use client"

import { Table } from "@tanstack/react-table"
import { ListFilter, FileText, FileDown, Code, MessageSquare, Eraser } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToPdf, exportToXlsx, exportToHtml, shareViaWhatsApp } from "@/lib/export"
import { RegistroPeso } from "@/types"
import { cn } from "@/lib/utils"

interface UniqueValues {
  filiais: string[]
  fornecedores: string[]
  produtos: string[]
  categorias: string[]
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  uniqueValues?: UniqueValues
  globalFilter?: string
  setGlobalFilter?: (value: string) => void
  className?: string
}

export function DataTableToolbar<TData>({
  table,
  uniqueValues,
  globalFilter: externalGlobalFilter,
  setGlobalFilter: externalSetGlobalFilter,
  className,
}: DataTableToolbarProps<TData>) {

  const handleExport = (format: 'pdf' | 'xlsx' | 'html' | 'whatsapp') => {
    const data = table.getFilteredRowModel().rows.map(row => row.original as RegistroPeso);
    if (data.length === 0) {
        alert("Nenhum dado para exportar. Altere os filtros e tente novamente.");
        return;
    }
    switch (format) {
        case 'xlsx':
            exportToXlsx(data, "Relatorio_CheckPeso");
            break;
        case 'pdf':
            void exportToPdf(data, "Periodo_Selecionado");
            break;
        case 'html':
            void exportToHtml(data);
            break;
        case 'whatsapp':
            shareViaWhatsApp(data);
            break;
    }
  }

  const globalFilter = externalGlobalFilter ?? (table.getState().globalFilter as string ?? "");
  const handleGlobalFilterChange = (value: string) => {
    if (externalSetGlobalFilter) {
      externalSetGlobalFilter(value);
    } else {
      table.setGlobalFilter(value);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      {/* Campo de Busca Dinâmica */}
      <div className="w-full">
        <Input 
          placeholder="Pesquise qualquer dados, nota, produto, etc..." 
          value={globalFilter}
          onChange={(e) => handleGlobalFilterChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Filtros de Seleção */}
      <div className="flex flex-1 items-center flex-wrap gap-2">
        {uniqueValues && (
          <>
            <Select 
              value={(table.getColumn("filial")?.getFilterValue() as string) ?? "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  table.getColumn("filial")?.setFilterValue(undefined);
                } else {
                  table.getColumn("filial")?.setFilterValue(value);
                }
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-[150px] lg:w-[200px]">
                <SelectValue placeholder="Filial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Filiais</SelectItem>
                {uniqueValues.filiais.map(filial => (
                  <SelectItem key={filial} value={filial}>{filial}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={(table.getColumn("fornecedor")?.getFilterValue() as string) ?? "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  table.getColumn("fornecedor")?.setFilterValue(undefined);
                } else {
                  table.getColumn("fornecedor")?.setFilterValue(value);
                }
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden md:block">
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Fornecedores</SelectItem>
                {uniqueValues.fornecedores.map(fornecedor => (
                  <SelectItem key={fornecedor} value={fornecedor}>{fornecedor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={(table.getColumn("produto")?.getFilterValue() as string) ?? "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  table.getColumn("produto")?.setFilterValue(undefined);
                } else {
                  table.getColumn("produto")?.setFilterValue(value);
                }
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden md:block">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Produtos</SelectItem>
                {uniqueValues.produtos.map(produto => (
                  <SelectItem key={produto} value={produto}>{produto}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={(table.getColumn("categoria")?.getFilterValue() as string) ?? "all"} 
              onValueChange={(value) => {
                if (value === "all") {
                  table.getColumn("categoria")?.setFilterValue(undefined);
                } else {
                  table.getColumn("categoria")?.setFilterValue(value);
                }
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden md:block">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {uniqueValues.categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>{categoria}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => {
          table.resetColumnFilters();
          handleGlobalFilterChange('');
        }}>
            <Eraser /> <span className="hidden sm:inline">Limpar Filtros</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleExport('pdf')}>
            <FileText /> <span className="hidden sm:inline">PDF</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleExport('xlsx')}>
            <FileDown /> <span className="hidden sm:inline">XLSX</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleExport('html')}>
            <Code /> <span className="hidden sm:inline">HTML</span>
        </Button>
         <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleExport('whatsapp')}>
            <MessageSquare /> <span className="hidden sm:inline">WhatsApp</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <ListFilter className="mr-2 h-4 w-4" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" && column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id.replace(/([A-Z])/g, ' $1').trim()}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
