# Observabilidade do cliente

O frontend coleta apenas Web Vitals e classes estáveis de erro para diagnosticar
a experiência sem identificar pessoas. Não são coletados URL completa, query,
e-mail, ID de usuário/material/pedido, conteúdo, mensagem, stack, cookie ou
token. Session replay, fingerprinting e analytics de marketing estão fora do
produto.

## Sinais, amostragem e transporte

- Page views, LCP, INP, CLS, FCP, TTFB, erros e resultados de API usam a mesma
  coorte determinística de 10% por sessão. A semente efêmera fica somente no
  `sessionStorage` e não é transmitida, permitindo denominadores coerentes sem
  criar identificador persistente.
- Erros: somente `render`, `unhandled` e `navigation`, sem texto arbitrário.
  Requests de API registram somente `success`, `client_error`, `server_error`
  ou `network_error`.
- Rotas: allowlist de templates estáticos; query e rotas desconhecidas são
  descartadas antes do envio.
- Transporte: `sendBeacon` same-origin pode incluir o cookie no request ao BFF;
  o BFF ignora todos os cookies e headers recebidos. O fallback `fetch` usa
  `keepalive`, `credentials: omit` e falha silenciosa.

`POST /api/observability` limita o corpo a 2 KiB e usa o binding externo de Rate
Limiting do Cloudflare, com 30 eventos/minuto por origem em cada localização da
rede (contadores permissivos e eventualmente consistentes). Como o endpoint
não usa identidade, a chave é o IP fornecido pelo próprio Cloudflare; NATs
compartilhados podem atingir o limite em conjunto sem afetar a experiência.
Sem binding ou em
falha do limiter responde `503`, limitando custo com fail-closed. O endpoint
rejeita campos extras, substitui o build pelo valor server-side e encaminha
somente JSON validado. Nunca repassa headers, cookies ou autorização recebidos.

## Configuração, custo e desligamento

`APP_BUILD_ID` identifica o SHA/release sem conter dados pessoais. Configure
`OBSERVABILITY_INGEST_URL` com um endpoint HTTPS, declare sua origem exata em
`OBSERVABILITY_ALLOWED_ORIGINS` e configure `OBSERVABILITY_INGEST_TOKEN` como
segredo somente do Worker. IPs, localhost, redes locais e origens fora da
allowlist são recusados; redirects não são seguidos, impedindo que o bearer
migre para outra origem. Sem URL, eventos
válidos recebem `202` e são descartados; essa é também a forma imediata de
desligar a exportação. O limite e a amostragem mantêm tráfego previsível; revise
retenção e custo no destino antes de elevá-los.

## SLOs e resposta

Objetivos iniciais em janela móvel de 28 dias, segmentados por rota/build:

| Sinal | Objetivo | Investigar |
| --- | --- | --- |
| LCP | p75 ≤ 2,5 s | p75 > 2,5 s por 30 min |
| INP | p75 ≤ 200 ms | p75 > 200 ms por 30 min |
| CLS | p75 ≤ 0,1 | p75 > 0,1 por 30 min |
| Erros cliente | erros/page views da mesma coorte < 1% | aumento por build/rota |
| API 5xx observada | `server_error`/todos os resultados de API da mesma coorte < 1% | aumento junto das métricas RED do backend |

Compare o build afetado com o anterior, confirme a mesma regressão em mais de
uma janela e correlacione API 5xx com o backend. Rollback é revert do frontend
para o último SHA verde. Não aumente coleta nem habilite payloads arbitrários
durante incidentes.
