import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { banco } from './banco.js';
import { criarSenha, conferirSenha, iniciarSessao, identificarSessao } from './autenticacao.js';
import { validarLancamento } from './validacao.js';
import { gerarRelatorio } from './pdf.js';

const tentativas = new Map();
const raiz = resolve('publico');
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
function responder(resposta, codigo, dados) {
  resposta.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  resposta.end(JSON.stringify(dados));
}
async function lerCorpo(requisicao) {
  let corpo = '';
  for await (const parte of requisicao) { corpo += parte; if (corpo.length > 16000) throw new Error('Requisição muito grande.'); }
  try { return JSON.parse(corpo); } catch { throw new Error('Dados inválidos.'); }
}

export const servidor = createServer(async (requisicao, resposta) => {
  resposta.setHeader('X-Content-Type-Options', 'nosniff');
  resposta.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  resposta.setHeader('Referrer-Policy', 'same-origin');
  try {
    const endereco = new URL(requisicao.url, 'http://localhost');
    const caminho = endereco.pathname;
    const metodo = requisicao.method;
    if (caminho.startsWith('/api/')) {
      resposta.setHeader('Cache-Control', 'no-store');
      if (!['GET', 'HEAD'].includes(metodo) && requisicao.headers.origin && new URL(requisicao.headers.origin).host !== requisicao.headers.host) return responder(resposta, 403, { erro: 'Origem não permitida.' });
      const { usuario, identificador } = identificarSessao(requisicao);
      if (['/api/cadastro', '/api/login'].includes(caminho) && metodo === 'POST') {
        const chave = requisicao.socket.remoteAddress;
        const agora = Date.now();
        if (tentativas.size > 10000) for (const [chaveAntiga, registro] of tentativas) if (registro.fim < agora) tentativas.delete(chaveAntiga);
        const tentativa = tentativas.get(chave) || { quantidade: 0, fim: agora + 600000 };
        if (tentativa.fim < agora) { tentativa.quantidade = 0; tentativa.fim = agora + 600000; }
        tentativa.quantidade++; tentativas.set(chave, tentativa);
        if (tentativa.quantidade > 30) return responder(resposta, 429, { erro: 'Muitas tentativas. Aguarde dez minutos.' });
        const dados = await lerCorpo(requisicao);
        if (typeof dados.email !== 'string' || dados.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email) || typeof dados.senha !== 'string' || dados.senha.length < 8 || dados.senha.length > 128) throw new Error('Informe um e-mail válido e uma senha de 8 a 128 caracteres.');
        const email = dados.email.trim().toLowerCase();
        let conta = banco.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
        if (caminho === '/api/cadastro') {
          if (typeof dados.nome !== 'string' || !dados.nome.trim() || dados.nome.length > 80) throw new Error('Informe seu nome (até 80 caracteres).');
          if (conta) throw new Error('Este e-mail já está cadastrado.');
          const segredo = criarSenha(dados.senha);
          const resultado = banco.prepare('INSERT INTO usuarios (nome, email, senha, sal) VALUES (?, ?, ?, ?)').run(dados.nome.trim(), email, segredo.senha, segredo.sal);
          conta = { id: Number(resultado.lastInsertRowid), nome: dados.nome.trim(), email };
        } else if (!conta || !conferirSenha(dados.senha, conta)) return responder(resposta, 401, { erro: 'E-mail ou senha incorretos.' });
        iniciarSessao(conta, resposta);
        return responder(resposta, 200, { id: conta.id, nome: conta.nome, email: conta.email });
      }
      if (!usuario) return responder(resposta, 401, { erro: 'Entre na sua conta para continuar.' });
      if (caminho === '/api/usuario' && metodo === 'GET') return responder(resposta, 200, usuario);
      if (caminho === '/api/sair' && metodo === 'POST') {
        banco.prepare('DELETE FROM sessoes WHERE identificador = ?').run(identificador);
        resposta.setHeader('Set-Cookie', 'sessao=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return responder(resposta, 200, { sucesso: true });
      }
      if (caminho === '/api/lancamentos' && metodo === 'GET') return responder(resposta, 200, banco.prepare('SELECT * FROM lancamentos WHERE usuario_id = ? ORDER BY data DESC, id DESC').all(usuario.id));
      if (caminho === '/api/lancamentos' && metodo === 'POST') {
        const dados = validarLancamento(await lerCorpo(requisicao));
        banco.prepare('INSERT INTO lancamentos (usuario_id, descricao, tipo, categoria, valor, data, pago) VALUES (?, ?, ?, ?, ?, ?, ?)').run(usuario.id, dados.descricao, dados.tipo, dados.categoria, dados.valor, dados.data, Number(dados.pago));
        return responder(resposta, 201, { sucesso: true });
      }
      const registro = caminho.match(/^\/api\/lancamentos\/(\d+)$/);
      if (registro && ['PATCH', 'DELETE'].includes(metodo)) {
        const resultado = metodo === 'DELETE' ? banco.prepare('DELETE FROM lancamentos WHERE id = ? AND usuario_id = ?').run(registro[1], usuario.id) : banco.prepare('UPDATE lancamentos SET pago = 1 WHERE id = ? AND usuario_id = ?').run(registro[1], usuario.id);
        return responder(resposta, resultado.changes ? 200 : 404, resultado.changes ? { sucesso: true } : { erro: 'Lançamento não encontrado.' });
      }
      if (caminho === '/api/relatorio' && metodo === 'GET') {
        const mes = endereco.searchParams.get('mes');
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mes || '')) throw new Error('Mês inválido.');
        const registros = banco.prepare('SELECT * FROM lancamentos WHERE usuario_id = ? AND substr(data, 1, 7) = ? ORDER BY data').all(usuario.id, mes);
        resposta.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="relatorio-${mes}.pdf"` });
        return resposta.end(gerarRelatorio(registros, mes));
      }
      return responder(resposta, 404, { erro: 'Rota não encontrada.' });
    }
    if (metodo !== 'GET') return responder(resposta, 405, { erro: 'Método não permitido.' });
    const arquivo = resolve(raiz, caminho === '/' ? 'index.html' : `.${decodeURIComponent(caminho)}`);
    if (!arquivo.startsWith(raiz + sep)) return responder(resposta, 403, { erro: 'Acesso negado.' });
    try { const conteudo = await readFile(arquivo); resposta.writeHead(200, { 'Content-Type': tipos[extname(arquivo)] || 'application/octet-stream' }); resposta.end(conteudo); }
    catch { responder(resposta, 404, { erro: 'Arquivo não encontrado.' }); }
  } catch (erro) { responder(resposta, 400, { erro: erro.message || 'Não foi possível concluir a operação.' }); }
});
servidor.listen(Number(process.env.PORTA || 3000), '127.0.0.1', () => console.log(`Fluxo disponível em http://localhost:${process.env.PORTA || 3000}`));
