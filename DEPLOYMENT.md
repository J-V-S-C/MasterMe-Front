# Deploy do frontend

O frontend é publicado no Cloudflare Workers com o adaptador vinext, mantendo o build Next.js original disponível.

No repositório `MasterMe-Front`, crie o Environment `production` e configure:

- Variable `BACKEND_URL`: URL HTTPS da API, sem barra final.
- Variable `PUBLIC_APP_URL`: origem HTTPS canônica do frontend, sem path ou
  barra final; redirects de autenticação falham fechados sem ela em produção.
- Secret `CLOUDFLARE_ACCOUNT_ID`: ID da conta Cloudflare.
- Secret `CLOUDFLARE_API_TOKEN`: token limitado a editar Workers nessa conta.

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
