# Design system do MasterMe

Este documento registra a direção visual e os contratos de interface do frontend atual. É uma referência de decisão, não uma biblioteca de componentes pronta. O código renderizado continua sendo a fonte de verdade para valores e comportamentos implementados. Ao mudar uma decisão durável, atualize este documento junto da interface.

## 1. Produto, público e tarefa da interface

O MasterMe é um ambiente pessoal de aprendizagem para estudantes autodidatas de programação e assuntos técnicos. A pessoa traz um material próprio, consulta a fonte, explora conceitos e relações, explica o que compreendeu e pode partir para um projeto de prática. Ela precisa distinguir familiaridade de compreensão e decidir o próximo passo sem perder autonomia.

Projetamos para alguém que já lida com textos densos, tem pouco tempo e quer evidências úteis sobre o próprio entendimento. A interface deve ajudar a retomar o contexto rapidamente, mostrar de onde veio um diagnóstico e permitir caminhos alternativos. Não pressupomos uma sequência obrigatória nem tratamos o mapa como jogo de desbloqueio. O material de origem e a decisão do estudante mantêm primazia.

Há dois contextos de uso com densidades diferentes:

| Contexto | Trabalho principal | Tratamento |
| --- | --- | --- |
| Landing | Entender a proposta e iniciar o estudo | Narrativa editorial, demonstração do mapa e uma ação principal clara. |
| Aplicação autenticada | Ler, investigar, explicar, praticar e organizar | Superfícies estáveis, controles compactos, estados explícitos e conteúdo em primeiro plano. |

## 2. Filosofia e assinatura

**Clareza antes de volume.** Cada bloco deve responder a uma pergunta do estudante: o que é isto, por que importa agora, qual evidência sustenta a informação e o que posso fazer em seguida. Metadados e sinais de estado ajudam a decidir; decoração não deve disputar atenção com o material.

**Autonomia visível.** Relações do mapa dão contexto, não impõem percurso. Explicação, projeto de prática e caso-limite são escolhas distintas. Confiança declarada, tarefa concluída e diagnóstico são evidências diferentes; cor ou microtexto não devem transformá-las numa nota global de domínio.

**A fonte fica por perto.** O workspace aproxima leitura, conceito, pergunta e diagnóstico. Trechos e referências precisam ser identificáveis, e mensagens de IA devem ser apresentadas como diagnóstico verificável e contestável.

**A assinatura visual é o raciocínio tornado navegável.** O mapa de conceitos, seus vínculos e o inspetor contextual são o elemento característico do produto. A landing demonstra essa ideia; o app a transforma em instrumento de trabalho. Evite adicionar ornamentos concorrentes em cada tela.

## 3. Linguagem visual e tokens

A base usa camadas em azul acinzentado, com superfícies próximas entre si e divisórias discretas. O azul marca interação e foco; verde indica confirmação ou explicação aprovada; âmbar chama atenção para revisão, pendência ou cautela. Cor não substitui texto, ícone ou estado acessível.

Os tokens globais são definidos em `app/globals.css` e completados/sobrescritos em `app/themes.css`. Use variáveis semânticas em componentes novos, em vez de copiar hexadecimais. `data-theme="light"` troca os valores da mesma linguagem; o tema escuro é a base em `:root` e recebe ajustes adicionais em `[data-theme="dark"]`.

| Papel | Escuro/base | Claro | Uso |
| --- | --- | --- | --- |
| `--bg` | `#0b141c` | `#f5f7fa` | Fundo da página. |
| `--deep` | `#060f16` | `#e8edf4` | Plano mais profundo, grafo e controles. |
| `--low` | `#141c24` | `#ffffff` | Painéis principais. |
| `--card` | `#182028` | `#eef2f7` | Cartões e campos dentro de painéis. |
| `--high` | `#222b33` | `#e2e8f0` | Superfície elevada ou selecionável. |
| `--text` | `#dae3ee` | `#14202e` | Texto principal. |
| `--muted` | `#aeb5c1` | `#4d5c6b` | Apoio e descrição. |
| `--blue` / `--blue-ink` | `#adc6ff` / `#002e6a` | `#285da8` / `#ffffff` | Ação, seleção e foco; texto sobre azul. |
| `--green` | `#4edea3` | `#16835d` | Confirmação e progresso aprovado. |
| `--amber` | `#ffb95f` | `#a85a00` | Revisão e atenção. |

