export function calcularResumo(lancamentos) {
  const receitas = lancamentos.filter(item => item.tipo === 'receita' && item.pago).reduce((total, item) => total + item.valor, 0);
  const despesas = lancamentos.filter(item => item.tipo === 'despesa' && item.pago).reduce((total, item) => total + item.valor, 0);
  const pendente = lancamentos.filter(item => item.tipo === 'despesa' && !item.pago).reduce((total, item) => total + item.valor, 0);
  return { receitas, despesas, lucro: receitas - despesas, pendente };
}
export const formatarMoeda = valor => (valor / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatarData = data => new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
