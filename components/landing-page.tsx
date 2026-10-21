'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon, type IconName } from '../lib/icons'
import { loginHrefFor, planLoginHref, type PlanId } from '../lib/auth-redirect'
import type { Locale } from '../lib/i18n'
import { ThemeToggle } from './theme-toggle'
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

type MapNode = { kicker: string; title: string; state: string }
type PathCard = { tag: string; icon: IconName; title: string; description: string; footer: string }
type CycleStep = { tag: string; title: string; description: string }
type TaskItem = { title: string; date: string; material: string; state: string; done?: boolean }

type LandingCopy = {
  skipContent: string
  brandLabel: string
  navigationLabel: string
  languageLabel: string
  lightTheme: string
  darkTheme: string
  signIn: string
  startFree: string
  nav: { study: string; tasks: string; analyze: string; create: string; plans: string }
  hero: {
    eyebrow: string
    titleLead: string
    titleEmphasis: string
    description: string
    primaryAction: string
    secondaryAction: string
    drop: { kicker: string; formats: string; title: string; description: string; example: string }
  }
  cycle: { kicker: string; title: string; description: string; steps: readonly CycleStep[] }
  map: {
    kicker: string
    title: string
    description: string
    figureLabel: string
    exampleBadge: string
    graphLabel: string
    graphFooter: string
    nodes: readonly MapNode[]
    panelLabel: string
    focusTitle: string
    sectionBadge: string
    citationLabel: string
    citation: string
    questionLabel: string
    question: string
    diagnosisLabel: string
    diagnosisLead: string
    diagnosisGap: string
    diagnosisTail: string
    panelFooter: string
  }
  tasks: {
    kicker: string
    title: string
    description: string
    points: readonly string[]
    figureLabel: string
    figureCaption: string
    items: readonly TaskItem[]
    calendar: { month: string; weekdays: readonly string[]; selectedDay: number; markedDays: readonly number[] }
  }
  paths: { kicker: string; title: string; description: string; cards: readonly PathCard[] }
  create: {
    kicker: string
    title: string
    description: string
    points: readonly string[]
    figureLabel: string
    figureCaption: string
    badge: string
    briefLabel: string
    briefTitle: string
    briefMeta: string
    goalLabel: string
    goal: string
    deliverablesLabel: string
    deliverables: readonly string[]
    firstStepLabel: string
    firstStep: string
    briefFooter: string
  }
  pricing: { kicker: string; title: string; description: string; freeDescription: string; featuredBadge: string; simultaneousLimits: string; creditNote: string }
  plans: readonly MarketingPlan[]
  faq: { kicker: string; title: string; items: readonly { question: string; answer: string; paid?: boolean }[] }
  finalCta: { kicker: string; title: string; description: string; action: string }
  footer: { navigationLabel: string; description: string; principles: string; study: string; tasks: string; analyze: string; create: string; plans: string; signIn: string }
}

