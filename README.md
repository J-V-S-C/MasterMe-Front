# MasterMe — Frontend

Interface web do MasterMe construída com Next.js, React e TypeScript. A versão
de produção é adaptada pelo vinext e executada em Cloudflare Workers.

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

Mais detalhes operacionais estão em [DEPLOYMENT.md](./DEPLOYMENT.md).

## Observações do MVP

- A autenticação usa cookies seguros do Supabase com renovação no proxy do Next.
- O espaço de estudo mostra o consumo e a quota diária interna de IA da conta.
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
- O domínio `workers.dev` pode ser substituído por um domínio personalizado.
- O processamento de materiais ocorre na API e no worker da OCI, não no Worker
  da Cloudflare.
