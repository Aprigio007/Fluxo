export function validarLancamento(dados) {
  if (typeof dados.descricao !== 'string' || !dados.descricao.trim() || dados.descricao.length > 120) throw new Error('Informe uma descrição de até 120 caracteres.');
  if (!['receita', 'despesa'].includes(dados.tipo)) throw new Error('Tipo inválido.');
  if (typeof dados.categoria !== 'string' || !dados.categoria.trim() || dados.categoria.length > 50) throw new Error('Informe uma categoria de até 50 caracteres.');
  if (!Number.isSafeInteger(dados.valor) || dados.valor <= 0 || dados.valor > 100000000000) throw new Error('Informe um valor válido.');
  if (typeof dados.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dados.data) || !Number.isFinite(Date.parse(dados.data)) || new Date(dados.data).toISOString().slice(0, 10) !== dados.data) throw new Error('Informe uma data válida.');
  if (typeof dados.pago !== 'boolean') throw new Error('Situação inválida.');
  return { ...dados, descricao: dados.descricao.trim(), categoria: dados.categoria.trim() };
}
