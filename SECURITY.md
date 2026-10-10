# Segurança

## Dependências

- `bun audit --production` deve permanecer sem vulnerabilidades conhecidas.
- Vinext e o adaptador Cloudflare são ferramentas de build, ficam em
  `devDependencies` e não são enviados como dependências de runtime do Worker.
- O lockfile é obrigatório no CI e em deploys (`bun install --frozen-lockfile`).

## Checkout e entitlement

- Preço, plano, saldo e confirmação de pagamento vêm da API; o bundle cliente
  não concede entitlement nem aceita valor informado pelo navegador.
- O BFF cria o header de autorização a partir da sessão e encaminha
  `Idempotency-Key` somente para `POST /api/billing/checkouts`. Cookies e demais
  headers do request não são propagados.
- A intenção idempotente fica apenas em `sessionStorage`, separada por plano, e
  permanece durante redirects e retries da mesma compra. Ela só é apagada após
  a API confirmar `PAID`; IDs de transação e payloads financeiros não são
  persistidos no navegador.
- O checkout externo só abre com HTTPS e hostname exato
  `checkout.infinitepay.com.br`; não há iframe ou HTML remoto incorporado.
- O retorno valida UUID, parâmetros allowlisted e ownership no backend. Estados
  pendentes nunca são apresentados como acesso confirmado.

## Risco transitivo temporário do build

Em 08/10/2026, `vinext@1.0.1` depende transitivamente de `braces@3.0.3` por
`vite-plugin-commonjs`. Essa versão consta no GHSA-vfj7-8cjw-p6xm e ainda não
possui uma versão corrigida publicada.

A dependência processa padrões controlados pelo repositório somente durante o
build; ela não recebe entrada do usuário nem integra o bundle de runtime. O risco
residual fica limitado ao CI confiável. Deve-se remover este registro ou elevar a
versão assim que o upstream publicar uma correção, mantendo também a auditoria
completa (`bun audit`) visível.
