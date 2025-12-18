"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown, Paperclip } from "lucide-react"
import { useState } from "react"

import { RegistroPeso } from "@/types"
import { Button } from "@/components/ui/button"

import { DataTableRowActions } from "./data-table-row-actions"
import { VisualizarEvidenciasModal } from "@/components/evidencias/visualizar-evidencias-modal"

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
    accessorKey: "categoria",
    header: "Categoria",
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
    cell: ({ row }) => <div>{row.original.pesoLiquidoAnalise.toFixed(2)}</div>
  },
  {
    accessorKey: "pesoLiquidoReal",
    header: "Peso Real (KG)",
    cell: ({ row }) => <div>{row.original.pesoLiquidoReal.toFixed(2)}</div>
  },
  {
    accessorKey: "pesoLiquidoIdealAnalise",
    header: "Peso Ideal Análise (KG)",
    cell: ({ row }) => <div>{(row.original.pesoLiquidoIdealAnalise ?? 0).toFixed(2)}</div>
  },
  {
    accessorKey: "pesoLiquidoRealAnalise",
    header: "Peso Real Análise (KG)",
    cell: ({ row }) => <div>{(row.original.pesoLiquidoRealAnalise ?? 0).toFixed(2)}</div>
  },
  {
    accessorKey: "mediaPesoBaixoPorCaixa",
    header: "Média Líq./CX (Análise)",
    cell: ({ row }) => <div>{(row.original.mediaPesoBaixoPorCaixa ?? 0).toFixed(2)}</div>
  },
  {
    accessorKey: "percentualqtdcaixascombaixopeso",
    header: "% Cxs Baixo Peso (Amostra)",
    cell: ({ row }) => <div>{(row.original.percentualqtdcaixascombaixopeso ?? 0).toFixed(2)}</div>
  },
  {
    accessorKey: "mediaqtdcaixascombaixopeso",
    header: "Média Cxs Baixo Peso (Carga)",
    cell: ({ row }) => <div>{(row.original.mediaqtdcaixascombaixopeso ?? 0).toFixed(2)}</div>
  },
  {
    accessorKey: "mediabaixopesoporcaixa",
    header: "Média Baixo Peso/CX",
    cell: ({ row }) => <div>{(row.original.mediabaixopesoporcaixa ?? 0).toFixed(2)}</div>
  },
  {
    accessorKey: "perdaKg",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Perda (KG) <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium text-red-400">{row.original.perdaKg.toFixed(2)}</div>
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
  // Campos opcionais adicionais (para filtros futuros)
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    accessorKey: "produto",
    header: "Produto",
  },
  {
    accessorKey: "familia",
    header: "Família",
  },
  {
    accessorKey: "grupoProduto",
    header: "Grupo Produto",
  },
  {
    id: "evidencias",
    header: "Anexos",
    cell: ({ row }) => {
      const EvidenciasCell = () => {
        const [modalOpen, setModalOpen] = useState(false);
        const [evidencias, setEvidencias] = useState<any[]>([]);
        const [loading, setLoading] = useState(false);
        
        const loadEvidencias = async () => {
          setLoading(true);
          try {
            const { supabase } = await import('@/lib/supabase');
            const { data, error } = await supabase
              .from('evidencias')
              .select('*')
              .eq('registro_id', row.original.id);
            
            if (error) throw error;
            setEvidencias(data || []);
            setModalOpen(true);
          } catch (error) {
            console.error('Erro ao carregar evidências:', error);
          } finally {
            setLoading(false);
          }
        };
        
        // Verificar se tem evidências (assumindo que existe uma propriedade)
        const hasEvidencias = (row.original as any).evidenciasCount > 0 || true; // Sempre mostrar por enquanto
        
        return (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadEvidencias}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <VisualizarEvidenciasModal
              evidencias={evidencias}
              open={modalOpen}
              onOpenChange={setModalOpen}
            />
          </>
        );
      };
      
      return <EvidenciasCell />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
