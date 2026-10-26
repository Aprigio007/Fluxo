import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('API autentica, persiste lançamentos, isola contas e exporta PDF', async () => {
  const processo = spawn(process.execPath, ['servidor/iniciar.js'], { env: { ...process.env, PORTA: '3098', BANCO_CAMINHO: ':memory:' }, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await Promise.race([once(processo.stdout, 'data'), once(processo, 'exit').then(() => { throw new Error('Servidor encerrou antes de iniciar.'); })]);
    async function chamar(caminho, metodo = 'GET', dados, cookie) {
      return fetch(`http://127.0.0.1:3098${caminho}`, { method: metodo, headers: { ...(dados ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: dados ? JSON.stringify(dados) : undefined });
    }
    assert.equal((await chamar('/')).status, 200);
    assert.equal((await chamar('/api/lancamentos')).status, 401);
    const cadastro = await chamar('/api/cadastro', 'POST', { nome: 'Ana', email: 'ana@exemplo.com', senha: 'senha-segura' });
    assert.equal(cadastro.status, 200);
    const cookie = cadastro.headers.get('set-cookie').split(';')[0];
    const dados = { descricao: 'Consultoria', tipo: 'receita', categoria: 'Serviços', valor: 12500, data: '2026-10-15', pago: false };
    assert.equal((await chamar('/api/lancamentos', 'POST', dados, cookie)).status, 201);
    const registros = await (await chamar('/api/lancamentos', 'GET', undefined, cookie)).json();
    assert.equal(registros[0].valor, 12500);
    const outraConta = await chamar('/api/cadastro', 'POST', { nome: 'Bruno', email: 'bruno@exemplo.com', senha: 'senha-segura' });
    const outroCookie = outraConta.headers.get('set-cookie').split(';')[0];
    assert.deepEqual(await (await chamar('/api/lancamentos', 'GET', undefined, outroCookie)).json(), []);
    assert.equal((await chamar(`/api/lancamentos/${registros[0].id}`, 'DELETE', undefined, outroCookie)).status, 404);
    assert.equal((await chamar(`/api/lancamentos/${registros[0].id}`, 'PATCH', undefined, cookie)).status, 200);
    const pdf = await chamar('/api/relatorio?mes=2026-10', 'GET', undefined, cookie);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.ok((await pdf.text()).startsWith('%PDF-1.4'));
    await chamar('/api/sair', 'POST', undefined, cookie);
    assert.equal((await chamar('/api/usuario', 'GET', undefined, cookie)).status, 401);
    const login = await chamar('/api/login', 'POST', { email: 'ana@exemplo.com', senha: 'senha-segura' });
    assert.equal(login.status, 200);
  } finally { processo.kill(); await once(processo, 'exit'); }
});