`--line`, `--line-soft` e `--line-faint` formam a hierarquia de bordas. `--accent-soft`, `--accent-medium`, `--success-soft` e `--warning-soft` são fundos de estado. `--graph-dot` e `--graph-edge` pertencem ao mapa. `--shadow`, `--header` e `--shimmer` acompanham o tema. No escuro explícito, `themes.css` escurece e azula ainda mais as superfícies; portanto, consulte o CSS antes de tomar os valores da tabela como cores finais calculadas.

A biblioteca tem um acento dourado local (`--gold` e variantes em `library-workspace.module.css`) para marcar o espaço de organização. Esse acento não substitui o azul global de ação. Gradientes e brilho são contidos e concentrados em hero ou destaque de conteúdo, sem virar fundo padrão de todo cartão.

## 4. Tipografia, ritmo e forma

`--font-ui` é a pilha de sistema para controles e leitura funcional. `--font-editorial` usa Iowan Old Style, Palatino ou Georgia para títulos de caráter editorial. A landing usa sua variante local `--landing-display`; onboarding e alguns títulos de seção também recorrem à serifada. Metadados curtos e indicadores usam monoespaçada. A mistura representa três funções: narrativa, trabalho e dado.

O corpo do app parte de `--font-body: 16px`; suporte, rótulos e metadados usam 14, 13 e 12 px. Títulos de destaque crescem com `clamp()` quando necessário. Evite reduzir texto de tarefa a tamanho de metadado e evite usar letras maiúsculas espaçadas em parágrafos. Rótulos compactos podem usar caixa alta quando ajudam a localizar uma seção.

O desenho favorece cantos moderados: controles e marcadores em torno de 5–7 px, painéis em torno de 10–11 px e blocos de destaque maiores até 18 px. Bordas suaves e mudança de superfície estabelecem agrupamentos; sombra deve indicar elevação real. Espaçamento interno acompanha densidade: mais amplo em landing/onboarding, compacto em ferramentas de estudo, sem sacrificar área de clique ou leitura.

## 5. Estrutura de páginas e componentes

As rotas Next.js vivem em `app/`. `app/layout.tsx` importa os estilos globais; `globals.css` traz a base, `themes.css` concentra tokens, tema e ajustes compartilhados, e os outros CSS globais cobrem áreas existentes como estudo, prática, autenticação e cobrança. A landing, a biblioteca e páginas de status têm CSS Modules próprios. Para novas áreas isoladas, prefira estilo local; para tokens ou padrão realmente transversal, edite a camada global. Antes de acrescentar seletor, confira a cascata e as regras responsivas já existentes, pois parte do CSS atual contém ajustes posteriores para componentes antigos.

| Camada | Responsabilidade | Exemplos atuais |
| --- | --- | --- |
| Casca de navegação | Entrada, navegação, idioma, tema e saldo | `PageShell`, `SiteHeader`, `ThemeToggle`, `CreditBalance`. |
| Primitivos compartilhados | Interação e feedback consistentes | `ActionButton`, `StyledSelect`, `LoadingSkeleton`. |
| Experiências de domínio | Estado, composição e ações de uma jornada | `LiveStudy`, `KnowledgeMap`, `PracticeWorkspace`, `LibraryWorkspace`. |
| Infraestrutura de UI | Dados e contexto, sem autoridade de negócio | provedores de billing/realtime, `lib/i18n.tsx`, chamadas em `lib/api.ts`. |

`PageShell` fornece link para pular ao conteúdo e o cabeçalho nas rotas internas. `SiteHeader` expõe Estudar, Mapa, Prática e Biblioteca, com estado ativo acessível. A landing tem composição e navegação próprias; não deve herdar densidade do workspace. Não há footer global na aplicação interna.

Ao criar um componente, dê a ele uma responsabilidade clara e uma API pequena. Compartilhe apenas o comportamento que já se repete de fato. Variantes devem representar diferenças semânticas reais (`primary`, `secondary`, `ghost` em `ActionButton`), e não esconder uma coleção de estilos arbitrários. O componente de domínio mantém sua lógica de apresentação perto da jornada; decisões de autenticação, saldo, pagamento e ownership vêm da API.

## 6. Padrões de interação e estados

