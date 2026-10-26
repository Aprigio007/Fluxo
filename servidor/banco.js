import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('dados', { recursive: true });
export const banco = new DatabaseSync(process.env.BANCO_CAMINHO || 'dados/financeiro.sqlite');
banco.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL, sal TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessoes (
    identificador TEXT PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id), expira INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS lancamentos (
    id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    descricao TEXT NOT NULL, tipo TEXT NOT NULL CHECK(tipo IN ('receita','despesa')),
    categoria TEXT NOT NULL, valor INTEGER NOT NULL CHECK(valor > 0),
    data TEXT NOT NULL, pago INTEGER NOT NULL DEFAULT 1
  );
`);
