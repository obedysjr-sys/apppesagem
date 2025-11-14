"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"

import { RegistroPeso } from "@/types"
import { Button } from "@/components/ui/button"

export const columns: ColumnDef<RegistroPeso>[] = [
  {
    accessorKey: "dataRegistro",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Data <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{format(row.getValue("dataRegistro"), "dd/MM/yyyy")}</div>,
  },
  {
    accessorKey: "filial",
    header: "Filial",
  },
  {
    accessorKey: "modeloTabela",
    header: "Modelo",
  },
  {
    accessorKey: "quantidadeRecebida",
    header: "Qtd. Recebida",
  },
  {
    accessorKey: "pesoLiquidoAnalise",
    header: "Peso Analisado (KG)",
    cell: ({ row }) => <div>{row.original.pesoLiquidoAnalise.toFixed(3)}</div>
  },
  {
    accessorKey: "pesoLiquidoReal",
    header: "Peso Real (KG)",
    cell: ({ row }) => <div>{row.original.pesoLiquidoReal.toFixed(3)}</div>
  },
  {
    accessorKey: "perdaKg",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Perda (KG) <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-red-400">{row.original.perdaKg.toFixed(3)}</div>
  },
  {
    accessorKey: "perdaCx",
    header: "Perda (CX)",
    cell: ({ row }) => <div>{row.original.perdaCx.toFixed(2)}</div>
  },
  {
    accessorKey: "fornecedor",
    header: "Fornecedor",
  },
  {
    accessorKey: "notaFiscal",
    header: "NF",
  },
]
