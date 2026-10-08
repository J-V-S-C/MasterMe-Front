# Workflow de engenharia

## PRD temporário

Antes de alterar código, crie `../.task-prds/YYYY-MM-DD-slug.md` no workspace
compartilhado. Inclua problema, objetivo, não objetivos, contratos, threat model,
privacidade, custo, aceite, testes, rollout, rollback, branches e PRs.

O arquivo é descartável, não substitui o PRD global e não entra no Git. Apague-o
somente quando a tarefa estiver validada, revisada por outro agente e com PRs
abertos.

## Revisão independente

Todo change set com código é revisado por subagente diferente do autor. Na
primeira passada, o revisor não edita: inspeciona PRD, diff e testes e classifica
achados por severidade. A revisão cobre:

- autenticação, cookies, BFF, redirects e ausência de segredos no cliente;
- acessibilidade, teclado, contraste, movimento reduzido e responsividade;
- estados loading/empty/error/success e internacionalização;
- Web Vitals, tamanho do bundle, cache e chamadas externas;
- testes de componente, integração e build Next/Vinext.

O PR identifica o revisor e registra achados e resoluções. Mudança material após
a revisão exige nova passada.

## Validação

```bash
bun install --frozen-lockfile
bun run validate
```

Deploy só ocorre por merge de `development` em `main`, após CI verde.
