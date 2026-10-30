'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Icon } from '../ui/icons'
import { loginHrefFor, planLoginHref, type PlanId } from '../../lib/auth/auth-redirect'
import type { Locale } from '../../lib/localization/i18n'
import { ThemeToggle } from '../shell/theme-toggle'
import { SelectField } from '../ui/select-field'
import { BrandLink } from '../shell/brand-link'
import { LandingTaskPreview, type LandingTaskPreviewCopy } from './landing-task-preview'
import styles from './landing-page.module.css'

type MarketingPlan = {
  id: PlanId
  name: string
  price: string
  duration: string
  dailyLimit: string
  periodLimit: string
  description: string
  action: string
  footnote: string
  featured?: boolean
}

type LandingCopy = {
  skipContent: string
  brandLabel: string
  navigationLabel: string
  mobileNavigationLabel: string
  menuLabel: string
  languageLabel: string
  lightTheme: string
  darkTheme: string
  signIn: string
  startFree: string
  nav: { study: string; tasks: string; practice: string; plans: string }
  hero: {
    eyebrow: string; title: string; emphasis: string; description: string; action: string; secondary: string
    sample: string; source: string; chapter: string; excerpt: string; highlight: string; note: string
  }
  cycle: { kicker: string; title: string; description: string; steps: readonly { title: string; description: string }[] }
  study: {
    kicker: string; title: string; description: string; example: string; figureLabel: string
    questions: string; history: string; material: string; concept: string; materialName: string; conceptName: string
    questionLabel: string; question: string; answerLabel: string; answer: string
    outcomeLabel: string; outcome: string; diagnosis: string; nextLabel: string; next: string
    help: string; sourceAction: string; caption: string
  }
  history: {
    kicker: string; title: string; description: string; example: string; chapter: string
    recordOne: string; recordTwo: string; passed: string; incomplete: string; gap: string; action: string
  }
  tasks: { kicker: string; title: string; description: string; preview: LandingTaskPreviewCopy }
  practice: {
    kicker: string; title: string; description: string; example: string; drill: string; project: string
    concept: string; conceptName: string; questionLabel: string; question: string; criterionLabel: string; criterion: string
    responseLabel: string; responsePlaceholder: string; evaluation: string; projectTitle: string; projectDescription: string
  }
  pricing: { kicker: string; title: string; description: string; freeDescription: string; featuredBadge: string; simultaneousLimits: string; creditNote: string }
  plans: readonly MarketingPlan[]
  faq: { kicker: string; title: string; items: readonly { question: string; answer: string; paid?: boolean }[] }
  finalCta: { kicker: string; title: string; description: string; action: string }
  footer: { navigationLabel: string; description: string; principles: string }
}

