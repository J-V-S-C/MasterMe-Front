# MasterMe — Frontend

Interface web do MasterMe construída com Next.js, React e TypeScript. A versão
de produção é adaptada pelo vinext e executada em Cloudflare Workers.

## Acesso

- Aplicação: <https://masterme-frontend.joaovictorcortabitart.workers.dev>
- API: <https://masterme-api.duckdns.org>

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

- Ainda não há autenticação ou isolamento de dados por usuário.
- O domínio `workers.dev` pode ser substituído por um domínio personalizado.
- O processamento de materiais ocorre na API e no worker da OCI, não no Worker
  da Cloudflare.
