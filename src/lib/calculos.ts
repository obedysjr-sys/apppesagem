import { CalculosFormValues, CalculosResultados } from "@/types";
import { getQuantidadeDaTabela } from "./tabelaS4";

// Normaliza números vindos do formulário, aceitando formatos pt-BR (milhar com ponto, decimal com vírgula)
function toNumber(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value !== 'string') return 0;
    const raw = value.trim();
    if (!raw) return 0;

    // Caso tenha vírgula, tratamos vírgula como separador decimal e removemos pontos de milhar
    if (raw.includes(',')) {
        const normalized = raw.replace(/\./g, '').replace(/,/g, '.');
        const num = Number(normalized);
        return Number.isFinite(num) ? num : 0;
    }

    // Sem vírgula: se houver múltiplos pontos, provavelmente são separadores de milhar
    const pointCount = (raw.match(/\./g) || []).length;
    if (pointCount > 1) {
        const normalized = raw.replace(/\./g, '');
        const num = Number(normalized);
        return Number.isFinite(num) ? num : 0;
    }

    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
}

export function calcularResultados(data: Partial<CalculosFormValues>): CalculosResultados {
    const quantidadeRecebida = toNumber(data.quantidadeRecebida ?? 0);
    const pesoLiquidoPorCaixa = toNumber(data.pesoLiquidoPorCaixa ?? 0);
    const pesoBrutoAnalise = toNumber(data.pesoBrutoAnalise ?? 0);
    const taraCaixa = toNumber(data.taraCaixa ?? 0);
    const quantidadeTabela = getQuantidadeDaTabela(quantidadeRecebida);
    const quantidadebaixopeso = toNumber(data.quantidadebaixopeso ?? 0);


    // 1. Peso Líquido Programado (Total)
    const pesoLiquidoProgramado = quantidadeRecebida * pesoLiquidoPorCaixa;

    // 2. Tara Total
    const taraTotal = quantidadebaixopeso * taraCaixa;

    // 3. Peso Líquido da Análise
    const pesoLiquidoAnalise = pesoBrutoAnalise - taraTotal;

    // 4. Peso Líquido Total da Análise e Peso Real
    const pesoLiquidoTotalAnalise = pesoLiquidoAnalise * quantidadeRecebida / 10 ;

    const pesoLiquidoReal = pesoLiquidoProgramado - pesoLiquidoTotalAnalise;

    // 5. Perda em KG
    // Especificação: Perda KG = Peso Programado - Peso Real
    const perdaKg = pesoLiquidoProgramado - pesoLiquidoReal;

    // 6. Perda em CX
    let perdaCx = 0;
    if (pesoLiquidoPorCaixa > 0) {
        perdaCx = perdaKg / pesoLiquidoPorCaixa;
    }

    // 7. Perda Percentual (%)
    let perdaPercentual = 0;
    if (pesoLiquidoProgramado > 0) {
        perdaPercentual = (perdaKg / pesoLiquidoProgramado) * 100;
    }

    return {
        pesoLiquidoProgramado,
        pesoLiquidoAnalise,
        pesoLiquidoReal,
        perdaKg,
        perdaCx,
        perdaPercentual,
        quantidadeTabela,
    };
}