const landingCopy = {
  'pt-BR': {
    skipContent: 'Pular para o conteúdo principal', brandLabel: 'MasterMe, página inicial', navigationLabel: 'Seções da página', mobileNavigationLabel: 'Menu de seções', menuLabel: 'Menu', languageLabel: 'Idioma', lightTheme: 'Usar tema claro', darkTheme: 'Usar tema escuro', signIn: 'Entrar', startFree: 'Começar',
    nav: { study: 'Estudar', tasks: 'Tarefas', practice: 'Praticar', plans: 'Planos' },
    hero: {
      eyebrow: 'Seu material. Seu raciocínio.', title: 'Estude a partir do que você lê.', emphasis: 'Veja o que sua resposta sustenta.',
      description: 'Traga um livro, artigo ou texto. O MasterMe organiza os trechos, faz perguntas ligadas à fonte e mostra o que ficou claro e o que merece outra tentativa.',
      action: 'Começar gratuitamente', secondary: 'Ver como funciona', sample: 'EXEMPLO ILUSTRATIVO', source: 'Do material à pergunta', chapter: 'Capítulo 3 · Índices',
      excerpt: 'Um índice criado primeiro por cliente e depois por data organiza os registros nessa ordem.', highlight: 'primeiro por cliente e depois por data',
      note: 'O trecho original continua disponível enquanto você estuda.',
    },
    cycle: {
      kicker: 'COMO FUNCIONA', title: 'Uma fonte, três formas de avançar.',
      description: 'Estudar, Tarefas e Praticar usam o mesmo material. Você decide quando responder, planejar ou aplicar uma ideia.',
      steps: [
        { title: 'Estude um trecho', description: 'Envie PDF, Markdown ou TXT, ou cole texto. Em livros, avance pelos capítulos e escolha o conceito que quer entender.' },
        { title: 'Marque uma intenção', description: 'Crie uma tarefa com dia, horário e duração. Ligue a tarefa ao material ou aceite uma sugestão de revisão quando fizer sentido.' },
        { title: 'Aplique a ideia', description: 'Faça um exercício focado com feedback. Se preferir, gere um projeto curto e construa a solução no seu editor.' },
      ],
    },
    study: {
      kicker: 'ESTUDAR', title: 'A pergunta nasce do trecho. A avaliação volta a ele.',
      description: 'Escolha um conceito, explique com suas palavras e consulte a fonte quando precisar. O feedback separa o que sua resposta sustentou do que ainda falta.',
      example: 'EXEMPLO ILUSTRATIVO', figureLabel: 'Exemplo de pergunta e feedback do estudo', questions: 'Perguntas', history: 'Histórico e lacunas', material: 'Material', concept: 'Conceito', materialName: 'Guia de bancos de dados', conceptName: 'Índices compostos',
      questionLabel: 'Pergunta de estudo', question: 'Por que um índice em (cliente, data) ajuda menos uma busca feita apenas por data?',
      answerLabel: 'Sua resposta', answer: 'O índice agrupa primeiro os registros por cliente. Para procurar só pela data, essa primeira parte não ajuda a localizar o intervalo.',
      outcomeLabel: 'Resultado da avaliação', outcome: 'Explicação aprovada', diagnosis: 'A resposta identifica a ordem das colunas e explica por que uma busca apenas pela segunda coluna perde a vantagem do índice.',
      nextLabel: 'Próximo passo', next: 'Experimente um caso em que a busca usa cliente e data juntos.', help: 'Precisa de uma explicação?', sourceAction: 'Ler no material',
      caption: 'Texto, resposta e avaliação são exemplos. No produto, o diagnóstico se apoia no material que você enviou.',
    },
    history: {
      kicker: 'DENTRO DE ESTUDAR', title: 'Encontre a resposta anterior e a lacuna que ficou.',
      description: 'O histórico guarda pergunta, resposta, feedback e fonte. As dificuldades recorrentes aparecem com as tentativas que as sustentam; você pode voltar ao conceito ou criar uma tarefa de revisão.',
      example: 'EXEMPLO ILUSTRATIVO', chapter: 'Capítulo 3 · Índices', recordOne: 'Índices compostos', recordTwo: 'Busca por segunda coluna', passed: 'APROVADA', incomplete: 'INCOMPLETA',
      gap: 'Falta explicar por que a primeira coluna define a entrada no índice.', action: 'No produto, você pode criar uma tarefa de revisão.',
    },
    tasks: {
      kicker: 'TAREFAS', title: 'Dê um lugar ao que você pretende fazer.',
      description: 'Escolha a data e o tempo, veja o cartão antes de salvar e mova a tarefa no quadro quando o plano mudar. Experimente esta prévia sem criar uma conta.',
      preview: {
        example: 'EXEMPLO INTERATIVO', title: 'Revisar índices compostos', tabs: { date: 'Data', details: 'Tempo', board: 'Quadro' }, headings: { date: 'Escolha um dia', details: 'Defina o horário e a duração', board: 'Mova o cartão' },
        month: 'OUTUBRO 2026', shortMonth: 'out', weekdays: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'], dateLabel: 'Data', timeLabel: 'Horário', durationLabel: 'Duração', minutes: 'min', viewBoard: 'Ver no quadro', stageLabel: 'Etapa da tarefa',
        stages: ['A fazer', 'Em andamento', 'Concluída'], otherCards: ['Explicar isolamento', 'Rever anotações'], caption: 'Você está explorando um exemplo. Nada é salvo.',
      },
    },
    practice: {
      kicker: 'PRATICAR', title: 'Primeiro, um exercício concreto. Projeto, se você quiser.',
      description: 'O exercício focado traz uma situação para aplicar o conceito e avalia sua resposta. O projeto opcional entrega um objetivo, entregáveis e um primeiro passo para você construir fora do app.',
      example: 'EXEMPLO ILUSTRATIVO', drill: 'Exercício focado', project: 'Projeto opcional', concept: 'Habilidade', conceptName: 'Índices compostos',
      questionLabel: 'Situação', question: 'Uma consulta filtra apenas pela data do pedido. O índice atual começa por cliente. O que você mudaria e por quê?',
      criterionLabel: 'Critério', criterion: 'Justifique a escolha usando a ordem das colunas e o padrão da consulta.', responseLabel: 'Sua resposta', responsePlaceholder: 'Explique sua decisão com suas palavras…',
      evaluation: 'Sua tentativa recebe feedback separado da explicação de estudo.', projectTitle: 'Do exercício a uma construção',
      projectDescription: 'Se quiser ampliar a prática, gere um projeto com foco escolhido por você ou sugerido a partir do que estudou.',
    },
    pricing: { kicker: 'ACESSO', title: 'Comece grátis. Amplie só se precisar.', description: 'Planos pagos são compras únicas. Sem assinatura e sem renovação automática.', freeDescription: 'Nesta fase, apenas o plano gratuito está disponível.', featuredBadge: 'MAIOR HORIZONTE', simultaneousLimits: 'Os limites diário e do período valem simultaneamente.', creditNote: 'No plano Livre, cada tentativa enviada ao Gemini consome 1 crédito. O saldo renova diariamente; tentativas de fallback também contam. A capacidade do provedor é compartilhada.' },
    plans: [
      { id: 'FREE', name: 'Livre', price: 'R$ 0', duration: 'sem prazo', dailyLimit: '100 créditos por dia', periodLimit: '', description: 'Para conhecer o método com seu próprio material.', action: 'Começar gratuitamente', footnote: 'Não exige pagamento.' },
      { id: 'ESSENTIAL', name: 'Essencial', price: 'R$ 29,90', duration: 'por 30 dias', dailyLimit: '120 créditos por dia', periodLimit: '1.500 créditos por vigência', description: 'Para uma fase intensa de estudo e prática.', action: 'Escolher Essencial', footnote: 'Pagamento único · sem renovação automática.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'por 365 dias', dailyLimit: '180 créditos por dia', periodLimit: '15.000 créditos por vigência', description: 'Para manter uma biblioteca ativa ao longo do ano.', action: 'Escolher Pro', footnote: 'Pagamento único · sem renovação automática.', featured: true },
    ],
    faq: { kicker: 'PERGUNTAS FREQUENTES', title: 'Antes de começar', items: [
      { question: 'A IA responde às perguntas por mim?', answer: 'Não. Você escreve a resposta. A IA ajuda a organizar o material e avalia sua explicação com apoio nos trechos da fonte.' },
      { question: 'Onde vejo meu histórico e minhas lacunas?', answer: 'Na área Estudar, abra Histórico e lacunas. Você encontra as tentativas por capítulo, o feedback e as revisões disponíveis.' },
      { question: 'O projeto é avaliado pelo aplicativo?', answer: 'Não. O MasterMe prepara um breve projeto com objetivo e entregáveis. Você constrói a solução no seu editor.' },
      { question: 'Quais arquivos posso enviar?', answer: 'Texto colado, PDF com texto selecionável, Markdown e TXT. PDFs digitalizados sem texto não são aceitos.' },
      { question: 'Quem acessa o meu material?', answer: 'Só você. Cada conta lê apenas os próprios materiais, tarefas e histórico.' },
      { question: 'Os planos pagos são assinaturas?', answer: 'Não. Essencial e Pro são pagamentos únicos para o período informado e não renovam automaticamente.', paid: true },
    ] },
    finalCta: { kicker: 'COMECE COM O QUE VOCÊ JÁ ESTUDA', title: 'Traga uma fonte. Faça a primeira pergunta.', description: 'Seu material, suas respostas e o próximo passo em um só lugar.', action: 'Começar a estudar' },
    footer: { navigationLabel: 'Navegação do rodapé', description: 'Um lugar para estudar matérias técnicas com o próprio material.', principles: 'Materiais privados · Feedback ligado à fonte' },
  },
  'en-US': {
    skipContent: 'Skip to main content', brandLabel: 'MasterMe, home page', navigationLabel: 'Page sections', mobileNavigationLabel: 'Section menu', menuLabel: 'Menu', languageLabel: 'Language', lightTheme: 'Use light theme', darkTheme: 'Use dark theme', signIn: 'Sign in', startFree: 'Start',
    nav: { study: 'Study', tasks: 'Tasks', practice: 'Practice', plans: 'Plans' },
    hero: {
      eyebrow: 'Your material. Your reasoning.', title: 'Study from what you read.', emphasis: 'See what your answer supports.',
      description: 'Bring a book, article, or text. MasterMe organizes passages, asks questions tied to the source, and shows what is clear and what deserves another attempt.',
      action: 'Start for free', secondary: 'See how it works', sample: 'ILLUSTRATIVE EXAMPLE', source: 'From source to question', chapter: 'Chapter 3 · Indexes',
      excerpt: 'An index created first by customer and then by date organizes records in that order.', highlight: 'first by customer and then by date',
      note: 'The original passage remains available while you study.',
    },
    cycle: {
      kicker: 'HOW IT WORKS', title: 'One source, three ways forward.',
      description: 'Study, Tasks, and Practice use the same material. You decide when to answer, plan, or apply an idea.',
      steps: [
        { title: 'Study a passage', description: 'Upload a PDF, Markdown, or TXT file, or paste text. In books, move through chapters and choose the concept you want to understand.' },
        { title: 'Make an intention concrete', description: 'Create a task with a date, time, and duration. Attach it to a material or accept a review suggestion when it helps.' },
        { title: 'Apply the idea', description: 'Try a focused exercise with feedback. If you prefer, generate a short project and build the solution in your editor.' },
      ],
    },
    study: {
      kicker: 'STUDY', title: 'The question starts in the passage. The assessment returns to it.',
      description: 'Choose a concept, explain it in your own words, and consult the source when you need it. Feedback separates what your answer supports from what is still missing.',
      example: 'ILLUSTRATIVE EXAMPLE', figureLabel: 'Study question and feedback example', questions: 'Questions', history: 'History and gaps', material: 'Material', concept: 'Concept', materialName: 'Database guide', conceptName: 'Composite indexes',
      questionLabel: 'Study question', question: 'Why does an index on (customer, date) help less when a query filters only by date?',
      answerLabel: 'Your answer', answer: 'The index groups records by customer first. When searching only by date, that first part does not help locate the range.',
      outcomeLabel: 'Assessment outcome', outcome: 'Explanation passed', diagnosis: 'The answer identifies the column order and explains why a search using only the second column loses the index advantage.',
      nextLabel: 'Next step', next: 'Try a case where the query uses customer and date together.', help: 'Need an explanation?', sourceAction: 'Read in the material',
      caption: 'The passage, answer, and assessment are examples. In the product, feedback is grounded in the material you provide.',
    },
    history: {
      kicker: 'INSIDE STUDY', title: 'Find the earlier answer and the gap that remained.',
      description: 'History keeps the question, answer, feedback, and source. Recurring difficulties show the attempts behind them; you can return to a concept or create a review task.',
      example: 'ILLUSTRATIVE EXAMPLE', chapter: 'Chapter 3 · Indexes', recordOne: 'Composite indexes', recordTwo: 'Search by second column', passed: 'PASSED', incomplete: 'INCOMPLETE',
      gap: 'The answer still needs to explain why the first column defines the entry point into the index.', action: 'In the product, you can create a review task.',
    },
    tasks: {
      kicker: 'TASKS', title: 'Give your intention a place in the week.',
      description: 'Choose the date and time, preview the card before saving, and move the task on the board when plans change. Try this preview without an account.',
      preview: {
        example: 'INTERACTIVE EXAMPLE', title: 'Review composite indexes', tabs: { date: 'Date', details: 'Time', board: 'Board' }, headings: { date: 'Choose a day', details: 'Set the time and duration', board: 'Move the card' },
        month: 'OCTOBER 2026', shortMonth: 'Oct', weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], dateLabel: 'Date', timeLabel: 'Time', durationLabel: 'Duration', minutes: 'min', viewBoard: 'See the board', stageLabel: 'Task stage',
        stages: ['To do', 'Doing', 'Done'], otherCards: ['Explain isolation', 'Review notes'], caption: 'This is an example. Nothing is saved.',
      },
    },
    practice: {
      kicker: 'PRACTICE', title: 'Start with a concrete exercise. Choose a project if you want.',
      description: 'A focused exercise gives you a situation in which to apply a concept and assesses your answer. An optional project gives you a goal, deliverables, and a first step to build outside the app.',
      example: 'ILLUSTRATIVE EXAMPLE', drill: 'Focused exercise', project: 'Optional project', concept: 'Skill', conceptName: 'Composite indexes',
      questionLabel: 'Situation', question: 'A query filters only by order date. The current index starts with customer. What would you change, and why?',
      criterionLabel: 'Criterion', criterion: 'Justify your choice using column order and the query pattern.', responseLabel: 'Your answer', responsePlaceholder: 'Explain your decision in your own words…',
      evaluation: 'Your attempt receives feedback separate from the Study explanation.', projectTitle: 'From exercise to a build',
      projectDescription: 'If you want to go further, generate a project with a focus you choose or one suggested from your study.',
    },
    pricing: { kicker: 'ACCESS', title: 'Start free. Expand only if you need to.', description: 'Paid plans are one-time purchases. No subscription or automatic renewal.', freeDescription: 'At this stage, only the free plan is available.', featuredBadge: 'LONGEST HORIZON', simultaneousLimits: 'Daily and period limits apply simultaneously.', creditNote: 'On the Free plan, each attempt sent to Gemini uses 1 credit. The balance resets daily; fallback attempts also count. Provider capacity is shared.' },
    plans: [
      { id: 'FREE', name: 'Free', price: 'R$ 0', duration: 'no expiration', dailyLimit: '100 credits per day', periodLimit: '', description: 'Explore the method with your own material.', action: 'Start for free', footnote: 'No payment required.' },
      { id: 'ESSENTIAL', name: 'Essential', price: 'R$ 29.90', duration: 'for 30 days', dailyLimit: '120 credits per day', periodLimit: '1,500 credits per access period', description: 'For an intensive phase of study and practice.', action: 'Choose Essential', footnote: 'One-time payment · no automatic renewal.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'for 365 days', dailyLimit: '180 credits per day', periodLimit: '15,000 credits per access period', description: 'Keep an active library throughout the year.', action: 'Choose Pro', footnote: 'One-time payment · no automatic renewal.', featured: true },
    ],
    faq: { kicker: 'FREQUENT QUESTIONS', title: 'Before you begin', items: [
      { question: 'Does AI answer the questions for me?', answer: 'No. You write the answer. AI helps organize the material and assesses your explanation against passages from the source.' },
      { question: 'Where do I find my history and gaps?', answer: 'In Study, open History and gaps. You can find attempts by chapter, their feedback, and available reviews.' },
      { question: 'Does the app assess my project solution?', answer: 'No. MasterMe prepares a short project brief with a goal and deliverables. You build the solution in your own editor.' },
      { question: 'Which files can I upload?', answer: 'Pasted text, selectable-text PDFs, Markdown, and TXT. Scanned PDFs without selectable text are rejected.' },
      { question: 'Who can access my material?', answer: 'Only you. Each account can read only its own materials, tasks, and history.' },
      { question: 'Are paid plans subscriptions?', answer: 'No. Essential and Pro are one-time payments for the stated period and do not renew automatically.', paid: true },
    ] },
    finalCta: { kicker: 'START WITH WHAT YOU ALREADY STUDY', title: 'Bring a source. Ask the first question.', description: 'Your material, your answers, and your next step in one place.', action: 'Start studying' },
    footer: { navigationLabel: 'Footer navigation', description: 'A place to study technical subjects with your own material.', principles: 'Private materials · Source-grounded feedback' },
  },
} satisfies Record<Locale, LandingCopy>

// Display copy only. The API remains authoritative for price, credits, and checkout.
export const marketingPlans: readonly MarketingPlan[] = landingCopy['pt-BR'].plans

const landingTabs = [
  { key: 'study', href: '#study', icon: 'book' },
  { key: 'tasks', href: '#tasks', icon: 'library' },
  { key: 'practice', href: '#practice', icon: 'sparkles' },
] as const

function LandingNavigation({ copy, label }: { copy: LandingCopy; label: string }) {
  return <nav className={styles.navigation} aria-label={label}>
    {landingTabs.map((tab) => <a href={tab.href} key={tab.key}><span className={styles.navIcon}><Icon name={tab.icon} /></span><span className={styles.navLabel}>{copy.nav[tab.key]}</span></a>)}
  </nav>
}

export function LandingPage({ paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true' }: { paymentsEnabled?: boolean } = {}) {
  const [locale, setLocaleState] = useState<Locale>('pt-BR')
  const mobileMenuRef = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const stored = window.localStorage.getItem('masterme:locale')
    const selected: Locale = stored === 'en-US' ? 'en-US' : 'pt-BR'
    setLocaleState(selected)
    document.documentElement.lang = selected
  }, [])
  const setLocale = (next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem('masterme:locale', next)
    document.documentElement.lang = next
  }
  const copy = landingCopy[locale]
  const exampleSource = copy.hero.excerpt.split(copy.hero.highlight)

  return <div className={styles.landing}>
    <a className={styles.skipLink} href="#main-content">{copy.skipContent}</a>
    <header className={styles.header}><div className={styles.headerInner}>
      <BrandLink href="/" label={copy.brandLabel} className={styles.brand} />
      <LandingNavigation copy={copy} label={copy.navigationLabel} />
      <div className={styles.headerActions}><Link className={styles.headerSignIn} href={loginHrefFor('/study')}>{copy.signIn}</Link><Link className={`${styles.primaryAction} ${styles.headerAction}`} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.startFree}</Link></div>
      <details className={styles.mobileMenu} ref={mobileMenuRef}><summary><svg className={styles.menuIcon} aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M4 7h16M4 12h16M4 17h16" /></svg>{copy.menuLabel}</summary><div className={styles.menuPanel}>
        <nav className={styles.mobileNavigation} aria-label={copy.mobileNavigationLabel}>{landingTabs.map((tab) => <a href={tab.href} key={tab.key} onClick={() => mobileMenuRef.current?.removeAttribute('open')}><Icon name={tab.icon} />{copy.nav[tab.key]}</a>)}</nav>
        <div className={styles.menuUtilities}><SelectField compact icon={null} label={copy.languageLabel} value={locale} options={[{ value: 'pt-BR', label: 'PT' }, { value: 'en-US', label: 'EN' }]} onValueChange={(value) => setLocale(value === 'en-US' ? 'en-US' : 'pt-BR')} /><ThemeToggle lightLabel={copy.lightTheme} darkLabel={copy.darkTheme} /></div>
        <Link className={styles.menuSignIn} href={loginHrefFor('/study')}>{copy.signIn}</Link><Link className={`${styles.primaryAction} ${styles.menuStart}`} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.startFree}</Link>
      </div></details>
    </div></header>

    <main id="main-content" className={styles.main}>
      <section className={styles.hero} aria-labelledby="landing-title">
        <div className={styles.heroCopy}><p className={styles.kicker}>{copy.hero.eyebrow}</p><h1 id="landing-title">{copy.hero.title}<br /><em>{copy.hero.emphasis}</em></h1><p className={styles.heroDescription}>{copy.hero.description}</p>
          <div className={styles.heroActions}><Link className={styles.primaryAction} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.hero.action} <Icon name="chevron" /></Link><a className={styles.secondaryAction} href="#how-it-works">{copy.hero.secondary}</a></div>
        </div>
        <figure className={styles.sourceFigure} aria-label={copy.hero.source}><div className={styles.sourceTop}><span><Icon name="document" />{copy.hero.chapter}</span><b>{copy.hero.sample}</b></div><div className={styles.sourcePaper}><span className={styles.sourceRule} /><p>{exampleSource[0]}<mark>{copy.hero.highlight}</mark>{exampleSource[1]}</p><span className={styles.sourceRuleShort} /></div><figcaption>{copy.hero.note}</figcaption></figure>
      </section>

      <section className={styles.cycle} id="how-it-works" aria-labelledby="cycle-title"><header className={styles.sectionHeading}><p className={styles.kicker}>{copy.cycle.kicker}</p><h2 id="cycle-title">{copy.cycle.title}</h2><p>{copy.cycle.description}</p></header><ol className={styles.cycleList}>{copy.cycle.steps.map((step, index) => <li key={step.title}><span className={styles.cycleNumber}>0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol></section>

      <section className={styles.studySection} id="study" aria-labelledby="study-title"><header className={styles.sectionHeading}><p className={styles.kicker}>{copy.study.kicker}</p><h2 id="study-title">{copy.study.title}</h2><p>{copy.study.description}</p></header>
        <figure className={styles.studyFigure} aria-label={copy.study.figureLabel}><div className={styles.demoHeading}><span><Icon name="book" />{copy.study.questions}</span><span>{copy.study.history}</span><b>{copy.study.example}</b></div>
          <div className={styles.demoSelectors}><div><small>{copy.study.material}</small><strong>{copy.study.materialName}</strong></div><div><small>{copy.study.concept}</small><strong>{copy.study.conceptName}</strong></div></div>
          <div className={styles.studyDemoBody}><div className={styles.demoQuestion}><span>{copy.study.questionLabel}</span><h3>{copy.study.question}</h3><div><span><Icon name="idea" />{copy.study.help}</span><span><Icon name="document" />{copy.study.sourceAction}</span></div></div><div className={styles.demoAnswer}><span>{copy.study.answerLabel}</span><p>{copy.study.answer}</p></div><div className={styles.demoOutcome}><span>{copy.study.outcomeLabel}</span><strong><Icon name="check" />{copy.study.outcome}</strong><p>{copy.study.diagnosis}</p><div><b>{copy.study.nextLabel}</b><p>{copy.study.next}</p></div></div></div>
          <figcaption>{copy.study.caption}</figcaption></figure>
      </section>

      <section className={styles.historySection} aria-labelledby="history-title"><div className={styles.historyCopy}><header className={styles.sectionHeading}><p className={styles.kicker}>{copy.history.kicker}</p><h2 id="history-title">{copy.history.title}</h2><p>{copy.history.description}</p></header></div><figure className={styles.historyFigure} aria-label={copy.history.title}><div className={styles.historyFigureHead}><span>{copy.history.chapter}</span><b>{copy.history.example}</b></div><div className={styles.historyRow}><span className={styles.historyPassed}>{copy.history.passed}</span><strong>{copy.history.recordOne}</strong></div><div className={styles.historyRow}><span className={styles.historyIncomplete}>{copy.history.incomplete}</span><strong>{copy.history.recordTwo}</strong><p>{copy.history.gap}</p></div><div className={styles.historyAction}><Icon name="clock" />{copy.history.action}</div></figure></section>

      <section className={styles.tasks} id="tasks" aria-labelledby="tasks-title"><div className={styles.tasksCopy}><header className={styles.sectionHeading}><p className={styles.kicker}>{copy.tasks.kicker}</p><h2 id="tasks-title">{copy.tasks.title}</h2><p>{copy.tasks.description}</p></header></div><LandingTaskPreview copy={copy.tasks.preview} locale={locale} /></section>

      <section className={styles.practiceSection} id="practice" aria-labelledby="practice-title"><header className={styles.sectionHeading}><p className={styles.kicker}>{copy.practice.kicker}</p><h2 id="practice-title">{copy.practice.title}</h2><p>{copy.practice.description}</p></header><div className={styles.practiceShowcase}><figure className={styles.drillFigure} aria-label={copy.practice.drill}><div className={styles.drillTop}><span><Icon name="bolt" />{copy.practice.drill}</span><b>{copy.practice.example}</b></div><div className={styles.drillConcept}><small>{copy.practice.concept}</small><strong>{copy.practice.conceptName}</strong></div><div className={styles.drillPrompt}><span>{copy.practice.questionLabel}</span><h3>{copy.practice.question}</h3><p><b>{copy.practice.criterionLabel}</b> · {copy.practice.criterion}</p></div><div className={styles.drillResponse}><span>{copy.practice.responseLabel}</span><p>{copy.practice.responsePlaceholder}</p></div><figcaption>{copy.practice.evaluation}</figcaption></figure><aside className={styles.projectOption}><Icon name="sparkles" /><span>{copy.practice.project}</span><h3>{copy.practice.projectTitle}</h3><p>{copy.practice.projectDescription}</p><div><span>{locale === 'pt-BR' ? 'Objetivo' : 'Goal'}</span><span>{locale === 'pt-BR' ? 'Entregáveis' : 'Deliverables'}</span><span>{locale === 'pt-BR' ? 'Primeiro passo' : 'First step'}</span></div></aside></div></section>

      <section className={styles.pricing} id="plans" aria-labelledby="pricing-title"><header className={styles.sectionHeading}><p className={styles.kicker}>{copy.pricing.kicker}</p><h2 id="pricing-title">{copy.pricing.title}</h2><p>{paymentsEnabled ? copy.pricing.description : copy.pricing.freeDescription}</p></header><div className={`${styles.planGrid} ${paymentsEnabled ? '' : styles.planGridFree}`}>{copy.plans.filter((plan) => paymentsEnabled || plan.id === 'FREE').map((plan) => <article className={`${styles.planCard} ${plan.featured ? styles.featuredPlan : ''}`} key={plan.id}><header>{plan.featured && <span className={styles.planBadge}>{copy.pricing.featuredBadge}</span>}<h3>{plan.name}</h3><span>{plan.description}</span></header><div className={styles.price}><strong>{plan.price}</strong><span>{plan.duration}</span></div><div className={styles.credits}><b>{plan.dailyLimit}</b>{plan.periodLimit && <span>{plan.periodLimit}</span>}{plan.id !== 'FREE' && <small>{copy.pricing.simultaneousLimits}</small>}</div><Link className={plan.featured ? styles.primaryAction : styles.planAction} href={planLoginHref(plan.id)} data-plan-id={plan.id}>{plan.action} <Icon name="chevron" /></Link><small className={styles.planFootnote}>{plan.footnote}</small></article>)}</div><p className={styles.creditNote}>{copy.pricing.creditNote}</p></section>

      <section className={styles.faq} id="faq" aria-labelledby="faq-title"><header className={`${styles.sectionHeading} ${styles.centered}`}><p className={styles.kicker}>{copy.faq.kicker}</p><h2 id="faq-title">{copy.faq.title}</h2></header><div className={styles.faqList}>{copy.faq.items.filter((item) => paymentsEnabled || !item.paid).map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>

      <section className={styles.finalCta} aria-labelledby="final-cta-title"><p className={styles.kicker}>{copy.finalCta.kicker}</p><h2 id="final-cta-title">{copy.finalCta.title}</h2><p className={styles.finalDescription}>{copy.finalCta.description}</p><Link className={styles.primaryAction} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.finalCta.action} <Icon name="chevron" /></Link></section>
    </main>

    <footer className={styles.footer}><div className={styles.footerInner}><div className={styles.footerTop}><BrandLink href="/" label={copy.brandLabel} className={styles.brand} /><LandingNavigation copy={copy} label={copy.footer.navigationLabel} /><div className={styles.footerActions}><a href="#plans">{copy.nav.plans}</a><Link href="/login">{copy.signIn}</Link></div></div><div className={styles.footerBottom}><div className={styles.footerPreferences}><SelectField compact icon={null} label={copy.languageLabel} value={locale} options={[{ value: 'pt-BR', label: 'PT' }, { value: 'en-US', label: 'EN' }]} onValueChange={(value) => setLocale(value === 'en-US' ? 'en-US' : 'pt-BR')} /><ThemeToggle lightLabel={copy.lightTheme} darkLabel={copy.darkTheme} /></div><p>{copy.footer.description}</p><span className={styles.footerMeta}>{copy.footer.principles}</span><small className={styles.copyright}>© {new Date().getFullYear()} MasterMe</small></div></div></footer>
  </div>
}