const landingCopy = {
  'pt-BR': {
    skipContent: 'Pular para o conteúdo principal',
    brandLabel: 'MasterMe, página inicial',
    navigationLabel: 'Seções da página',
    languageLabel: 'Idioma',
    lightTheme: 'Usar tema claro',
    darkTheme: 'Usar tema escuro',
    signIn: 'Entrar',
    startFree: 'Começar grátis',
    nav: { study: 'Estudar', tasks: 'Tarefas', analyze: 'Analisar', create: 'Criar', plans: 'Planos' },
    hero: {
      eyebrow: 'Ambiente pessoal de aprendizagem para autodidatas técnicos',
      titleLead: 'Organize o que estudar.',
      titleEmphasis: 'Descubra o que realmente aprendeu.',
      description: 'Reúna PDFs, artigos e anotações em uma biblioteca privada. Escolha um assunto, explique o que entendeu e veja o que precisa revisar. Depois, pratique com um pequeno projeto.',
      primaryAction: 'Criar meu espaço grátis',
      secondaryAction: 'Ver como funciona',
      drop: {
        kicker: 'SEU MATERIAL, PRESERVADO',
        formats: 'PDF · MD · TXT · TEXTO COLADO',
        title: 'Traga um PDF ou cole um trecho de documentação',
        description: 'O texto original fica como referência de cada conceito, pergunta e diagnóstico.',
        example: 'Comece pelo material que você já está estudando',
      },
    },
    cycle: {
      kicker: 'COMO FUNCIONA',
      title: 'Quatro áreas. O mesmo material.',
      description: 'Estudar, Tarefas, Analisar e Criar compartilham a mesma biblioteca privada. O que você organiza em uma área vira contexto nas outras.',
      steps: [
        { tag: 'ESTUDAR', title: 'Reúna e explique', description: 'Envie PDF, Markdown ou TXT, ou cole um texto. Escolha um conceito e responda com suas palavras.' },
        { tag: 'TAREFAS', title: 'Planeje quando voltar', description: 'Crie tarefas com data, ligue-as a um material e ajuste o calendário quando a semana mudar.' },
        { tag: 'ANALISAR', title: 'Veja o que você entendeu', description: 'O mapa liga os assuntos do material. Depois da sua resposta, você vê o que explicou bem e o que precisa revisar.' },
        { tag: 'CRIAR', title: 'Crie um projeto para praticar', description: 'Crie um projeto curto para praticar os assuntos que você ainda não domina. Faça o projeto no seu editor.' },
      ],
    },
    map: {
      kicker: 'COMO FUNCIONA O MAPA',
      title: 'Veja como os assuntos se ligam',
      description: 'O mapa mostra os assuntos encontrados no seu material. Abra um assunto, responda a uma pergunta e veja qual parte da explicação precisa de revisão.',
      figureLabel: 'Exemplo de mapa de conhecimento e diagnóstico',
      exampleBadge: 'EXEMPLO ILUSTRATIVO',
      graphLabel: 'EXEMPLO COM UM TEXTO SOBRE BANCO DE DADOS',
      graphFooter: 'Você pode abrir qualquer assunto do mapa',
      nodes: [
        { kicker: 'ASSUNTO', title: 'Índices no banco de dados', state: 'Ajudam a encontrar registros' },
        { kicker: 'ASSUNTO', title: 'Índice com duas colunas', state: 'Usa uma ordem definida' },
        { kicker: 'ASSUNTO', title: 'Busca por cliente ou por data', state: 'A ordem muda o resultado' },
        { kicker: 'ASSUNTO', title: 'Leitura sem índice', state: 'Compara os registros um a um' },
      ],
      panelLabel: 'DIAGNÓSTICO',
      focusTitle: 'Índice com duas colunas',
      sectionBadge: 'EXEMPLO',
      citationLabel: 'TRECHO DO MATERIAL · EXEMPLO',
      citation: '“Um índice criado primeiro por cliente e depois por data ajuda a buscar os pedidos de um cliente.”',
      questionLabel: 'PERGUNTA SOBRE O TEXTO',
      question: 'Se o índice começa por cliente, por que ele não ajuda tanto numa busca feita apenas pela data?',
      diagnosisLabel: 'O QUE REVISAR',
      diagnosisLead: 'Sua resposta explicou como encontrar registros, mas',
      diagnosisGap: 'não explicou por que a ordem das colunas importa',
      diagnosisTail: '. Como o índice começa por cliente, ele ajuda na busca por cliente. Uma busca só por data não usa essa primeira coluna.',
      panelFooter: 'O diagnóstico real usa o seu material, não este exemplo.',
    },
    tasks: {
      kicker: 'PLANEJAMENTO',
      title: 'Decida o que estudar agora e quando revisar.',
      description: 'Transforme conceitos em tarefas com data, ligue cada uma a um material e mova o compromisso no calendário quando a semana mudar.',
      points: [
        'Data-alvo e material opcional em cada tarefa',
        'Mude a data da tarefa pelo calendário',
        'Sugestões opcionais a partir dos seus diagnósticos',
      ],
      figureLabel: 'Exemplo de tarefas e calendário',
      figureCaption: 'Exemplo ilustrativo · suas tarefas e datas substituem estas.',
      items: [
        { title: 'Revisar índices compostos', date: '12 out', material: 'Banco de dados', state: 'Concluída', done: true },
        { title: 'Explicar isolamento de transações', date: '22 out', material: 'Banco de dados', state: 'A fazer' },
        { title: 'Praticar caching HTTP', date: 'sem data', material: 'sem material', state: 'A fazer' },
      ],
      calendar: { month: 'OUTUBRO', weekdays: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'], selectedDay: 22, markedDays: [12, 22] },
    },
    paths: {
      kicker: 'QUATRO FORMAS DE ESTUDAR',
      title: 'Você escolhe a profundidade. Nada bloqueia o próximo passo.',
      description: 'Explorar, explicar, testar limites e praticar são ações independentes. O histórico registra cada uma separadamente.',
      cards: [
        { tag: 'MAPA', icon: 'book', title: 'Explore os assuntos', description: 'Abra um assunto e veja quais outros se relacionam a ele. Você pode abrir os assuntos na ordem que quiser.', footer: 'Sem bloqueios' },
        { tag: 'SÍNTESE', icon: 'idea', title: 'Explicar com diagnóstico', description: 'Responda com suas palavras e veja o que faltou na sua explicação, com base no material.', footer: 'Evidência de compreensão' },
        { tag: 'ESTRESSE', icon: 'bolt', title: 'Testar um caso-limite', description: 'Opcional, só depois de uma explicação aprovada. Aprofunda sem revogar a aprovação.', footer: 'Opt-in voluntário' },
        { tag: 'CÓDIGO', icon: 'sparkles', title: 'Projeto de prática', description: 'Crie um projeto curto para praticar os assuntos que precisa revisar. Faça no seu editor.', footer: 'Disponível após a extração' },
      ],
    },
    create: {
      kicker: 'CRIAR',
      title: 'Pratique com um projeto curto.',
      description: 'Escolha os assuntos que quer praticar. O MasterMe sugere um projeto com objetivo e primeiros passos. Você escreve o código no seu editor.',
      points: [
        'Escolha até cinco assuntos ou aceite a sugestão do MasterMe',
        'Projeto com objetivo, o que criar e por onde começar',
        'Projetos anteriores continuam disponíveis',
      ],
      figureLabel: 'Exemplo de projeto de prática',
      figureCaption: 'Exemplo ilustrativo. O projeto real usa os assuntos que você precisa revisar.',
      badge: 'EXEMPLO',
      briefLabel: 'PROJETO DE PRÁTICA',
      briefTitle: 'Índices compostos em consultas reais',
      briefMeta: 'Dois assuntos escolhidos para praticar',
      goalLabel: 'OBJETIVO',
      goal: 'Comparar o plano de consulta antes e depois de criar um índice composto.',
      deliverablesLabel: 'ENTREGÁVEIS',
      deliverables: ['Script de criação do índice', 'Duas consultas com EXPLAIN, antes e depois'],
      firstStepLabel: 'PRIMEIRO PASSO',
      firstStep: 'Criar a tabela de pedidos e inserir uma amostra local.',
      briefFooter: 'Você faz o projeto no seu editor',
    },
    pricing: {
      kicker: 'ACESSO TRANSPARENTE',
      title: 'Comece grátis. Amplie só se precisar.',
      description: 'Planos pagos são compras únicas. Sem assinatura e sem renovação automática.',
      freeDescription: 'Nesta fase, apenas o plano gratuito está disponível.',
      featuredBadge: 'MAIOR HORIZONTE',
      simultaneousLimits: 'Os limites diário e do período valem simultaneamente.',
      creditNote: 'No plano Livre, cada tentativa enviada ao Gemini consome 1 crédito. O saldo renova diariamente; tentativas de fallback também contam. A capacidade do provedor é compartilhada.',
    },
    plans: [
      { id: 'FREE', name: 'Livre', price: 'R$ 0', duration: 'sem prazo', dailyLimit: '100 créditos por dia', periodLimit: '', description: 'Para conhecer o método com seu próprio material.', action: 'Começar gratuitamente', footnote: 'Não exige pagamento.' },
      { id: 'ESSENTIAL', name: 'Essencial', price: 'R$ 29,90', duration: 'por 30 dias', dailyLimit: '120 créditos por dia', periodLimit: '1.500 créditos por vigência', description: 'Para transformar uma fase intensa de estudo em prática.', action: 'Escolher Essencial', footnote: 'Pagamento único · sem renovação automática.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'por 365 dias', dailyLimit: '180 créditos por dia', periodLimit: '15.000 créditos por vigência', description: 'Para manter uma biblioteca ativa ao longo do ano.', action: 'Escolher Pro', footnote: 'Pagamento único · sem renovação automática.', featured: true },
    ],
    faq: {
      kicker: 'SEM LETRAS MIÚDAS',
      title: 'Perguntas frequentes',
      items: [
        { question: 'Os planos pagos são assinaturas?', answer: 'Não. Essencial e Pro são pagamentos únicos para o período informado e não possuem renovação automática.', paid: true },
        { question: 'A IA responde às perguntas por mim?', answer: 'Não. Ela organiza seu material e diagnostica sua explicação. O raciocínio continua sendo seu.' },
        { question: 'Preciso seguir uma ordem no mapa?', answer: 'Não. As relações dão contexto, mas você pode abrir qualquer conceito ou gerar uma prática quando quiser.' },
        { question: 'Quais arquivos posso enviar?', answer: 'Texto colado, PDF com texto selecionável, Markdown e TXT. PDFs digitalizados sem texto não são aceitos.' },
        { question: 'Quem acessa o meu material?', answer: 'Só você. Cada conta lê apenas os próprios materiais, tarefas e histórico.' },
      ],
    },
    finalCta: {
      kicker: 'SEU PRÓXIMO MATERIAL PODE VIRAR PRÁTICA',
      title: 'Pronto para estudar com rigor?',
      description: 'Sem métricas de vaidade. Apenas compreensão testada contra fatos.',
      action: 'Criar meu primeiro mapa',
    },
    footer: {
      navigationLabel: 'Navegação do rodapé',
      description: 'Ambiente pessoal de aprendizagem para matérias técnicas.',
      principles: 'Fonte preservada · Sem rastreamento de conteúdo',
      study: 'Estudar',
      tasks: 'Tarefas',
      analyze: 'Analisar',
      create: 'Criar',
      plans: 'Planos',
      signIn: 'Entrar',
    },
  },
  'en-US': {
    skipContent: 'Skip to main content',
    brandLabel: 'MasterMe, home page',
    navigationLabel: 'Page sections',
    languageLabel: 'Language',
    lightTheme: 'Use light theme',
    darkTheme: 'Use dark theme',
    signIn: 'Sign in',
    startFree: 'Start free',
    nav: { study: 'Study', tasks: 'Tasks', analyze: 'Analyze', create: 'Create', plans: 'Plans' },
    hero: {
      eyebrow: 'A personal learning environment for self-taught engineers',
      titleLead: 'Organize what to study.',
      titleEmphasis: 'Discover what you really learned.',
      description: 'Bring PDFs, articles, and notes into a private library. Pick a topic, explain what you understood, and see what to review. Then practice with a small project.',
      primaryAction: 'Create my free space',
      secondaryAction: 'See how it works',
      drop: {
        kicker: 'YOUR MATERIAL, PRESERVED',
        formats: 'PDF · MD · TXT · PASTED TEXT',
        title: 'Bring a PDF or paste a piece of documentation',
        description: 'The original text stays as the reference behind every concept, question, and diagnostic.',
        example: 'Start with the material you are already studying',
      },
    },
    cycle: {
      kicker: 'HOW IT WORKS',
      title: 'Four areas. The same material.',
      description: 'Study, Tasks, Analyze, and Create share the same private library. What you organize in one area becomes context in the others.',
      steps: [
        { tag: 'STUDY', title: 'Bring it in and explain', description: 'Upload a PDF, Markdown, or TXT file, or paste text. Pick a concept and answer in your own words.' },
        { tag: 'TASKS', title: 'Plan when to come back', description: 'Create tasks with a target date, attach a material, and move the date when the week changes.' },
        { tag: 'ANALYZE', title: 'See what you understood', description: 'The map links topics in the material. After you answer, you see what you explained well and what needs review.' },
        { tag: 'CREATE', title: 'Create a project for practice', description: 'Create a small project to practice topics you still need to learn. Build it in your own editor.' },
      ],
    },
    map: {
      kicker: 'HOW THE MAP WORKS',
      title: 'See how the topics connect',
      description: 'The map shows topics found in your material. Open a topic, answer a question, and see which part of your explanation needs review.',
      figureLabel: 'Knowledge map and diagnostic example',
      exampleBadge: 'ILLUSTRATIVE EXAMPLE',
      graphLabel: 'EXAMPLE FROM A DATABASE ARTICLE',
      graphFooter: 'You can open any topic on the map',
      nodes: [
        { kicker: 'TOPIC', title: 'Database indexes', state: 'Help find records' },
        { kicker: 'TOPIC', title: 'Two-column index', state: 'Uses a defined order' },
        { kicker: 'TOPIC', title: 'Search by customer or date', state: 'Column order changes the result' },
        { kicker: 'TOPIC', title: 'Reading without an index', state: 'Checks records one by one' },
      ],
      panelLabel: 'DIAGNOSTIC',
      focusTitle: 'Two-column index',
      sectionBadge: 'EXAMPLE',
      citationLabel: 'MATERIAL EXCERPT · EXAMPLE',
      citation: '“An index created first by customer and then by date helps find a customer’s orders.”',
      questionLabel: 'QUESTION ABOUT THE TEXT',
      question: 'If the index starts with customer, why does it help less when searching only by date?',
      diagnosisLabel: 'WHAT TO REVIEW',
      diagnosisLead: 'Your answer explained how to find records, but',
      diagnosisGap: 'did not explain why column order matters',
      diagnosisTail: '. Because the index starts with customer, it helps a customer search. A date-only search skips that first column.',
      panelFooter: 'The real diagnostic uses your material, not this example.',
    },
    tasks: {
      kicker: 'PLANNING',
      title: 'Decide what to study now and when to review it.',
      description: 'Turn concepts into dated tasks, attach each one to a material, and move the commitment on the calendar when the week changes.',
      points: [
        'A target date and an optional material on every task',
        'Change a task date on the calendar',
        'Optional suggestions drawn from your diagnostics',
      ],
      figureLabel: 'Tasks and calendar example',
      figureCaption: 'Illustrative example · your tasks and dates replace these.',
      items: [
        { title: 'Review composite indexes', date: 'Oct 12', material: 'Databases', state: 'Done', done: true },
        { title: 'Explain transaction isolation', date: 'Oct 22', material: 'Databases', state: 'To do' },
        { title: 'Practice HTTP caching', date: 'no date', material: 'no material', state: 'To do' },
      ],
      calendar: { month: 'OCTOBER', weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], selectedDay: 22, markedDays: [12, 22] },
    },
    paths: {
      kicker: 'FOUR WAYS TO STUDY',
      title: 'You choose the depth. Nothing blocks the next step.',
      description: 'Exploring, explaining, testing limits, and practicing are independent actions. Your history records each one separately.',
      cards: [
        { tag: 'MAP', icon: 'book', title: 'Explore the topics', description: 'Open a topic and see which other topics relate to it. You can explore them in any order.', footer: 'No locks' },
        { tag: 'SYNTHESIS', icon: 'idea', title: 'Explain with a diagnostic', description: 'Answer in your own words and see what your explanation missed, based on the material.', footer: 'Evidence of understanding' },
        { tag: 'STRESS', icon: 'bolt', title: 'Test an edge case', description: 'Optional, only after an approved explanation. It goes deeper without revoking the approval.', footer: 'Voluntary opt-in' },
        { tag: 'CODE', icon: 'sparkles', title: 'Practice project', description: 'Create a small project to practice topics you need to review. Build it in your editor.', footer: 'Available after extraction' },
      ],
    },
    create: {
      kicker: 'CREATE',
      title: 'Practice with a small project.',
      description: 'Choose the topics you want to practice. MasterMe suggests a project with a goal and first steps. You write the code in your own editor.',
      points: [
        'Choose up to five topics or accept a suggestion from MasterMe',
        'A project with a goal, what to build, and where to start',
        'Previous projects stay available',
      ],
      figureLabel: 'Practice project example',
      figureCaption: 'Illustrative example. The real project uses topics you need to review.',
      badge: 'EXAMPLE',
      briefLabel: 'PRACTICE PROJECT',
      briefTitle: 'Composite indexes in real queries',
      briefMeta: 'Two topics chosen for practice',
      goalLabel: 'GOAL',
      goal: 'Compare the query plan before and after creating a composite index.',
      deliverablesLabel: 'DELIVERABLES',
      deliverables: ['Index creation script', 'Two EXPLAIN queries, before and after'],
      firstStepLabel: 'FIRST STEP',
      firstStep: 'Create the orders table and insert a local sample.',
      briefFooter: 'Build the project in your own editor',
    },
    pricing: {
      kicker: 'TRANSPARENT ACCESS',
      title: 'Start free. Expand only if you need to.',
      description: 'Paid plans are one-time purchases. No subscription and no automatic renewal.',
      freeDescription: 'At this stage, only the free plan is available.',
      featuredBadge: 'LONGEST HORIZON',
      simultaneousLimits: 'Daily and period limits apply simultaneously.',
      creditNote: 'On the Free plan, each attempt sent to Gemini uses 1 credit. The balance resets daily; fallback attempts also count. Provider capacity is shared.',
    },
    plans: [
      { id: 'FREE', name: 'Free', price: 'R$ 0', duration: 'no expiration', dailyLimit: '100 credits per day', periodLimit: '', description: 'Explore the method with your own material.', action: 'Start for free', footnote: 'No payment required.' },
      { id: 'ESSENTIAL', name: 'Essential', price: 'R$ 29.90', duration: 'for 30 days', dailyLimit: '120 credits per day', periodLimit: '1,500 credits per access period', description: 'Turn an intensive study phase into deliberate practice.', action: 'Choose Essential', footnote: 'One-time payment · no automatic renewal.' },
      { id: 'PRO', name: 'Pro', price: 'R$ 249', duration: 'for 365 days', dailyLimit: '180 credits per day', periodLimit: '15,000 credits per access period', description: 'Keep an active library throughout the year.', action: 'Choose Pro', footnote: 'One-time payment · no automatic renewal.', featured: true },
    ],
    faq: {
      kicker: 'NO FINE PRINT',
      title: 'Frequently asked questions',
      items: [
        { question: 'Are paid plans subscriptions?', answer: 'No. Essential and Pro are one-time payments for the stated period and do not renew automatically.', paid: true },
        { question: 'Does the AI answer questions for me?', answer: 'No. It organizes your material and diagnoses your explanation. The reasoning remains yours.' },
        { question: 'Do I have to follow the map in order?', answer: 'No. Relationships provide context, but you can open any concept or generate a practice project whenever you want.' },
        { question: 'Which files can I upload?', answer: 'Pasted text, selectable-text PDF, Markdown, and TXT. Scanned PDFs without selectable text are rejected.' },
        { question: 'Who can access my material?', answer: 'Only you. Each account reads just its own materials, tasks, and history.' },
      ],
    },
    finalCta: {
      kicker: 'YOUR NEXT MATERIAL CAN BECOME PRACTICE',
      title: 'Ready to study with rigor?',
      description: 'No vanity metrics. Just understanding tested against facts.',
      action: 'Create my first map',
    },
    footer: {
      navigationLabel: 'Footer navigation',
      description: 'A personal learning environment for technical subjects.',
      principles: 'Source preserved · No content tracking',
      study: 'Study',
      tasks: 'Tasks',
      analyze: 'Analyze',
      create: 'Create',
      plans: 'Plans',
      signIn: 'Sign in',
    },
  },
} satisfies Record<Locale, LandingCopy>

// Presentation-only values. The API remains authoritative for price, credit,
// eligibility, and checkout state.
export const marketingPlans: readonly MarketingPlan[] = landingCopy['pt-BR'].plans

const landingTabs = [
  { key: 'study', href: '#estudar', icon: 'book' },
  { key: 'tasks', href: '#tarefas', icon: 'library' },
  { key: 'analyze', href: '#mapa', icon: 'brain' },
  { key: 'create', href: '#criar', icon: 'sparkles' },
] as const

function LandingNavigation({ copy, label }: { copy: LandingCopy; label: string }) {
  return <nav className={styles.navigation} aria-label={label}>
    {landingTabs.map((tab) => <a href={tab.href} key={tab.key}><span className={styles.navIcon}><Icon name={tab.icon} /></span><span className={styles.navLabel}>{copy.nav[tab.key]}</span></a>)}
  </nav>
}

export function LandingPage({ paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true' }: { paymentsEnabled?: boolean } = {}) {
  const [locale, setLocaleState] = useState<Locale>('pt-BR')

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
  return (
    <div className={styles.landing}>
      <a className={styles.skipLink} href="#conteudo-principal">{copy.skipContent}</a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label={copy.brandLabel}>
            <span className={styles.brandMark} aria-hidden="true">M</span>
            <span className={styles.brandName}>MasterMe</span>
          </Link>
          <LandingNavigation copy={copy} label={copy.navigationLabel} />
          <div className={styles.headerActions}>
            <a className={styles.plansLink} href="#planos">{copy.nav.plans}</a>
            <select className={styles.localeSelect} aria-label={copy.languageLabel} value={locale} onChange={(event) => setLocale(event.target.value === 'en-US' ? 'en-US' : 'pt-BR')}>
              <option value="pt-BR">PT</option><option value="en-US">EN</option>
            </select>
            <ThemeToggle lightLabel={copy.lightTheme} darkLabel={copy.darkTheme} />
            <Link className={styles.signIn} href={loginHrefFor('/estudar')}>{copy.signIn}</Link>
            <Link className={`${styles.primaryAction} ${styles.headerAction}`} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.startFree}</Link>
          </div>
        </div>
      </header>

      <main id="conteudo-principal" className={styles.main}>
        <section className={styles.hero} aria-labelledby="landing-title">
          <p className={styles.eyebrow}>{copy.hero.eyebrow}</p>
          <h1 id="landing-title">{copy.hero.titleLead}<br /><em>{copy.hero.titleEmphasis}</em></h1>
          <p className={styles.heroDescription}>{copy.hero.description}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.hero.primaryAction} <Icon name="chevron" /></Link>
            <a className={styles.secondaryAction} href="#como-funciona">{copy.hero.secondaryAction}</a>
          </div>
          <Link className={styles.dropCard} href={loginHrefFor('/estudar')}>
            <span className={styles.dropMeta}><span>{copy.hero.drop.kicker}</span><span>{copy.hero.drop.formats}</span></span>
            <strong className={styles.dropTitle}>{copy.hero.drop.title}</strong>
            <span className={styles.dropDescription}>{copy.hero.drop.description}</span>
            <span className={styles.dropExample}>{copy.hero.drop.example} <Icon name="chevron" /></span>
          </Link>
        </section>

        <section className={styles.cycle} id="como-funciona" aria-labelledby="cycle-title">
          <header className={styles.sectionHeading}>
            <p className={styles.kicker}>{copy.cycle.kicker}</p>
            <h2 id="cycle-title">{copy.cycle.title}</h2>
            <p>{copy.cycle.description}</p>
          </header>
          <ol className={styles.cycleList}>
            {copy.cycle.steps.map((step, index) => <li key={step.tag}>
              <span className={styles.cycleNumber}>0{index + 1}</span>
              <span className={styles.cycleTag}>{step.tag}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>)}
          </ol>
        </section>

        <section className={styles.map} id="mapa" aria-labelledby="map-title">
          <header className={styles.sectionHeading}>
            <p className={styles.kicker}>{copy.map.kicker}</p>
            <h2 id="map-title">{copy.map.title}</h2>
            <p>{copy.map.description}</p>
          </header>

          <figure className={styles.mapFigure} aria-label={copy.map.figureLabel}>
            <div className={styles.graphPanel}>
              <div className={styles.graphHeader}><span>{copy.map.graphLabel}</span></div>
              <div className={styles.graphCanvas}>
                <ul className={styles.graphNodes}>
                  {copy.map.nodes.map((node) => <li className={styles.graphNode} key={node.title}>
                    <span className={styles.nodeKicker}>{node.kicker}</span>
                    <strong className={styles.nodeTitle}>{node.title}</strong>
                    <span className={styles.nodeState}>{node.state}</span>
                  </li>)}
                </ul>
              </div>
              <p className={styles.graphFooter}>{copy.map.graphFooter}</p>
            </div>

            <aside className={styles.inspector} aria-labelledby="inspector-title">
              <div className={styles.inspectorHeader}>
                <div><span className={styles.inspectorKicker}>{copy.map.panelLabel}</span><h3 id="inspector-title">{copy.map.focusTitle}</h3></div>
                <span className={styles.sectionBadge}>{copy.map.sectionBadge}</span>
              </div>
              <div className={styles.citation}>
                <span className={styles.citationLabel}><Icon name="document" />{copy.map.citationLabel}</span>
                <blockquote>{copy.map.citation}</blockquote>
              </div>
              <div className={styles.questionBlock}>
                <span className={styles.questionLabel}>{copy.map.questionLabel}</span>
                <p>{copy.map.question}</p>
              </div>
              <div className={styles.diagnosis}>
                <span className={styles.diagnosisLabel}><Icon name="warning" />{copy.map.diagnosisLabel}</span>
                <p>{copy.map.diagnosisLead} <strong>{copy.map.diagnosisGap}</strong>{copy.map.diagnosisTail}</p>
              </div>
              <p className={styles.panelFooter}>{copy.map.exampleBadge} · {copy.map.panelFooter}</p>
            </aside>
          </figure>
        </section>

        <section className={styles.tasks} id="tarefas" aria-labelledby="tasks-title">
          <div className={styles.tasksCopy}>
            <header className={styles.sectionHeading}>
              <p className={styles.kicker}>{copy.tasks.kicker}</p>
              <h2 id="tasks-title">{copy.tasks.title}</h2>
              <p>{copy.tasks.description}</p>
            </header>
            <ul className={styles.checkList}>{copy.tasks.points.map((point) => <li key={point}><Icon name="check" />{point}</li>)}</ul>
          </div>
          <figure className={styles.tasksFigure} aria-label={copy.tasks.figureLabel}>
            <div className={styles.tasksMock} aria-hidden="true">
              <ul className={styles.taskList}>
                {copy.tasks.items.map((task) => <li key={task.title} className={task.done ? styles.taskDone : ''}>
                  <span className={styles.taskCheck}>{task.done ? '✓' : ''}</span>
                  <div><strong>{task.title}</strong><small>{task.date} · {task.material}</small></div>
                  <span className={styles.taskState}>{task.state}</span>
                </li>)}
              </ul>
              <div className={styles.calendarMock}>
                <div className={styles.calendarHeader}><span>{copy.tasks.calendar.month}</span><span className={styles.calendarNav}>‹ ›</span></div>
                <div className={styles.calendarGrid}>
                  {copy.tasks.calendar.weekdays.map((day, index) => <span className={styles.weekday} key={`${day}-${index}`}>{day}</span>)}
                  {calendarCells(copy.tasks.calendar.selectedDay, copy.tasks.calendar.markedDays).map((cell) => <span
                    key={cell.key}
                    className={`${styles.day} ${cell.selected ? styles.selectedDay : ''} ${cell.marked ? styles.markedDay : ''}`}
                  >{cell.day ?? ''}</span>)}
                </div>
              </div>
            </div>
            <figcaption>{copy.tasks.figureCaption}</figcaption>
          </figure>
        </section>

        <section className={styles.paths} id="estudar" aria-labelledby="paths-title">
          <header className={`${styles.sectionHeading} ${styles.centered}`}>
            <p className={styles.kicker}>{copy.paths.kicker}</p>
            <h2 id="paths-title">{copy.paths.title}</h2>
            <p>{copy.paths.description}</p>
          </header>
          <div className={styles.pathGrid}>
            {copy.paths.cards.map((card) => <article key={card.title}>
              <span className={styles.pathIcon}><Icon name={card.icon} /></span>
              <span className={styles.pathTag}>{card.tag}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <span className={styles.pathFoot}>{card.footer}</span>
            </article>)}
          </div>
        </section>

        <section className={styles.create} id="criar" aria-labelledby="create-title">
          <div className={styles.createCopy}>
            <header className={styles.sectionHeading}>
              <p className={styles.kicker}>{copy.create.kicker}</p>
              <h2 id="create-title">{copy.create.title}</h2>
              <p>{copy.create.description}</p>
            </header>
            <ul className={styles.checkList}>{copy.create.points.map((point) => <li key={point}><Icon name="check" />{point}</li>)}</ul>
          </div>
          <figure className={styles.createFigure} aria-label={copy.create.figureLabel}>
            <div className={styles.brief} aria-hidden="true">
              <div className={styles.briefHeader}>
                <span className={styles.briefKicker}>{copy.create.briefLabel}</span>
                <span className={styles.sectionBadge}>{copy.create.badge}</span>
              </div>
              <h3>{copy.create.briefTitle}</h3>
              <p className={styles.briefMeta}>{copy.create.briefMeta}</p>
              <div className={styles.briefBlock}>
                <span className={styles.briefLabel}>{copy.create.goalLabel}</span>
                <p>{copy.create.goal}</p>
              </div>
              <div className={styles.briefBlock}>
                <span className={styles.briefLabel}>{copy.create.deliverablesLabel}</span>
                <ul>{copy.create.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className={styles.briefBlock}>
                <span className={styles.briefLabel}>{copy.create.firstStepLabel}</span>
                <p>{copy.create.firstStep}</p>
              </div>
              <p className={styles.briefFooter}>{copy.create.briefFooter}</p>
            </div>
            <figcaption>{copy.create.figureCaption}</figcaption>
          </figure>
        </section>

        <section className={styles.pricing} id="planos" aria-labelledby="pricing-title">
          <header className={styles.sectionHeading}>
            <p className={styles.kicker}>{copy.pricing.kicker}</p>
            <h2 id="pricing-title">{copy.pricing.title}</h2>
            <p>{paymentsEnabled ? copy.pricing.description : copy.pricing.freeDescription}</p>
          </header>
          <div className={`${styles.planGrid} ${paymentsEnabled ? '' : styles.planGridFree}`}>
            {copy.plans.filter((plan) => paymentsEnabled || plan.id === 'FREE').map((plan) => <article className={`${styles.planCard} ${plan.featured ? styles.featuredPlan : ''}`} key={plan.id}>
              <header>
                {plan.featured && <span className={styles.planBadge}>{copy.pricing.featuredBadge}</span>}
                <h3>{plan.name}</h3>
                <span>{plan.description}</span>
              </header>
              <div className={styles.price}><strong>{plan.price}</strong><span>{plan.duration}</span></div>
              <div className={styles.credits}><b>{plan.dailyLimit}</b>{plan.periodLimit && <span>{plan.periodLimit}</span>}{plan.id !== 'FREE' && <small>{copy.pricing.simultaneousLimits}</small>}</div>
              <Link className={plan.featured ? styles.primaryAction : styles.planAction} href={planLoginHref(plan.id)} data-plan-id={plan.id}>{plan.action} <Icon name="chevron" /></Link>
              <small className={styles.planFootnote}>{plan.footnote}</small>
            </article>)}
          </div>
          <p className={styles.creditNote}>{copy.pricing.creditNote}</p>
        </section>

        <section className={styles.faq} id="perguntas" aria-labelledby="faq-title">
          <header className={`${styles.sectionHeading} ${styles.centered}`}>
            <p className={styles.kicker}>{copy.faq.kicker}</p>
            <h2 id="faq-title">{copy.faq.title}</h2>
          </header>
          <div className={styles.faqList}>
            {copy.faq.items.filter((item) => paymentsEnabled || !item.paid).map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <p className={styles.kicker}>{copy.finalCta.kicker}</p>
          <h2 id="final-cta-title">{copy.finalCta.title}</h2>
          <p className={styles.finalDescription}>{copy.finalCta.description}</p>
          <Link className={styles.primaryAction} href={planLoginHref('FREE')} data-plan-id="FREE">{copy.finalCta.action} <Icon name="chevron" /></Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <Link className={styles.brand} href="/"><span className={styles.brandMark} aria-hidden="true">M</span><span className={styles.brandName}>MasterMe</span></Link>
            <LandingNavigation copy={copy} label={copy.footer.navigationLabel} />
            <div className={styles.footerActions}>
              <a href="#planos">{copy.nav.plans}</a>
              <Link href="/entrar">{copy.signIn}</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>{copy.footer.description}</p>
            <span className={styles.footerMeta}>{copy.footer.principles}</span>
            <small className={styles.copyright}>© {new Date().getFullYear()} MasterMe</small>
          </div>
        </div>
      </footer>
    </div>
  )
}

// October 2026 starts on a Thursday; the mock stays static so the page renders
// the same on the server and in every locale.
function calendarCells(selectedDay: number, markedDays: readonly number[]) {
  const cells: { key: string; day: number | null; selected: boolean; marked: boolean }[] = []
  for (let index = 0; index < 4; index += 1) cells.push({ key: `blank-${index}`, day: null, selected: false, marked: false })
  for (let day = 1; day <= 31; day += 1) cells.push({ key: `day-${day}`, day, selected: day === selectedDay, marked: markedDays.includes(day) })
  while (cells.length % 7 !== 0) cells.push({ key: `tail-${cells.length}`, day: null, selected: false, marked: false })
  return cells
}
