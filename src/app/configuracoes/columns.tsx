"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TabelaRule } from "@/lib/tabelas-mock"

interface ColumnsProps {
    onEdit: (rule: TabelaRule) => void;
    onDelete: (ruleId: string) => void;
}

export const getColumns = ({ onEdit, onDelete }: ColumnsProps): ColumnDef<TabelaRule>[] => [
  {
    accessorKey: "min",
    header: "Qtd. Mínima",
  },
  {
    accessorKey: "max",
    header: "Qtd. Máxima",
    cell: ({ row }) => {
        const max = row.getValue("max") as number;
        return max === Infinity ? "ou mais" : max;
    }
  },
  {
    accessorKey: "sample",
    header: "Amostra",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rule = row.original

      return (
        <div className="text-right">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(rule)}>
                    Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={() => onDelete(rule.id)}>
                    Excluir
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )
    },
  },
]
