# MasterMe — Frontend

Interface web do MasterMe construída com Next.js, React e TypeScript. A versão
de produção é adaptada pelo vinext e executada em Cloudflare Workers.

Antes de alterar a interface ou seus componentes, leia
[`skills/front-skill.md`](skills/front-skill.md) e
[`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md). Atualize o design system quando uma
decisão visual durável mudar.

## Acesso

- Aplicação: <https://masterme-frontend.joaovictorcortabitart.workers.dev>
- API Repo: <https://github.com/J-V-S-C/MasterMe-API>

As chamadas para `/api/*` feitas no domínio do frontend são encaminhadas para a
API da OCI. A URL de destino é definida pela variável `BACKEND_URL` do
environment `production` no GitHub.

## Desenvolvimento local

```bash
bun install
bun run dev
```

Validação completa:

```bash
bun run typecheck
bun test
bun run build
BACKEND_URL=https://masterme-api.duckdns.org bun run build:vinext
```

## Validação visual com Playwright MCP

O Playwright MCP é o navegador de inspeção manual do projeto. Ele complementa,
mas não substitui, os testes automatizados: use-o para observar a interface
renderizada, capturar screenshots, interagir com controles e investigar erros
de console ou de rede.

Caso o MCP ainda não esteja configurado no Codex CLI, instale-o no perfil do
desenvolvedor e confirme a conexão:

```bash
codex mcp add playwright -- npx "@playwright/mcp@latest"
codex mcp list
```

Com `bun run dev` em execução, valide a rota alterada em larguras de 390 px,
768 px e 1440 px. Em cada viewport, confira overflow horizontal, alinhamento,
espaçamento, tipografia, foco e os estados relevantes; teste os controles e
revise erros de console e requisições falhas. Repita essa inspeção depois de
corrigir qualquer achado.

Para regressões que precisem ser executadas em CI, prefira uma suíte Playwright
Test versionada em vez de depender do MCP. O MCP serve para exploração e
diagnóstico durante o desenvolvimento; os testes E2E documentam e protegem
fluxos críticos de forma repetível.

## CI/CD e produção

Todo `push` para `main` dispara dois workflows independentes:

1. `CI` instala dependências com lockfile, executa typecheck, testes, build do
   Next.js e build do vinext.
2. `Deploy frontend to Cloudflare` repete typecheck, testes e build do vinext e
   publica o Worker `masterme-frontend`.

O deploy usa o environment `production` do GitHub e requer:

- variável `BACKEND_URL` com a URL HTTPS da API, sem barra final;
- secret `CLOUDFLARE_ACCOUNT_ID`;
- secret `CLOUDFLARE_API_TOKEN` com permissão para editar Workers na conta.

O workflow só termina com sucesso depois de a Cloudflare aceitar e ativar a nova
versão. Para impedir publicação imediata em todo push, configure reviewers ou
outras protection rules no environment `production` do GitHub.

O environment `production` também exige `PUBLIC_APP_URL`: origem HTTPS
canônica do frontend, sem path nem barra final. `APP_BUILD_ID` é preenchido
pelo workflow com o SHA publicado; não configure manualmente. `BACKEND_URL`
deve apontar para a API pública antes do deploy. Execução manual do workflow
fora de `main` é recusada. Após o primeiro deploy, associe o domínio desejado
ao Worker. Rollback é revert ou republicação do último SHA verde.

O CI instala com `bun install --frozen-lockfile`, executa `bun run validate`,
auditoria de dependências de produção, builds Next/Vinext e smoke HTTP de
landing/login com CSP e `nosniff`. O deploy repete o gate antes de publicar.
Em um clone independente, código, testes e workflows definem o comportamento;
este README reúne a operação. No workspace principal, `agents.md` contém as
convenções. Mudanças com código precisam de objetivo, aceite, testes e revisão
independente antes da conclusão.

## Segurança e cobrança

No lançamento gratuito, `NEXT_PUBLIC_PAYMENTS_ENABLED` fica `false` no build:
a landing mostra só o plano livre e a experiência de checkout não abre, mesmo
com `?plan=PRO`. A API deve estar no mesmo modo, com `INFINITEPAY_HANDLE` vazio.
O plano gratuito oferece 100 créditos/dia, sem teto mensal; cada tentativa real
de geração no Gemini consome um crédito. Os valores exibidos na landing
devem acompanhar o catálogo e a função de reserva do backend.

- Preço, plano, saldo e confirmação de pagamento vêm da API; o cliente não
  concede entitlement. O BFF obtém autorização da sessão e só encaminha
  `Idempotency-Key` ao checkout, sem repassar cookies/headers arbitrários.
- A intenção da mesma compra fica em `sessionStorage` por plano, durante
  redirect/retry, até confirmação `PAID`. O browser não persiste payloads
  financeiros. Checkout externo só abre em HTTPS no host exato
  `checkout.infinitepay.com.br`; sem iframe remoto.
- Retorno valida parâmetros allowlisted e ownership no backend; estado pendente
  não é apresentado como acesso confirmado. Token de sessão fica em cookies
  seguros renovados no proxy; assinatura e ownership continuam na API.
- `bun audit --production` deve permanecer limpo. Vinext/adapter Cloudflare
  ficam em `devDependencies`; lockfile congelado é obrigatório em CI/deploy.
  Auditar também dependências de build e registrar risco transitivo real no PR,
  com plano de atualização, sem perpetuar exceção vencida no README.

## Observabilidade do cliente

O frontend coleta apenas sinais de experiência e classes estáveis de erro:
page views, LCP, INP, CLS, FCP, TTFB e resultado de API. Usa coorte efêmera de
10% por sessão; a semente fica no `sessionStorage` e não é enviada. Não
coletar URL completa, query, e-mail, ID de usuário/material/pedido, resposta,
mensagem de erro, stack, cookie ou token. Sem session replay, fingerprinting
ou analytics de marketing.

`POST /api/observability` limita corpo a 2 KiB e exige o binding de Rate
Limiting do Cloudflare, com 30 eventos/minuto por origem em cada localização.
Sem binding ou em falha responde `503`; valida campos allowlisted, ignora
cookies/headers recebidos e preenche o build no servidor. Configure
`OBSERVABILITY_INGEST_URL` HTTPS, `OBSERVABILITY_ALLOWED_ORIGINS` com origens
exatas e `OBSERVABILITY_INGEST_TOKEN` secreto do Worker, sem `NEXT_PUBLIC_`.
Destino fora da allowlist e redirect são recusados. Sem URL, eventos válidos
recebem `202` e são descartados; isso também desliga a exportação imediatamente.
O deploy verifica que o token não aparece no artefato quando configurado.

Objetivos iniciais em janela de 28 dias por rota/build: LCP p75 ≤ 2,5 s, INP
p75 ≤ 200 ms, CLS p75 ≤ 0,1; erros de cliente e API 5xx observada abaixo de
1% da mesma coorte. Compare regressões entre builds antes de reagir. Não
aumentar coleta nem habilitar payloads arbitrários durante incidentes.

## Observações do MVP

- A autenticação usa cookies seguros do Supabase com renovação no proxy do Next.
- O header e o espaço de estudo usam `/api/billing/me` como fonte autoritativa
  para plano, créditos diário/período e estimativas conservadoras por operação.
- CTAs pagos chegam a `/estudar?plan=...`, confirmam o catálogo do servidor e
  abrem somente URLs HTTPS do host allowlisted da InfinitePay. O retorno em
  `/pagamento/retorno` nunca libera acesso antes da reconciliação da API.
- A interface aceita `pt-BR` e `en-US`; a preferência fica somente no navegador.
- Materiais novos informam o idioma escolhido à API. Conteúdo antigo em outro
  idioma só é traduzido após confirmação explícita, pois a operação consome uma
  chamada de IA e preserva os identificadores do mapa e das sessões.
- O mapa seleciona nós localmente e mostra o diagnóstico no mesmo contexto;
  relações transitivas ficam ocultas por padrão para reduzir cruzamentos.
- A prática pré-visualiza até três lacunas ativas antes de consumir IA e não
  inclui automaticamente conceitos já dominados.
- A listagem carrega somente metadados; o texto completo é buscado para o
  material ativo. Leituras recentes usam cache curto com ETag e são invalidadas
  por eventos SSE após mudanças em qualquer aba.
- O proxy apenas encaminha o token da sessão; assinatura e ownership continuam
  sendo validados pela API. Isso evita uma consulta remota duplicada ao Supabase
  em cada chamada sem transformar o frontend em autoridade de autenticação.
- O BFF encaminha `Idempotency-Key` exclusivamente ao endpoint de checkout e
  nunca repassa cookies ou headers arbitrários do navegador ao backend.
- O domínio `workers.dev` pode ser substituído por um domínio personalizado.
- O processamento de materiais ocorre na API e no worker da OCI, não no Worker
  da Cloudflare.
