import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularResumo } from '../publico/js/financeiro.js';
import { validarLancamento } from '../servidor/validacao.js';
import { gerarRelatorio } from '../servidor/pdf.js';

test('lucro considera somente valores realizados e separa contas pendentes', () => {
  assert.deepEqual(calcularResumo([{ tipo: 'receita', valor: 15000, pago: 1 }, { tipo: 'despesa', valor: 4000, pago: 1 }, { tipo: 'receita', valor: 9000, pago: 0 }, { tipo: 'despesa', valor: 3000, pago: 0 }]), { receitas: 15000, despesas: 4000, lucro: 11000, pendente: 3000 });
  assert.equal(calcularResumo([]).lucro, 0);
});
test('validação rejeita datas inexistentes, valores fracionados em centavos e tipos inválidos', () => {
  const dados = { descricao: ' Serviço ', tipo: 'receita', categoria: 'Serviços', valor: 100, data: '2026-02-28', pago: true };
  assert.equal(validarLancamento(dados).descricao, 'Serviço');
  for (const alteracao of [{ data: '2026-02-30' }, { valor: -100 }, { valor: 1.5 }, { tipo: 'outro' }, { pago: 'sim' }]) assert.throws(() => validarLancamento({ ...dados, ...alteracao }));
});
test('PDF pagina relatórios extensos e gera tabela de referências', () => {
  const dados = Array.from({ length: 100 }, () => ({ descricao: 'Serviço (A)', tipo: 'receita', valor: 100, data: '2026-10-01', pago: 1 }));
  const pdf = gerarRelatorio(dados, '2026-10').toString('latin1');
  assert.ok(pdf.startsWith('%PDF-1.4'));
  assert.ok(pdf.includes('/Count 3'));
  const inicio = Number(pdf.match(/startxref\n(\d+)/)[1]);
  assert.equal(pdf.slice(inicio, inicio + 4), 'xref');
});
