# Deploy do frontend

O frontend é publicado no Cloudflare Workers com o adaptador vinext, mantendo o build Next.js original disponível.

No repositório `MasterMe-Front`, crie o Environment `production` e configure:

- Variable `BACKEND_URL`: URL HTTPS da API, sem barra final.
- Variable `PUBLIC_APP_URL`: origem HTTPS canônica do frontend, sem path ou
  barra final; redirects de autenticação falham fechados sem ela em produção.
- Secret `CLOUDFLARE_ACCOUNT_ID`: ID da conta Cloudflare.
- Secret `CLOUDFLARE_API_TOKEN`: token limitado a editar Workers nessa conta.
- `APP_BUILD_ID` é preenchido automaticamente pelo workflow com o SHA imutável
  do commit publicado; não crie nem sobrescreva essa variável manualmente.
- Variable opcional `OBSERVABILITY_INGEST_URL`: destino HTTPS de telemetria.
- Variable opcional `OBSERVABILITY_ALLOWED_ORIGINS`: origens HTTPS exatas,
  separadas por vírgula; deve conter a origem do destino.
- Secret opcional `OBSERVABILITY_INGEST_TOKEN`: bearer dedicado do destino;
  nunca use prefixo `NEXT_PUBLIC_`.

O workflow `.github/workflows/ci.yml` valida typecheck, testes, o build Next e o
build vinext. O workflow `.github/workflows/deploy.yml` repete as validações e
publica o Worker em pushes para `main` ou por execução manual iniciada na própria
`main`; execuções manuais em outras branches são recusadas.

Após o primeiro deploy, associe o domínio desejado ao Worker `masterme-frontend`. A variável `BACKEND_URL` deve apontar para a API pública antes de executar o workflow.

Para validar localmente:

```bash
bun install --frozen-lockfile
bun run typecheck
bun test
BACKEND_URL=https://api.seudominio.com bun run build:vinext
```

Privacidade, SLOs, custo, alertas e desligamento da coleta estão em
[`docs/CLIENT_OBSERVABILITY.md`](docs/CLIENT_OBSERVABILITY.md).

Antes de aceitar um PR, o CI executa o comando único de validação, audita as
dependências de produção e sobe o build Next para um smoke HTTP da landing e do
login, incluindo os headers CSP e `nosniff`. O deploy repete auditoria, build e
smoke antes de gerar/publicar o Worker. A busca pelo valor do token de
observabilidade no artefato permanece um gate adicional quando a exportação
está configurada.
