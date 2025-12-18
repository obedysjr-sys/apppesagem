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
    const pesoBrutoAnaliseCalculado = toNumber(data.pesoBrutoAnalise ?? 0);
    const taraCaixa = toNumber(data.taraCaixa ?? 0);
    const quantidadeTabelaOverride = toNumber((data as any).quantidadeTabelaOverride ?? 0);
    const quantidadeTabela = quantidadeTabelaOverride > 0 ? quantidadeTabelaOverride : getQuantidadeDaTabela(quantidadeRecebida);
    const quantidadeBaixoPesoCalculada = toNumber(data.quantidadebaixopeso ?? 0);


    // 1. Peso Líquido Programado (Total)
    const pesoLiquidoProgramado = quantidadeRecebida * pesoLiquidoPorCaixa; // OK

    // 2. Tara Total
    const taraTotal = quantidadeBaixoPesoCalculada * taraCaixa; // OK

    // 3. Peso Líquido Ideal da Análise
    const pesoLiquidoIdealAnalise = quantidadeBaixoPesoCalculada * pesoLiquidoPorCaixa; // OK

    // 4. Peso Líquido da Análise (PESO LIQUIDO DAS CXS COM BAIXO PESO)
    const pesoLiquidoAnalise = pesoBrutoAnaliseCalculado - taraTotal; // OK

    // 5. Diferença entre o Peso Líquido Real da Análise - o peso ideal da análise
    const pesoLiquidoRealAnalise = pesoLiquidoAnalise - pesoLiquidoIdealAnalise; // OK --------

    // 6. Média de baixo peso por caixa analisada (peso médio das caixas com baixo peso)
    const mediaPesoBaixoPorCaixa = quantidadeBaixoPesoCalculada > 0 ? (pesoLiquidoAnalise / quantidadeBaixoPesoCalculada) : 0;

    // 7. % baixo peso em caixas analisadas da amostra (% DE CXS COM BAIXO PESO/TOTAL SKU) (mostrar esse valor em %)
    const percentualqtdcaixascombaixopeso = quantidadeTabela > 0 ? (quantidadeBaixoPesoCalculada / quantidadeTabela) : 0; // OK

    // 8. Média de caixas com baixo peso da carga total (MEDIA TOTAL DE CXS C/BAIXO PESO)
    const mediaqtdcaixascombaixopeso = percentualqtdcaixascombaixopeso * quantidadeRecebida; // OK

    // 9. MEDIA DE BAIXO PESO P/CX (Fórmula da planilha: ((PESO_BRUTO / QTD_BAIXO_PESO) - PESO_PADRAO) * -1)
    const mediabaixopesoporcaixa = quantidadeBaixoPesoCalculada > 0 ? 
        (((pesoBrutoAnaliseCalculado / quantidadeBaixoPesoCalculada) - pesoLiquidoPorCaixa) * -1) : 0;

    // 10. PESO LIQUIDO TOTAL FINAL DA CARGA
    const pesoLiquidoReal = pesoLiquidoProgramado - (mediabaixopesoporcaixa * mediaqtdcaixascombaixopeso); // OK

    // 5. Perda em KG
    // Especificação: Perda KG = Peso Programado - Peso Real
    const perdaKg = mediabaixopesoporcaixa * mediaqtdcaixascombaixopeso;

    // 6. Perda em CX
    let perdaCx = 0;
    if (pesoLiquidoPorCaixa > 0) {
        const perdaCxBruta = perdaKg / pesoLiquidoPorCaixa;
        const sinal = Math.sign(perdaCxBruta);
        const abs = Math.abs(perdaCxBruta);
        const fracao = abs % 1;
        const arredondado = fracao >= 0.5 ? Math.ceil(abs) : Math.floor(abs);
        perdaCx = sinal * arredondado;
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
        pesoLiquidoIdealAnalise,
        pesoLiquidoRealAnalise,
        mediaPesoBaixoPorCaixa,
        mediaqtdcaixascombaixopeso,
        percentualqtdcaixascombaixopeso,
        mediabaixopesoporcaixa,
    };
}
