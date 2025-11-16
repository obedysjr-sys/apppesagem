"use client"

import { Table } from "@tanstack/react-table"
import { ListFilter, FileText, FileDown, Code, MessageSquare } from "lucide-react"

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
import { exportToPdf, exportToXlsx, exportToHtml, shareViaWhatsApp } from "@/lib/export"
import { RegistroPeso } from "@/types"
import { cn } from "@/lib/utils"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  className?: string
}

export function DataTableToolbar<TData>({
  table,
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

  return (
    <div className={cn("flex flex-col md:flex-row md:items-center md:justify-between gap-3", className)}>
      <div className="flex flex-1 items-center flex-wrap gap-2">
        <Input
          placeholder="Filtrar por código..."
          value={(table.getColumn("codigo")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("codigo")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[140px] lg:w-[160px]"
        />
        <Input
          placeholder="Filtrar por filial..."
          value={(table.getColumn("filial")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("filial")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[200px]"
        />
        <Input
          placeholder="Filtrar por produto..."
          value={(table.getColumn("produto")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("produto")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden md:block"
        />
        <Input
          placeholder="Filtrar por categoria..."
          value={(table.getColumn("categoria")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("categoria")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden md:block"
        />
        <Input
          placeholder="Filtrar por fornecedor..."
          value={(table.getColumn("fornecedor")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("fornecedor")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden md:block"
        />
        <Input
          placeholder="Filtrar por família..."
          value={(table.getColumn("familia")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("familia")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden lg:block"
        />
        <Input
          placeholder="Filtrar por grupo produto..."
          value={(table.getColumn("grupoProduto")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("grupoProduto")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full sm:w-[150px] lg:w-[200px] hidden lg:block"
        />
      </div>
      <div className="flex items-center space-x-2">
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
