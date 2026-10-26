export async function requisitar(caminho, metodo = 'GET', dados) {
  const resposta = await fetch(`/api${caminho}`, { method: metodo, headers: dados ? { 'Content-Type': 'application/json' } : {}, body: dados ? JSON.stringify(dados) : undefined });
  const resultado = await resposta.json();
  if (!resposta.ok) throw new Error(resultado.erro || 'Não foi possível conectar ao servidor.');
  return resultado;
}
