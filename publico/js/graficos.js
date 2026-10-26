import { formatarMoeda } from './financeiro.js';

export function desenharGrafico(elemento, registros, mes) {
  const dias = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate();
  const grupos = Array.from({ length: 6 }, () => ({ receita: 0, despesa: 0 }));
  registros.filter(item => item.pago).forEach(item => { grupos[Math.min(5, Math.floor((Number(item.data.slice(8)) - 1) / dias * 6))][item.tipo] += item.valor; });
  const maximo = Math.max(10000, ...grupos.flatMap(grupo => [grupo.receita, grupo.despesa]));
  elemento.innerHTML = `<div class="escala"><span>${formatarMoeda(maximo)}</span><span>${formatarMoeda(maximo / 2)}</span><span>R$ 0</span></div><div class="colunas-grafico">${grupos.map((grupo, indice) => `<div class="grupo-grafico"><div class="par-barras"><button class="barra receita altura-${Math.round(grupo.receita / maximo * 100)}" aria-label="Período ${indice + 1}, receitas: ${formatarMoeda(grupo.receita)}" data-dica="Receitas: ${formatarMoeda(grupo.receita)}"></button><button class="barra despesa altura-${Math.round(grupo.despesa / maximo * 100)}" aria-label="Período ${indice + 1}, despesas: ${formatarMoeda(grupo.despesa)}" data-dica="Despesas: ${formatarMoeda(grupo.despesa)}"></button></div><span>${String(Math.floor(indice * dias / 6) + 1).padStart(2, '0')}–${String(Math.floor((indice + 1) * dias / 6)).padStart(2, '0')}</span></div>`).join('')}</div>`;
}
