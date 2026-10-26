import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { banco } from './banco.js';

export function criarSenha(senha, sal = randomBytes(16).toString('hex')) {
  return { sal, senha: scryptSync(senha, sal, 64).toString('hex') };
}

export function conferirSenha(senha, usuario) {
  return timingSafeEqual(Buffer.from(criarSenha(senha, usuario.sal).senha, 'hex'), Buffer.from(usuario.senha, 'hex'));
}

export function iniciarSessao(usuario, resposta) {
  const identificador = randomBytes(32).toString('hex');
  banco.prepare('INSERT INTO sessoes VALUES (?, ?, ?)').run(identificador, usuario.id, Date.now() + 604800000);
  resposta.setHeader('Set-Cookie', `sessao=${identificador}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${process.env.COOKIE_SEGURO === '1' ? '; Secure' : ''}`);
}

export function identificarSessao(requisicao) {
  const identificador = requisicao.headers.cookie?.match(/(?:^|;\s*)sessao=([a-f0-9]{64})(?:;|$)/)?.[1];
  const usuario = banco.prepare('SELECT usuarios.id, nome, email FROM usuarios JOIN sessoes ON usuarios.id = sessoes.usuario_id WHERE identificador = ? AND expira > ?').get(identificador || '', Date.now());
  return { identificador, usuario };
}
