# Instruções para agentes — MasterMe Frontend

Antes de planejar ou editar, leia `../scope.md`, `../prd.md`, `../backlog.md` e
`../agents.md`, nessa ordem. Preserve TypeScript estrito, acessibilidade,
responsividade, temas claro/escuro, internacionalização e fronteiras server-side.

## Fluxo obrigatório para qualquer código

1. Crie antes da primeira edição um PRD local em
   `../.task-prds/<data>-<slug>.md`, seguindo
   `docs/ENGINEERING_WORKFLOW.md`. Ele é específico da execução e não altera o
   PRD global por si só.
2. Implemente em branch tipada criada de `development`, com testes de regressão
   e sem expor segredos em componentes cliente.
3. Rode `bun run validate` e os builds Next/Vinext relevantes.
4. Chame automaticamente um subagente diferente do autor para revisar o diff.
   O revisor deve ser somente leitor na primeira passada e verificar segurança,
   autenticação, acessibilidade, temas, responsividade, performance, privacidade,
   custos e testes. Autorrevisão não conta.
5. Corrija ou justifique cada achado e registre a evidência no PR.
6. Apague o PRD temporário apenas depois da validação, revisão e criação dos PRs.

Nunca commite `.task-prds/`, `.env`, tokens, dados pessoais ou chaves do backend.
Preço, entitlement e confirmação de pagamento são autoridade da API, nunca do
bundle cliente.
