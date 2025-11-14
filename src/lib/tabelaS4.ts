// Regras específicas fornecidas para a Tabela S4 (CHECKPESO)
// Cada faixa de quantidade recebida mapeia para a quantidade de amostras.
const s4Ranges = [
  { min: 2, max: 8, sample: 2 },
  { min: 9, max: 15, sample: 2 },
  { min: 16, max: 25, sample: 3 },
  { min: 26, max: 50, sample: 5 },
  { min: 51, max: 90, sample: 5 },
  { min: 91, max: 150, sample: 8 },
  { min: 151, max: 280, sample: 13 },
  { min: 281, max: 500, sample: 13 },
  { min: 501, max: 1200, sample: 20 },
  { min: 1201, max: 3200, sample: 32 },
  { min: 3201, max: 10000, sample: 32 },
  { min: 10001, max: 35000, sample: 50 },
  { min: 35001, max: 150000, sample: 80 },
  { min: 150001, max: 500000, sample: 50 },
  { min: 500001, max: Infinity, sample: 125 },
];

export function getQuantidadeDaTabela(quantidadeRecebida: number): number {
  if (isNaN(quantidadeRecebida) || quantidadeRecebida <= 1) {
    return quantidadeRecebida > 0 ? 1 : 0;
  }
  const range = s4Ranges.find(r => quantidadeRecebida >= r.min && quantidadeRecebida <= r.max);
  return range ? range.sample : 0;
}

export function getTabelaSRangeInfo(quantidadeRecebida: number): string {
    if (isNaN(quantidadeRecebida) || quantidadeRecebida <= 0) {
        return "Informe a quantidade recebida.";
    }
    if (quantidadeRecebida === 1) {
        return "Para 1 item, a amostra é 1.";
    }
    const range = s4Ranges.find(r => quantidadeRecebida >= r.min && quantidadeRecebida <= r.max);
    if (!range) return "Quantidade fora das faixas da tabela S4.";

    const maxRange = range.max === Infinity ? "ou mais" : `a ${range.max}`;
    return `Lote entre ${range.min} e ${maxRange} unidades resulta em uma amostra de ${range.sample} unidades.`;
}
