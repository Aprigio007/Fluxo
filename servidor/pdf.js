import { calcularResumo, formatarMoeda } from '../publico/js/financeiro.js';

// PDF simples, sem dependências: as posições são calculadas em bytes.
export function gerarRelatorio(lancamentos, mes) {
  const resumo = calcularResumo(lancamentos);
  const linhas = [`FLUXO | Relatorio mensal - ${mes}`, `Recebido: ${formatarMoeda(resumo.receitas)}`, `Pago: ${formatarMoeda(resumo.despesas)}`, `Lucro realizado: ${formatarMoeda(resumo.lucro)}`, `A pagar: ${formatarMoeda(resumo.pendente)}`, '', ...lancamentos.map(item => `${item.data} | ${item.descricao.slice(0, 36)} | ${item.tipo} | ${formatarMoeda(item.valor)} | ${item.pago ? 'Pago' : 'Pendente'}`)];
  const objetos = [];
  const adicionar = texto => { objetos.push(texto); return objetos.length; };
  adicionar('<< /Type /Catalog /Pages 2 0 R >>');
  adicionar('');
  const fonte = adicionar('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const paginas = [];
  for (let inicio = 0; inicio < linhas.length; inicio += 45) {
    const escapar = texto => texto.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\xFF]/g, '-');
    const conteudo = `BT /F1 11 Tf 45 790 Td 16 TL ${linhas.slice(inicio, inicio + 45).map(linha => `(${escapar(linha)}) Tj T*`).join('\n')} ET`;
    const fluxo = adicionar(`<< /Length ${Buffer.byteLength(conteudo, 'latin1')} >>\nstream\n${conteudo}\nendstream`);
    paginas.push(adicionar(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fonte} 0 R >> >> /Contents ${fluxo} 0 R >>`));
  }
  objetos[1] = `<< /Type /Pages /Kids [${paginas.map(id => `${id} 0 R`).join(' ')}] /Count ${paginas.length} >>`;
  let documento = '%PDF-1.4\n';
  const posicoes = [0];
  objetos.forEach((objeto, indice) => { posicoes.push(Buffer.byteLength(documento, 'latin1')); documento += `${indice + 1} 0 obj\n${objeto}\nendobj\n`; });
  const inicioTabela = Buffer.byteLength(documento, 'latin1');
  documento += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${posicoes.slice(1).map(posicao => `${String(posicao).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioTabela}\n%%EOF`;
  return Buffer.from(documento, 'latin1');
}
