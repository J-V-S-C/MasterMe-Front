# Segurança

## Dependências

- `bun audit --production` deve permanecer sem vulnerabilidades conhecidas.
- Vinext e o adaptador Cloudflare são ferramentas de build, ficam em
  `devDependencies` e não são enviados como dependências de runtime do Worker.
- O lockfile é obrigatório no CI e em deploys (`bun install --frozen-lockfile`).

## Risco transitivo temporário do build

Em 08/10/2026, `vinext@1.0.1` depende transitivamente de `braces@3.0.3` por
`vite-plugin-commonjs`. Essa versão consta no GHSA-vfj7-8cjw-p6xm e ainda não
possui uma versão corrigida publicada.

A dependência processa padrões controlados pelo repositório somente durante o
build; ela não recebe entrada do usuário nem integra o bundle de runtime. O risco
residual fica limitado ao CI confiável. Deve-se remover este registro ou elevar a
versão assim que o upstream publicar uma correção, mantendo também a auditoria
completa (`bun audit`) visível.
