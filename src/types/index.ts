import { z } from 'zod';

export const calculosFormSchema = z.object({
  filial: z.string().min(1, 'Filial é obrigatória.'),
  dataRegistro: z.date(),
  quantidadeRecebida: z.coerce.number().min(1, 'Quantidade deve ser maior que 0.'),
  pesoLiquidoPorCaixa: z.coerce.number().min(0.001, 'Peso deve ser maior que 0.'),
  modeloTabela: z.string(),
  pesoBrutoAnalise: z.coerce.number().min(0.001, 'Peso deve ser maior que 0.'),
  taraCaixa: z.coerce.number().min(0, 'Tara não pode ser negativa.'),
  quantidadebaixopeso: z.coerce.number().min(0, 'Qtd. Baixo Peso não pode ser negativa.'),
  fornecedor: z.string().optional(),
  notaFiscal: z.string().optional(),
  // Novos campos opcionais vinculados ao produto
  codigo: z.string().optional(),
  produto: z.string().optional(),
  categoria: z.string().optional(),
  familia: z.string().optional(),
  grupoProduto: z.string().optional(),
  observacoes: z.string().optional(),
});

export type CalculosFormValues = z.infer<typeof calculosFormSchema>;

export interface CalculosResultados {
    pesoLiquidoProgramado: number;
    pesoLiquidoAnalise: number;
    pesoLiquidoReal: number;
    perdaKg: number;
    perdaCx: number;
    perdaPercentual: number;
    quantidadeTabela: number;
    pesoLiquidoIdealAnalise: number;
    pesoLiquidoRealAnalise: number;
    mediaPesoBaixoPorCaixa: number;
    mediaqtdcaixascombaixopeso: number;
    percentualqtdcaixascombaixopeso: number;
    mediabaixopesoporcaixa: number;
}

// Tipo de Registro de Peso (desacoplado de dados simulados)
export interface RegistroPeso {
    id: string;
    dataRegistro: Date;
    filial: string;
    fornecedor?: string;
    notaFiscal?: string;
    modeloTabela: string; // sempre 'S4' atualmente
    quantidadeRecebida: number;
    pesoLiquidoPorCaixa: number;
    quantidadeTabela: number;
    quantidadebaixopeso: number;
    pesoBrutoAnalise: number;
    taraCaixa: number;
    // Resultados calculados
    pesoLiquidoProgramado: number;
    pesoLiquidoAnalise: number;
    pesoLiquidoReal: number;
    perdaKg: number;
    perdaCx: number;
    perdaPercentual: number;
    pesoLiquidoIdealAnalise?: number;
    pesoLiquidoRealAnalise?: number;
    mediaPesoBaixoPorCaixa?: number;
    mediaqtdcaixascombaixopeso?: number;
    percentualqtdcaixascombaixopeso?: number;
    mediabaixopesoporcaixa?: number;
    // Metadados do produto (opcionais)
    codigo?: string;
    produto?: string;
    categoria?: string;
    familia?: string;
    grupoProduto?: string;
}