- **Ação principal:** um próximo passo dominante por contexto. O texto do botão diz o efeito concreto e mantém o mesmo verbo em confirmação e resultado.
- **Seleção:** estado selecionado legível por forma, borda ou rótulo além da cor; `aria-current`, `aria-selected` e atributos equivalentes conforme o controle.
- **Mapa:** nós e relações são exploráveis; seleção abre diagnóstico no mesmo contexto. Relações transitivas ficam ocultas inicialmente para reduzir cruzamentos. Uma conexão informa, mas não bloqueia conceito.
- **Estudo:** leitura e resposta devem manter relação espacial. Diagnóstico explica a lacuna e sua referência, sem parecer nota definitiva. Caso-limite aparece como convite opcional após explicação aprovada.
- **Barra de estudo:** material, conceito e ação de iniciar sessão formam uma linha de decisão; o saldo ocupa uma faixa própria logo abaixo. Em telas estreitas, os controles passam a uma coluna sem misturar o orçamento de créditos com a escolha pedagógica.
- **Prática:** foco automático e escolha manual são as duas decisões expostas. O resultado mostra conceitos priorizados e justificativa. Prévia vem antes de consumo de IA quando o fluxo a oferece.
- **Biblioteca:** Estante, Fichário e Mesa do Dia compartilham a mesma divisão de colunas e altura mínima dos painéis, mesmo vazios. Os painéis de cada vista crescem juntos quando o conteúdo exigir. Calendário reserva mais largura para a grade mensal, mantendo a mesma altura mínima. A navegação usa nomes dos espaços com descrições de sua tarefa, em cartões que lembram fichas; o acento dourado local indica a área ativa.
- **Carregamento:** skeletons específicos de rota preservam a forma do conteúdo esperado. Evite layout shift e falso estado vazio enquanto ainda há requisição.
- **Vazio e erro:** informe o que falta e uma ação possível. Estados de falha não devem sugerir sucesso, especialmente em extração e pagamento pendente.

## 7. Conteúdo e linguagem

A interface oferece `pt-BR` e `en-US`, com preferência no navegador. Todo texto novo de jornada deve existir nos dois idiomas e usar o mecanismo de `lib/i18n.tsx` ou a estrutura localizada da página. A voz é direta, conversacional e específica: “Explicar”, “Criar projeto” e “Escolher conceitos” dizem mais do que “Enviar” ou “Continuar”. Use termos reconhecíveis pelo estudante; detalhes internos de estratégia, fila ou arquitetura não são decisões de interface.

Explique custo ou consequência antes de ações que consomem IA. Ao falar de progresso, diferencie confiança declarada, explicação aprovada, projeto e retomada. Não prometa aprendizado comprovado com base em uma interação. O material original permanece identificável como fonte, e diagnósticos podem ser contestados.

## 8. Responsividade, acessibilidade e movimento

O app usa grids que se reorganizam em uma coluna, controles que crescem ou quebram linha e navegação adaptada no cabeçalho. A landing tem largura máxima local de 1240 px; o shell interno vai até 1600 px; a biblioteca limita seu workspace a 1400 px. Esses números descrevem o layout atual, não autorizam largura fixa que gere overflow. Conferir 390, 768 e 1440 px em UI significativa, incluindo menu, mapa, formulários, estados longos e idiomas.

Todo fluxo deve funcionar por teclado, com foco visível e link de salto para conteúdo. Controles precisam de nomes acessíveis, estados anunciáveis e área de interação confortável. Não depender só de cor, hover ou animação. O projeto já considera `prefers-reduced-motion`; mantenha transições curtas (`--motion-fast: 180ms`, `--motion-standard: 320ms`) e retire movimento ornamental no modo reduzido. Animação serve a orientação ou feedback, principalmente no mapa e em transições de estado.

## 9. Como evoluir o sistema

Antes de desenhar ou alterar UI, leia `skills/front-skill.md`, este documento, o fluxo afetado e seus estilos. Formule em poucas linhas: público, tarefa da tela, hierarquia, tokens a reutilizar e um elemento distintivo justificado pelo assunto. Faça uma crítica da proposta antes de codificar: se poderia servir indistintamente a outro produto, refine. O conteúdo real da jornada deve orientar a forma.

Depois da implementação, confira tema claro e escuro, `pt-BR` e `en-US`, estados de loading/vazio/erro/sucesso, teclado, foco, movimento reduzido e os três tamanhos de viewport. Execute os testes e builds pertinentes conforme `agents.md` e `README.md`. Registre aqui somente decisões que devem sobreviver à tarefa; valores de CSS e comportamento executável continuam verificáveis no código.
