import { calcularResumo, formatarMoeda, formatarData } from './financeiro.js';
import { desenharGrafico } from './graficos.js';

export const escapar = texto => String(texto).replace(/[&<>"']/g, caractere => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caractere]);
export function tabela(registros, limite) {
  if (!registros.length) return '<div class="vazio"><span>↗</span><h3>Seu próximo passo começa aqui</h3><p>Cadastre um lançamento para acompanhar seus resultados.</p></div>';
  return `<div class="rolagem-tabela"><table><thead><tr><th>Descrição</th><th>Categoria</th><th>Data</th><th>Situação</th><th class="direita">Valor</th><th>Ações</th></tr></thead><tbody>${registros.slice(0, limite ?? registros.length).map(item => `<tr><td><span class="simbolo ${item.tipo}">${item.tipo === 'receita' ? '↙' : '↗'}</span><strong>${escapar(item.descricao)}</strong></td><td>${escapar(item.categoria)}</td><td>${formatarData(item.data)}</td><td><span class="situacao ${item.pago ? 'pago' : 'pendente'}">${item.pago ? (item.tipo === 'receita' ? 'Recebido' : 'Pago') : 'Pendente'}</span></td><td class="direita valor-${item.tipo}">${item.tipo === 'receita' ? '+' : '−'} ${formatarMoeda(item.valor)}</td><td class="acoes-linha">${!item.pago ? `<button data-pagar="${item.id}" title="Marcar como pago ou recebido" aria-label="Confirmar pagamento de ${escapar(item.descricao)}">✓</button>` : ''}<button data-excluir="${item.id}" title="Excluir lançamento" aria-label="Excluir ${escapar(item.descricao)}">×</button></td></tr>`).join('')}</tbody></table></div>`;
}
export function renderizarTela(area, pagina, registros, mes) {
  const resumo = calcularResumo(registros);
  const cartoes = `<div class="cartoes">${[['Receitas recebidas', resumo.receitas, 'receita', '↙', 'Entradas realizadas no mês'], ['Despesas pagas', resumo.despesas, 'despesa', '↗', 'Saídas realizadas no mês'], ['Lucro do mês', resumo.lucro, 'lucro', '⌁', 'Receitas menos despesas pagas'], ['Contas a pagar', resumo.pendente, 'pendente', '◷', 'Despesas que aguardam pagamento']].map(([titulo, valor, classe, icone, nota]) => `<article class="cartao ${classe}"><div><span>${titulo}</span><span class="icone-cartao">${icone}</span></div><strong>${formatarMoeda(valor)}</strong><small>${nota}</small></article>`).join('')}</div>`;
  if (pagina === 'dashboard') {
    area.innerHTML = `${cartoes}<div class="paineis"><article class="painel"><div class="titulo-painel"><div><h2>O ritmo do seu negócio</h2><p>Receitas e despesas ao longo do mês</p></div><div class="legenda"><span>● Receitas</span><span>● Despesas</span></div></div><div id="grafico" class="grafico" aria-label="Gráfico de receitas e despesas"></div></article><article class="painel distribuicao"><h2>Para onde vai seu dinheiro</h2><p>Despesas pagas por categoria</p><div id="categorias"></div></article></div><article class="painel"><div class="titulo-painel"><div><h2>Últimos movimentos</h2><p>Cada detalhe do seu financeiro</p></div><button class="link" data-ir="lancamentos">Ver todos ↗</button></div>${tabela(registros, 5)}</article>`;
    desenharGrafico(area.querySelector('#grafico'), registros, mes);
    const categorias = new Map();
    registros.filter(item => item.tipo === 'despesa' && item.pago).forEach(item => categorias.set(item.categoria, (categorias.get(item.categoria) || 0) + item.valor));
    area.querySelector('#categorias').innerHTML = categorias.size ? [...categorias].sort((a, b) => b[1] - a[1]).map(([nome, valor]) => `<div class="categoria"><div><span>${escapar(nome)}</span><strong>${formatarMoeda(valor)}</strong></div><progress max="${resumo.despesas}" value="${valor}"></progress></div>`).join('') : '<div class="vazio pequeno">Suas categorias aparecerão aqui<br>ao registrar despesas pagas.</div>';
  } else if (pagina === 'relatorios') {
    area.innerHTML = `${cartoes}<article class="painel relatorio"><span class="documento">▤</span><div><h2>Seu mês, em um documento.</h2><p>Exporte o resumo e todos os lançamentos do mês selecionado.</p><small>O lucro considera somente valores pagos e recebidos.</small></div><a class="botao principal" href="/api/relatorio?mes=${mes}">↓ Exportar PDF</a></article><article class="painel"><div class="titulo-painel"><h2>Detalhamento mensal</h2></div>${tabela(registros)}</article>`;
  } else {
    const itens = pagina === 'contas' ? registros.filter(item => item.tipo === 'despesa' && !item.pago).sort((a, b) => a.data.localeCompare(b.data)) : registros;
    area.innerHTML = `${pagina === 'contas' ? cartoes : ''}<article class="painel"><div class="titulo-painel"><div><h2>${pagina === 'contas' ? 'Próximos pagamentos' : 'Todos os lançamentos'}</h2><p>${itens.length} registro(s) no mês selecionado</p></div>${pagina === 'lancamentos' ? '<input id="busca" type="search" placeholder="Buscar descrição ou categoria" aria-label="Buscar lançamento">' : ''}</div><div id="lista-registros">${tabela(itens)}</div></article>`;
    area.querySelector('#busca')?.addEventListener('input', evento => {
      const termo = evento.target.value.toLocaleLowerCase('pt-BR');
      area.querySelector('#lista-registros').innerHTML = tabela(itens.filter(item => `${item.descricao} ${item.categoria}`.toLocaleLowerCase('pt-BR').includes(termo)));
    });
  }
}
