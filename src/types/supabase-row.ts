export interface SupabaseRegistroPesoRow {
    id: string; // UUID
    data_registro: string;
    filial: string;
    fornecedor?: string | null;
    nota_fiscal?: string | null;
    modelo_tabela: string;
    quantidade_recebida?: number | null;
    peso_liquido_por_caixa?: number | null;
    quantidade_tabela?: number | null;
    quantidade_baixo_peso?: number | null;
    peso_bruto_analise?: number | null;
    tara_caixa?: number | null;
    peso_liquido_programado?: number | null;
    peso_liquido_analise?: number | null;
    peso_liquido_real?: number | null;
    perda_kg?: number | null;
    perda_cx?: number | null;
    perda_percentual?: number | null;
    peso_liquido_ideal_analise?: number | null;
    peso_liquido_real_analise?: number | null;
    media_baixo_peso_por_caixa?: number | null;
    percentual_qtd_caixas_com_baixo_peso?: number | null;
    media_qtd_caixas_com_baixo_peso?: number | null;
    media_baixo_peso_por_cx?: number | null;
    cod_produto?: string | null;
    produto?: string | null;
    descricao?: string | null;
    categoria?: string | null;
    familia?: string | null;
    grupo_produto?: string | null;
    codigo?: string | null;
}
