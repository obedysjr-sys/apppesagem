export interface TabelaRule {
    id: string;
    min: number;
    max: number;
    sample: number;
}

// Dados da Tabela S4 (apenas ela permanece ativa)
export const defaultS4Rules: TabelaRule[] = [
    { id: 's4-1', min: 2, max: 8, sample: 2 },
    { id: 's4-2', min: 9, max: 15, sample: 2 },
    { id: 's4-3', min: 16, max: 25, sample: 3 },
    { id: 's4-4', min: 26, max: 50, sample: 5 },
    { id: 's4-5', min: 51, max: 90, sample: 5 },
    { id: 's4-6', min: 91, max: 150, sample: 8 },
    { id: 's4-7', min: 151, max: 280, sample: 13 },
    { id: 's4-8', min: 281, max: 500, sample: 13 },
    { id: 's4-9', min: 501, max: 1200, sample: 20 },
    { id: 's4-10', min: 1201, max: 3200, sample: 32 },
    { id: 's4-11', min: 3201, max: 10000, sample: 32 },
    { id: 's4-12', min: 10001, max: 35000, sample: 50 },
    { id: 's4-13', min: 35001, max: 150000, sample: 80 },
    { id: 's4-14', min: 150001, max: 500000, sample: 50 },
    { id: 's4-15', min: 500001, max: Infinity, sample: 125 },
];

// Limpar dados de S1, S2 e S3: iniciar vazios para o usuário configurar depois
export const defaultS1Rules: TabelaRule[] = [];
export const defaultS2Rules: TabelaRule[] = [];
export const defaultS3Rules: TabelaRule[] = [];

export const mockTabelas = {
    S1: defaultS1Rules,
    S2: defaultS2Rules,
    S3: defaultS3Rules,
    S4: defaultS4Rules,
};
