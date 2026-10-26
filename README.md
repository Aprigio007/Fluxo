# Fluxo — Sistema de Controle Financeiro

Aplicação local para autônomos e pequenos negócios. Interface responsiva em português, sem instalação de bibliotecas externas.

## Executar

Instale o **Node.js 24 ou superior**, abra um terminal nesta pasta e execute:

```sh
npm start
```

Acesse **http://localhost:3000**, clique em **Cadastre-se** e crie sua conta. O sistema começa vazio para você registrar seus próprios dados. Para reiniciar automaticamente ao editar o servidor, use `npm run dev`.

## Funcionalidades

- Cadastro e login com senha protegida por scrypt, sessão de sete dias e cookie HttpOnly.
- Receitas e despesas com categoria, data e situação de pagamento.
- Dashboard com gráfico interativo por período e distribuição por categoria.
- Lucro automático: receitas recebidas menos despesas pagas.
- Contas a pagar por mês, com confirmação de pagamento.
- Busca de lançamentos por descrição ou categoria e exclusão com confirmação.
- Relatórios mensais em PDF, incluindo todas as páginas necessárias.
- Dados persistidos em SQLite e separados por usuário.

## Organização dos arquivos

```text
servidor/
  iniciar.js          Servidor HTTP e rotas da API
  banco.js            Criação e conexão com SQLite
  autenticacao.js     Senhas e sessões
  validacao.js        Regras dos lançamentos
  pdf.js              Geração do relatório PDF
publico/
  index.html          Estrutura da interface
  css/estilos.css     Aparência e adaptação para celular
  css/grafico.css     Aparência do gráfico
  js/aplicacao.js     Eventos e estado da interface
  js/api.js           Comunicação com o servidor
  js/financeiro.js    Cálculos em centavos e formatação
  js/graficos.js      Construção do gráfico
  js/telas.js         Dashboard, tabelas e relatórios
testes/
  financeiro.test.js Testes das regras e PDF
```

Os nomes do projeto estão em português. Palavras reservadas de JavaScript e nomes de APIs nativas seguem o padrão da linguagem.

## Regras e armazenamento

Valores são guardados como números inteiros em centavos para evitar erros de arredondamento. O filtro mensal usa a data informada no lançamento. O contador lateral mostra todas as despesas pendentes; a tela de contas mostra o mês selecionado. As categorias do gráfico consideram despesas pagas. Passar o mouse ou focar as barras com o teclado mostra os valores.

O banco fica em `dados/financeiro.sqlite`, fora do Git. Faça cópias dessa pasta com o servidor parado. Nunca apague essa pasta se quiser preservar as contas e os registros. Não há sincronização em nuvem nem recuperação de senha nesta versão.

O servidor atende somente na máquina local (`127.0.0.1`). Para disponibilizar na internet, configure HTTPS, proxy e backups; defina `COOKIE_SEGURO=1` para cookies seguros. `PORTA` altera a porta e `BANCO_CAMINHO` permite escolher outro banco. O SQLite nativo pode exibir um aviso experimental do Node.

## Validar

```sh
npm test
```

Os testes verificam cálculo de lucro, valores pendentes, validação de datas e geração de PDF com múltiplas páginas.
