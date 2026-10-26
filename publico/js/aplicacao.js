import { requisitar } from './api.js';
import { renderizarTela } from './telas.js';

const selecionar = seletor => document.querySelector(seletor);
let usuario;
let lancamentos = [];
let pagina = 'dashboard';
let cadastrando = false;
let exclusaoPendente;
let temporizador;
const hoje = new Date();
const dataHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
selecionar('#mes').value = dataHoje.slice(0, 7);

function avisar(mensagem) {
  const aviso = selecionar('#aviso'); aviso.textContent = mensagem; aviso.hidden = false;
  clearTimeout(temporizador); temporizador = setTimeout(() => { aviso.hidden = true; }, 5000);
}
function atualizarTela() {
  const titulos = { dashboard: ['Visão geral', 'Uma visão clara de cada movimento do seu dinheiro.'], lancamentos: ['Lançamentos', 'Cada entrada e saída, organizada em um só lugar.'], contas: ['Contas a pagar', 'Antecipe seus compromissos e mantenha tudo em dia.'], relatorios: ['Relatórios', 'Transforme seus números em próximos passos.'] };
  selecionar('#titulo-pagina').textContent = titulos[pagina][0];
  selecionar('#caminho-pagina').textContent = titulos[pagina][0];
  selecionar('#subtitulo-pagina').textContent = titulos[pagina][1];
  document.querySelectorAll('[data-pagina]').forEach(botao => botao.classList.toggle('ativo', botao.dataset.pagina === pagina));
  selecionar('#contador-contas').textContent = lancamentos.filter(item => item.tipo === 'despesa' && !item.pago).length;
  const mes = selecionar('#mes').value;
  renderizarTela(selecionar('#area-pagina'), pagina, lancamentos.filter(item => item.data.startsWith(mes)), mes);
}
async function carregarDados() { lancamentos = await requisitar('/lancamentos'); atualizarTela(); }
async function entrar(conta) {
  usuario = conta;
  selecionar('#nome-usuario').textContent = usuario.nome;
  selecionar('#iniciais').textContent = usuario.nome.slice(0, 1).toUpperCase();
  selecionar('#autenticacao').hidden = true; selecionar('#sistema').hidden = false;
  await carregarDados();
}
selecionar('#alternar-acesso').addEventListener('click', () => {
  cadastrando = !cadastrando;
  selecionar('#campo-nome').hidden = !cadastrando;
  selecionar('[name="nome"]').required = cadastrando;
  selecionar('[name="senha"]').autocomplete = cadastrando ? 'new-password' : 'current-password';
  selecionar('#titulo-acesso').textContent = cadastrando ? 'Seu novo começo.' : 'Bom ter você aqui.';
  selecionar('#descricao-acesso').textContent = cadastrando ? 'Crie sua conta e organize seu financeiro.' : 'Entre para acompanhar seu negócio.';
  selecionar('#botao-acesso').textContent = cadastrando ? 'Criar minha conta ↗' : 'Entrar na minha conta ↗';
  selecionar('#alternar-acesso').textContent = cadastrando ? 'Já tem conta? Entre aqui' : 'Ainda não tem conta? Cadastre-se';
});
selecionar('#formulario-acesso').addEventListener('submit', async evento => {
  evento.preventDefault(); const botao = selecionar('#botao-acesso'); botao.disabled = true;
  try { await entrar(await requisitar(cadastrando ? '/cadastro' : '/login', 'POST', Object.fromEntries(new FormData(evento.target)))); evento.target.reset(); }
  catch (erro) { avisar(erro.message); } finally { botao.disabled = false; }
});
selecionar('#sair').addEventListener('click', async () => {
  try { await requisitar('/sair', 'POST'); usuario = undefined; lancamentos = []; selecionar('#sistema').hidden = true; selecionar('#autenticacao').hidden = false; selecionar('#area-pagina').replaceChildren(); } catch (erro) { avisar(erro.message); }
});
document.querySelectorAll('[data-pagina]').forEach(botao => botao.addEventListener('click', () => { pagina = botao.dataset.pagina; atualizarTela(); }));
selecionar('#mes').addEventListener('change', () => { if (!selecionar('#mes').value) selecionar('#mes').value = dataHoje.slice(0, 7); atualizarTela(); });
selecionar('#aba-mes').addEventListener('click', () => { selecionar('#mes').value = dataHoje.slice(0, 7); atualizarTela(); });
selecionar('#novo-lancamento').addEventListener('click', () => { selecionar('#formulario-lancamento').reset(); selecionar('#formulario-lancamento [name="data"]').value = dataHoje; selecionar('#janela-lancamento').showModal(); });
selecionar('#fechar-modal').addEventListener('click', () => selecionar('#janela-lancamento').close());
selecionar('#formulario-lancamento').addEventListener('submit', async evento => {
  evento.preventDefault(); const botao = evento.target.querySelector('button[type="submit"], button.principal'); botao.disabled = true;
  try {
    const dados = Object.fromEntries(new FormData(evento.target)); dados.valor = Math.round(Number(dados.valor) * 100); dados.pago = dados.pago === 'sim';
    await requisitar('/lancamentos', 'POST', dados); selecionar('#mes').value = dados.data.slice(0, 7); selecionar('#janela-lancamento').close(); await carregarDados(); avisar('Lançamento salvo com sucesso.');
  } catch (erro) { avisar(erro.message); } finally { botao.disabled = false; }
});
selecionar('#area-pagina').addEventListener('click', async evento => {
  const botao = evento.target.closest('button'); if (!botao) return;
  if (botao.dataset.ir) { pagina = botao.dataset.ir; atualizarTela(); }
  if (botao.dataset.excluir) { exclusaoPendente = botao.dataset.excluir; selecionar('#janela-exclusao').showModal(); }
  if (botao.dataset.pagar) { botao.disabled = true; try { await requisitar(`/lancamentos/${botao.dataset.pagar}`, 'PATCH'); await carregarDados(); avisar('Pagamento confirmado.'); } catch (erro) { botao.disabled = false; avisar(erro.message); } }
});
selecionar('#cancelar-exclusao').addEventListener('click', () => selecionar('#janela-exclusao').close());
selecionar('#confirmar-exclusao').addEventListener('click', async evento => {
  evento.target.disabled = true;
  try { await requisitar(`/lancamentos/${exclusaoPendente}`, 'DELETE'); selecionar('#janela-exclusao').close(); await carregarDados(); avisar('Lançamento excluído.'); } catch (erro) { avisar(erro.message); } finally { evento.target.disabled = false; }
});
try { await entrar(await requisitar('/usuario')); } catch (erro) { if (!erro.message.includes('Entre na sua conta')) avisar(erro.message); }
